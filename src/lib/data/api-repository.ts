import type { GameRepository } from './game-repository'
import type {
  EditionAvailability,
  Game,
  Offer,
  OfferFee,
  OfferSnapshot,
  PricePoint,
  Store
} from '$lib/domain/models'
import type {
  ApiErrorDto,
  EditionAvailabilityDto,
  EditionDto,
  GameDto,
  OfferDto,
  OfferSnapshotDto,
  PricePointDto,
  StoreDto
} from '../../../shared/contracts/api-dto.ts'

/**
 * Thrown for anything that isn't a recognized "this resource doesn't exist"
 * response. Its message is safe to surface in the existing error UI states
 * (`loadState = { status: 'error', message: ... }` in
 * `src/routes/games/[slug]/+page.svelte`), matching how `MockGameRepository`
 * throws a plain `Error` for its `offerMode: 'error'`.
 */
class ApiRequestError extends Error {}

type FetchResult<T> =
  { ok: true; body: T } | { ok: false; status: number; code?: string }

const throwForFailure = (result: {
  ok: false
  status: number
  code?: string
}): never => {
  throw new ApiRequestError(
    result.code
      ? `คำขอไปยัง API ล้มเหลว (${result.code})`
      : `คำขอไปยัง API ล้มเหลว (HTTP ${result.status})`
  )
}

const isApiErrorDto = (value: unknown): value is ApiErrorDto =>
  typeof value === 'object' &&
  value !== null &&
  'error' in value &&
  typeof (value as { error?: unknown }).error === 'object'

const toEdition = (dto: EditionDto) => ({ ...dto })

const toGame = (dto: GameDto): Game => ({
  slug: dto.slug,
  title: dto.title,
  year: dto.year,
  developer: dto.developer,
  publisher: dto.publisher,
  releaseDate: dto.releaseDate,
  genres: dto.genres,
  reviewPercent: dto.reviewPercent,
  reviewCount: dto.reviewCount,
  popularity: dto.popularity,
  hue: dto.hue,
  editions: dto.editions.map(toEdition)
})

const toStore = (dto: StoreDto): Store => ({
  id: dto.id,
  name: dto.name,
  initials: dto.initials,
  type: dto.type,
  payments: dto.payments,
  // Integer basis points -> the fraction the existing frontend Store type
  // expects (520 -> 0.052), matching IMPLEMENTATION_SPEC.md §8.3.
  feeRate: dto.feeRateBps / 10_000,
  feeLabel: dto.feeLabel,
  note: dto.note,
  websiteUrl: dto.websiteUrl
})

const minutesAgo = (isoDate: string): number =>
  Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 60_000))

const toOffer = (dto: OfferDto): Offer => ({
  id: dto.id,
  gameSlug: dto.gameSlug,
  storeId: dto.storeId,
  editionKey: dto.editionKey,
  editionName: dto.editionName,
  editionCategory: dto.editionCategory,
  advertisedSatang: dto.advertisedSatang,
  fees: dto.fees as OfferFee[],
  finalSatang: dto.finalSatang,
  steamPriceSatang: dto.steamPriceSatang,
  region: dto.region,
  regionStatus: dto.regionStatus,
  drm: dto.drm,
  inStock: dto.inStock,
  updatedMinutesAgo: minutesAgo(dto.observedAt),
  sellerRating: dto.sellerRating,
  sellerReviewCount: dto.sellerReviewCount,
  isHistoricalLow: dto.isHistoricalLow,
  purchaseUrl: dto.purchaseUrl
})

const toOfferSnapshot = (dto: OfferSnapshotDto): OfferSnapshot => ({
  gameSlug: dto.gameSlug,
  editionKey: dto.editionKey,
  offers: dto.offers.map(toOffer),
  fetchedAt: new Date(dto.fetchedAt),
  failedStores: dto.failedStores,
  stale: dto.stale
})

const toEditionAvailability = (
  dto: EditionAvailabilityDto
): EditionAvailability => ({ ...dto })

const toPricePoint = (dto: PricePointDto): PricePoint => ({
  date: new Date(dto.date),
  priceSatang: dto.priceSatang
})

export class ApiGameRepository implements GameRepository {
  constructor(private readonly baseUrl: string = '/api/v1') {}

