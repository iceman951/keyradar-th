import { describe, expect, it } from 'vitest'
import { MockGameRepository } from '$lib/data/mock-repository'
import { stores } from '$lib/data/fixtures'
import { regionPresentation } from '$lib/domain/presentation'
import { hasConsistentFinalPrice } from '$lib/domain/pricing'
import { regionStatusFor } from '../../shared/seed/catalog'
import type { RegionCode } from '$lib/domain/models'

describe('mock repository', () => {
  const repository = new MockGameRepository()

  it('returns deterministic snapshots with valid integer-satang prices', async () => {
    const first = await repository.getOffers('elden-ring')
    const second = await repository.getOffers('elden-ring')
    expect(first.offers).toHaveLength(stores.length)
    expect(first).toEqual(second)
    expect(first.stale).toBe(false)
    expect(first.failedStores).toEqual([])
    expect(first.offers.map((offer) => offer.finalSatang)).toEqual(
      [...first.offers]
        .sort((a, b) => a.finalSatang - b.finalSatang)
        .map((offer) => offer.finalSatang)
    )
    expect(
      first.offers.every(
        (offer) =>
          Number.isInteger(offer.advertisedSatang) &&
          Number.isInteger(offer.finalSatang) &&
          offer.fees.every((fee) => Number.isInteger(fee.amountSatang)) &&
          hasConsistentFinalPrice(offer)
      )
    ).toBe(true)
    expect(
      first.offers.every(
        (offer) => new URL(offer.purchaseUrl).protocol === 'https:'
      )
    ).toBe(true)
  })

  it('searches case-insensitively and returns popular games for an empty query', async () => {
    expect(
      (await repository.searchGames('forest')).map((game) => game.slug)
    ).toContain('the-forest')
    expect((await repository.searchGames(''))[0].slug).toBe('elden-ring')
  })

  it('derives region status from the shared catalog and presentation layer', async () => {
    const snapshot = await repository.getOffers('helldivers-2')
    // `shared/seed/catalog.ts` is the one place region is assigned — the mock
    // repository and the D1 seed generator both read it, so they cannot disagree.
    const expected: RegionCode[] = [
      'global',
      'sea',
      'thailand',
      'row',
      'eu',
      'north-america'
    ]
    expect(new Set(snapshot.offers.map((offer) => offer.region))).toEqual(
      new Set(expected)
    )
    expect(
      snapshot.offers.every(
        (offer) =>
          offer.regionStatus === regionStatusFor(offer.region) &&
          offer.regionStatus === regionPresentation(offer.region).status
      )
    ).toBe(true)
  })

  it('retains offer rows and identifies failed stores in stale snapshots', async () => {
    const stale = await new MockGameRepository({
      offerMode: 'store-down'
    }).getOffers('elden-ring')
    expect(stale.stale).toBe(true)
    expect(stale.offers).toHaveLength(stores.length)
    expect(stale.failedStores).toEqual(['gamesplanet', 'gamersgate'])
  })

  it('provides a deterministic repository error mode', async () => {
    await expect(
      new MockGameRepository({ offerMode: 'error' }).getOffers('elden-ring')
    ).rejects.toThrow('ไม่สามารถดึงข้อมูลราคาจากร้านค้าได้')
  })

  it('returns explicit empty results for unknown games instead of another game data', async () => {
    const snapshot = await repository.getOffers('missing-game')
    expect(snapshot.gameSlug).toBe('missing-game')
    expect(snapshot.offers).toEqual([])
    expect(await repository.getEditionAvailability('missing-game')).toEqual([])
  })

  it('marks a confirmed current minimum as historical-low mock data', async () => {
    const snapshot = await repository.getOffers('elden-ring')
    const lows = snapshot.offers.filter((offer) => offer.isHistoricalLow)
    expect(lows).toHaveLength(1)
    expect(lows[0].regionStatus).toBe('confirmed')
    expect(lows[0].inStock).toBe(true)
  })
})
