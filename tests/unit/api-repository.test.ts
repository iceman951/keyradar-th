import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiGameRepository } from '$lib/data/api-repository'
import type {
  GameDto,
  OfferSnapshotDto,
  StoreDto
} from '../../shared/contracts/api-dto'

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  })

const errorEnvelope = (code: string, message = 'nope') =>
  jsonResponse(
    { error: { code, message } },
    code === 'VALIDATION_ERROR' ? 400 : 404
  )

const sampleGameDto: GameDto = {
  slug: 'valheim',
  title: 'Valheim',
  year: 2021,
  developer: 'Iron Gate AB',
  publisher: 'Coffee Stain Publishing',
  releaseDate: '2 ก.พ. 2564',
  genres: ['เอาชีวิตรอด'],
  reviewPercent: 94,
  reviewCount: 461220,
  popularity: 92,
  hue: 188,
  editions: [
    {
      key: 'standard',
      name: 'Standard Edition',
      category: 'standard',
      steamPriceSatang: 41_500
    }
  ]
}

const sampleStoreDto: StoreDto = {
  id: 'eneba',
  name: 'Eneba',
  initials: 'EN',
  type: 'marketplace',
  payments: ['บัตรเครดิต/เดบิต'],
  feeRateBps: 520,
  feeLabel: 'ค่าบริการแพลตฟอร์ม',
  note: 'note',
  websiteUrl: 'https://www.eneba.com/'
}

describe('ApiGameRepository', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps GameDto[] to Game[] and requests the correct URL', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([sampleGameDto]))
    const repo = new ApiGameRepository()
    const games = await repo.listGames()

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/games')
    expect(games).toEqual([sampleGameDto])
  })

  it('divides feeRateBps by 10000 into Store.feeRate', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([sampleStoreDto]))
    const repo = new ApiGameRepository()
    const [store] = await repo.listStores()

    expect(store.feeRate).toBeCloseTo(0.052)
  })

  it('converts OfferSnapshotDto ISO strings to Date and observedAt to updatedMinutesAgo', async () => {
    const observedAt = new Date(Date.now() - 5 * 60_000).toISOString()
    const fetchedAt = new Date().toISOString()
    const snapshot: OfferSnapshotDto = {
      gameSlug: 'valheim',
      editionKey: 'standard',
      fetchedAt,
      failedStores: [],
      stale: false,
      offers: [
        {
          id: 'valheim-standard-eneba',
          gameSlug: 'valheim',
          storeId: 'eneba',
          editionKey: 'standard',
          editionName: 'Standard Edition',
          editionCategory: 'standard',
          advertisedSatang: 20_000,
          fees: [],
          finalSatang: 20_000,
          steamPriceSatang: 41_500,
          region: 'global',
          regionStatus: 'confirmed',
          drm: 'Steam Key',
          inStock: true,
          observedAt,
          isHistoricalLow: true,
          purchaseUrl: 'https://www.eneba.com/store'
        }
      ]
    }
    fetchMock.mockResolvedValueOnce(jsonResponse(snapshot))
    const repo = new ApiGameRepository()
    const result = await repo.getOffers('valheim', 'standard')

    expect(result.fetchedAt).toBeInstanceOf(Date)
    expect(result.fetchedAt.toISOString()).toBe(fetchedAt)
    expect(result.offers[0].updatedMinutesAgo).toBeGreaterThanOrEqual(4)
    expect(result.offers[0].updatedMinutesAgo).toBeLessThanOrEqual(6)
  })

  it('URL-encodes slugs, queries, and edition keys', async () => {
    fetchMock.mockResolvedValue(jsonResponse(sampleGameDto))
    const repo = new ApiGameRepository()

    await repo.getGame('a slug/weird')
    expect(fetchMock).toHaveBeenLastCalledWith('/api/v1/games/a%20slug%2Fweird')

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        gameSlug: 'valheim',
        editionKey: 'gold edition',
        offers: [],
        fetchedAt: new Date().toISOString(),
        failedStores: [],
        stale: false
      })
    )
    await repo.getOffers('valheim', 'gold edition')
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/v1/games/valheim/offers?editionKey=gold%20edition'
    )

    fetchMock.mockResolvedValueOnce(jsonResponse([sampleGameDto]))
    await repo.searchGames('el den ring')
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/v1/search?q=el%20den%20ring'
    )
  })

  it('routes an empty search query to /games?limit=6&sort=popular instead of /search', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([sampleGameDto]))
    const repo = new ApiGameRepository()
    await repo.searchGames('   ')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/games?limit=6&sort=popular')
  })

  it('throws with the error code on a 400 envelope', async () => {
    fetchMock.mockResolvedValueOnce(errorEnvelope('VALIDATION_ERROR'))
    const repo = new ApiGameRepository()
    await expect(repo.searchGames('x')).rejects.toThrow('VALIDATION_ERROR')
  })

  it('resolves getGame to undefined on a 404 GAME_NOT_FOUND envelope', async () => {
    fetchMock.mockResolvedValueOnce(errorEnvelope('GAME_NOT_FOUND'))
    const repo = new ApiGameRepository()
    await expect(repo.getGame('missing')).resolves.toBeUndefined()
  })

  it('returns an empty, non-stale snapshot for GAME_NOT_FOUND on getOffers (mock parity)', async () => {
    fetchMock.mockResolvedValueOnce(errorEnvelope('GAME_NOT_FOUND'))
    const repo = new ApiGameRepository()
    const snapshot = await repo.getOffers('missing')

    expect(snapshot.offers).toEqual([])
    expect(snapshot.stale).toBe(false)
    expect(snapshot.failedStores).toEqual([])
  })

  it('retries against the default edition on EDITION_NOT_FOUND (mock parity)', async () => {
    fetchMock
      .mockResolvedValueOnce(errorEnvelope('EDITION_NOT_FOUND'))
      .mockResolvedValueOnce(
        jsonResponse({
          gameSlug: 'valheim',
          editionKey: 'standard',
          offers: [],
          fetchedAt: new Date().toISOString(),
          failedStores: [],
          stale: false
        })
      )
    const repo = new ApiGameRepository()
    const snapshot = await repo.getOffers('valheim', 'unknown-edition')

    expect(snapshot.editionKey).toBe('standard')
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/v1/games/valheim/offers?editionKey=unknown-edition'
    )
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v1/games/valheim/offers')
  })

  it('returns [] for GAME_NOT_FOUND on getEditionAvailability and getPriceHistory (mock parity)', async () => {
    fetchMock.mockResolvedValueOnce(errorEnvelope('GAME_NOT_FOUND'))
    const repo = new ApiGameRepository()
    await expect(repo.getEditionAvailability('missing')).resolves.toEqual([])

    fetchMock.mockResolvedValueOnce(errorEnvelope('GAME_NOT_FOUND'))
    await expect(repo.getPriceHistory('missing', 30)).resolves.toEqual([])
  })

  it('throws a safe error on a malformed (non-JSON) response body', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('not json', {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    )
    const repo = new ApiGameRepository()
    await expect(repo.listGames()).rejects.toThrow()
  })

  it('throws a safe error on a network failure', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const repo = new ApiGameRepository()
    await expect(repo.listGames()).rejects.toThrow()
  })
})
