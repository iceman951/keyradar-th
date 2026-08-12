import type { GameRepository } from './game-repository'
import { games } from './fixtures'
import type {
  Edition,
  EditionAvailability,
  Game,
  OfferSnapshot,
  PricePoint,
  Store
} from '$lib/domain/models'
import { getEditionAvailability } from '$lib/domain/editions'
import { bestThaiOffer } from '$lib/domain/pricing'
import { sortStoresByTrust } from '$lib/domain/stores'
import { reviveCatalog, snapshotFromCatalog } from '$lib/itad/revive'
import type { Catalog } from '$lib/itad/types'

export const CATALOG_URL = '/api/catalog'
/** How long to stay on the fallback after a failed load before trying again. */
const RETRY_AFTER_MS = 60_000

/**
 * Serves the whole app from a single `/api/catalog` document.
 *
 * Every repository method reads that one memoised blob, which is what keeps the
 * existing per-game `getOffers()` calls in `ResultsPage` and `Autocomplete` from
 * turning into a network fan-out once the data stops being local.
 */
export class KvGameRepository implements GameRepository {
  #promise: Promise<Catalog | null> | null = null
  #failedAt = 0

  constructor(private readonly fallback: GameRepository) {}

  /** Drops the memoised catalog so the next read genuinely refetches. */
  invalidate(): void {
    this.#promise = null
    this.#failedAt = 0
  }

  #load(): Promise<Catalog | null> {
    if (this.#promise) return this.#promise
    // Never pin the whole session to the fallback because of one boot-time blip.
    if (this.#failedAt && Date.now() - this.#failedAt < RETRY_AFTER_MS) {
      return Promise.resolve(null)
    }

    const pending = fetch(CATALOG_URL, {
      headers: { accept: 'application/json' }
    })
      .then(async (response) => {
        if (!response.ok) return null
        // A dev server answers unknown paths with the SPA shell: 200, but HTML.
        if (!response.headers.get('content-type')?.includes('application/json'))
          return null
        return reviveCatalog(await response.json())
      })
      .catch(() => null)
      .then((catalog) => {
        if (!catalog) {
          this.#failedAt = Date.now()
          this.#promise = null
        }
        return catalog
      })

    this.#promise = pending
    return pending
  }

  async listGames(): Promise<Game[]> {
    return games
  }

  async getGame(slug: string): Promise<Game | undefined> {
    return games.find((game) => game.slug === slug)
  }

  async searchGames(query: string): Promise<Game[]> {
    const normalized = query.trim().toLocaleLowerCase()
    if (!normalized) {
      return [...games].sort((a, b) => b.popularity - a.popularity).slice(0, 6)
    }
    return games.filter((game) =>
      game.title.toLocaleLowerCase().includes(normalized)
    )
  }

  async listStores(): Promise<Store[]> {
    const catalog = await this.#load()
    if (!catalog) return this.fallback.listStores()
    // Only stores that actually quoted a price this run.
    return sortStoresByTrust(catalog.stores)
  }

  async getOffers(
    gameSlug: string,
    editionKey = 'standard'
  ): Promise<OfferSnapshot> {
    const catalog = await this.#load()
    if (!catalog) return this.fallback.getOffers(gameSlug, editionKey)

    const game = catalog.games[gameSlug]
    // Fall back to whatever edition the catalog does carry, so a dropped edition
    // never renders as an empty page.
    const resolvedKey =
      game && !game.editions[editionKey]
        ? (Object.keys(game.editions)[0] ?? editionKey)
        : editionKey

    return snapshotFromCatalog(catalog, gameSlug, resolvedKey, Date.now())
  }

  async getEditionAvailability(
    gameSlug: string
  ): Promise<EditionAvailability[]> {
    const catalog = await this.#load()
    if (!catalog) return this.fallback.getEditionAvailability(gameSlug)

    const game = catalog.games[gameSlug]
    if (!game) return []

    const now = Date.now()
    return Object.entries(game.editions).map(([key, catalogEdition]) => {
      const edition: Edition = {
        key,
        name: catalogEdition.name,
        category: catalogEdition.category,
        steamPriceSatang: catalogEdition.steamPriceSatang
      }
      const snapshot = snapshotFromCatalog(catalog, gameSlug, key, now)
      return getEditionAvailability(edition, snapshot.offers)
    })
  }

  async getPriceHistory(gameSlug: string, days: number): Promise<PricePoint[]> {
    const points = await this.fallback.getPriceHistory(gameSlug, days)
    const catalog = await this.#load()
    if (!catalog || points.length === 0) return points

    // The series is still mock, but its final point must agree with the real
    // "lowest right now" figure rendered directly beneath the chart.
    const snapshot = await this.getOffers(gameSlug)
    const current = bestThaiOffer(snapshot.offers)?.finalSatang
    if (current === undefined) return points

    return points.map((point, index) =>
      index === points.length - 1 ? { ...point, priceSatang: current } : point
    )
  }
}