  /** The one place a `fetch` happens. Never throws — every failure mode is
   *  reported through the return value so callers can decide per-endpoint
   *  whether a given error code means "throw" or "fall back". */
  private async fetchJson<T>(path: string): Promise<FetchResult<T>> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`)
    } catch {
      throw new ApiRequestError(
        'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง'
      )
    }

    if (!response.ok) {
      let code: string | undefined
      try {
        const body: unknown = await response.json()
        if (isApiErrorDto(body)) code = body.error.code
      } catch {
        // Malformed error body; fall through with `code` undefined.
      }
      return { ok: false, status: response.status, code }
    }

    try {
      return { ok: true, body: (await response.json()) as T }
    } catch {
      throw new ApiRequestError('ได้รับข้อมูลจาก API ในรูปแบบที่ไม่ถูกต้อง')
    }
  }

  /** Throws for any failure result, mapping the error code to a Thai message. */
  private async request<T>(path: string): Promise<T> {
    const result = await this.fetchJson<T>(path)
    return result.ok ? result.body : throwForFailure(result)
  }

  async listGames(): Promise<Game[]> {
    const dtos = await this.request<GameDto[]>('/games')
    return dtos.map(toGame)
  }

  async getGame(slug: string): Promise<Game | undefined> {
    const result = await this.fetchJson<GameDto>(
      `/games/${encodeURIComponent(slug)}`
    )
    if (!result.ok) {
      if (result.code === 'GAME_NOT_FOUND') return undefined
      return throwForFailure(result)
    }
    return toGame(result.body)
  }

  async searchGames(query: string): Promise<Game[]> {
    const trimmed = query.trim()
    // The API rejects an empty `q` (min length 1). `MockGameRepository`
    // returns the top 6 most popular games for an empty query instead of an
    // empty result, so mirror that through `/games` rather than `/search`.
    const dtos = trimmed
      ? await this.request<GameDto[]>(
          `/search?q=${encodeURIComponent(trimmed)}`
        )
      : await this.request<GameDto[]>('/games?limit=6&sort=popular')
    return dtos.map(toGame)
  }

  async listStores(): Promise<Store[]> {
    const dtos = await this.request<StoreDto[]>('/stores')
    return dtos.map(toStore)
  }

  /**
   * `MockGameRepository`:
   *  - an unknown `gameSlug` returns an *empty* snapshot, it never throws;
   *  - an unrecognized `editionKey` silently falls back to the game's first
   *    edition (`game.editions.find(...) ?? game.editions[0]`).
   *
   * The API is intentionally stricter for both (404 GAME_NOT_FOUND / 404
   * EDITION_NOT_FOUND — required by IMPLEMENTATION_SPEC.md §18.3, so the raw
   * endpoint stays testable), so both are translated back to the mock's
   * contract here rather than propagated as errors.
   */
  async getOffers(
    gameSlug: string,
    editionKey?: string
  ): Promise<OfferSnapshot> {
    const query = editionKey
      ? `?editionKey=${encodeURIComponent(editionKey)}`
      : ''
    const result = await this.fetchJson<OfferSnapshotDto>(
      `/games/${encodeURIComponent(gameSlug)}/offers${query}`
    )

    if (result.ok) return toOfferSnapshot(result.body)

    if (result.code === 'GAME_NOT_FOUND') {
      return {
        gameSlug,
        editionKey: editionKey ?? '',
        offers: [],
        fetchedAt: new Date(),
        failedStores: [],
        stale: false
      }
    }

    if (result.code === 'EDITION_NOT_FOUND' && editionKey) {
      return this.getOffers(gameSlug) // retry against the default edition
    }

    return throwForFailure(result)
  }

  async getEditionAvailability(
    gameSlug: string
  ): Promise<EditionAvailability[]> {
    const result = await this.fetchJson<EditionAvailabilityDto[]>(
      `/games/${encodeURIComponent(gameSlug)}/editions`
    )
    if (!result.ok) {
      if (result.code === 'GAME_NOT_FOUND') return []
      return throwForFailure(result)
    }
    return result.body.map(toEditionAvailability)
  }

  async getPriceHistory(gameSlug: string, days: number): Promise<PricePoint[]> {
    const result = await this.fetchJson<PricePointDto[]>(
      `/games/${encodeURIComponent(gameSlug)}/price-history?days=${encodeURIComponent(String(days))}`
    )
    if (!result.ok) {
      if (result.code === 'GAME_NOT_FOUND') return []
      return throwForFailure(result)
    }
    return result.body.map(toPricePoint)
  }
}
