import { describe, expect, it } from 'vitest';
import { bestThaiOffer, discountPercent } from '$lib/domain/pricing';
import type { Offer } from '$lib/domain/models';

const offer = (id: string, finalSatang: number, regionStatus: Offer['regionStatus'], inStock = true): Offer => ({
  id, gameSlug: 'game', storeId: id, editionKey: 'standard', advertisedSatang: finalSatang,
  feeSatang: 0, finalSatang, steamPriceSatang: 100000, region: 'Global', regionStatus,
  drm: 'Steam Key', inStock, updatedMinutesAgo: 5
});

describe('pricing', () => {
  it('selects the cheapest in-stock Thailand-compatible offer', () => {
    expect(bestThaiOffer([offer('blocked', 10000, 'blocked'), offer('cheap', 40000, 'confirmed'), offer('stock', 30000, 'confirmed', false)])?.id).toBe('cheap');
  });
  it('calculates discount from integer satang values', () => {
    expect(discountPercent(offer('deal', 55000, 'confirmed'))).toBe(45);
  });
});
