import type { Offer, Store } from '$lib/domain/models';

export const makeOffer = (overrides: Partial<Offer> = {}): Offer => ({
  id: 'game-standard-store',
  gameSlug: 'game',
  storeId: 'store',
  editionKey: 'standard',
  editionName: 'Standard Edition',
  editionCategory: 'standard',
  advertisedSatang: 50_000,
  fees: [],
  finalSatang: 50_000,
  steamPriceSatang: 100_000,
  region: 'global',
  regionStatus: 'confirmed',
  drm: 'Steam Key',
  inStock: true,
  updatedMinutesAgo: 5,
  isHistoricalLow: false,
  purchaseUrl: 'https://example.com/game',
  ...overrides
});

export const makeStore = (overrides: Partial<Store> = {}): Store => ({
  id: 'store',
  name: 'Store',
  initials: 'ST',
  type: 'official',
  payments: ['บัตรเครดิต/เดบิต'],
  feeRate: 0,
  feeLabel: '',
  note: 'ร้านค้าสำหรับการทดสอบ',
  websiteUrl: 'https://example.com/',
  ...overrides
});
