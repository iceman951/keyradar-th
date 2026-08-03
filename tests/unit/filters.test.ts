import { describe, expect, it } from 'vitest';
import { MockGameRepository } from '$lib/data/mock-repository';
import {
  DEFAULT_GAME_FILTERS,
  filterOffers,
  selectDisplayedOffer
} from '$lib/domain/filters';
import type { GameFilters, Offer, Store } from '$lib/domain/models';
import { discountPercent } from '$lib/domain/pricing';
import { makeOffer, makeStore } from './helpers';

const permissiveFilters = (): GameFilters => ({
  ...DEFAULT_GAME_FILTERS,
  thailandOnly: false,
  inStockOnly: false,
  maxPriceSatang: Number.MAX_SAFE_INTEGER
});

describe('offer filters', () => {
  const repository = new MockGameRepository();

  it('applies every boolean offer filter', async () => {
    const snapshot = await repository.getOffers('it-takes-two');
    const stores = await repository.listStores();
    const checks: Array<{
      filters: Partial<GameFilters>;
      predicate: (offer: Offer, store: Store | undefined) => boolean;
    }> = [
      { filters: { thailandOnly: true }, predicate: (offer) => offer.regionStatus === 'confirmed' },
      { filters: { steamOnly: true }, predicate: (offer) => offer.drm.toLowerCase().includes('steam') },
      {
        filters: { officialOnly: true },
        predicate: (_offer, store) => store?.type === 'official' || store?.type === 'steam'
      },
      { filters: { excludeMarketplace: true }, predicate: (_offer, store) => store?.type !== 'marketplace' },
      { filters: { inStockOnly: true }, predicate: (offer) => offer.inStock },
      { filters: { historicalLowOnly: true }, predicate: (offer) => offer.isHistoricalLow },
      { filters: { noAdditionalFeeOnly: true }, predicate: (offer) => offer.fees.length === 0 }
    ];
    const storesById = new Map(stores.map((store) => [store.id, store]));

    for (const check of checks) {
      const filtered = filterOffers(
        snapshot.offers,
        stores,
        { ...permissiveFilters(), ...check.filters }
      );
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((offer) => check.predicate(offer, storesById.get(offer.storeId)))).toBe(true);
    }
  });

  it('applies maximum price, minimum discount, and edition category filters', async () => {
    const snapshot = await repository.getOffers('elden-ring');
    const stores = await repository.listStores();
    const maxPriceSatang = snapshot.offers[3].finalSatang;
    const byPrice = filterOffers(snapshot.offers, stores, {
      ...permissiveFilters(),
      maxPriceSatang
    });
    expect(byPrice.every((offer) => offer.finalSatang <= maxPriceSatang)).toBe(true);

    const byDiscount = filterOffers(snapshot.offers, stores, {
      ...permissiveFilters(),
      minDiscountPercent: 35
    });
    expect(byDiscount.every((offer) => discountPercent(offer) >= 35)).toBe(true);

    const mixedEditions = [
      snapshot.offers[0],
      { ...snapshot.offers[1], editionKey: 'deluxe', editionCategory: 'deluxe' as const }
    ];
    const byEdition = filterOffers(mixedEditions, stores, {
      ...permissiveFilters(),
      editionCategory: 'deluxe'
    });
    expect(byEdition).toHaveLength(1);
    expect(byEdition[0].editionCategory).toBe('deluxe');
  });

  it('filters all candidates before choosing a displayed offer', () => {
    const marketplace = makeStore({ id: 'market', name: 'Marketplace', type: 'marketplace' });
    const official = makeStore({ id: 'official', name: 'Official', type: 'official' });
    const candidates = [
      makeOffer({ id: 'cheap-market', storeId: 'market', finalSatang: 20_000 }),
      makeOffer({ id: 'official-offer', storeId: 'official', finalSatang: 30_000 })
    ];
    expect(selectDisplayedOffer(candidates, [marketplace, official], {
      ...permissiveFilters(),
      excludeMarketplace: true
    })?.id).toBe('official-offer');
  });
});
