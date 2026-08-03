import { describe, expect, it } from 'vitest';
import { MockGameRepository } from '$lib/data/mock-repository';
import { getEditionAvailability } from '$lib/domain/editions';
import type { Edition } from '$lib/domain/models';
import { makeOffer } from './helpers';

const deluxe: Edition = {
  key: 'deluxe',
  name: 'Deluxe Edition',
  category: 'deluxe',
  steamPriceSatang: 150_000
};

describe('edition availability', () => {
  it('uses the actual minimum confirmed in-stock price for every edition', async () => {
    const repository = new MockGameRepository();
    const game = await repository.getGame('elden-ring');
    const availability = await repository.getEditionAvailability('elden-ring');
    expect(availability).toHaveLength(game?.editions.length ?? 0);
    for (const item of availability) {
      const snapshot = await repository.getOffers('elden-ring', item.editionKey);
      const expected = snapshot.offers
        .filter((offer) => offer.regionStatus === 'confirmed' && offer.inStock)
        .sort((a, b) => a.finalSatang - b.finalSatang)[0]?.finalSatang ?? null;
      expect(item.minimumPriceSatang).toBe(expected);
      expect(item.availableInThailand).toBe(expected !== null);
      expect(item.status).toBe(expected === null ? 'no-thai-offer' : 'available');
    }
  });

  it('returns explicit no-Thai availability for uncertain, blocked, or out-of-stock offers', () => {
    const availability = getEditionAvailability(deluxe, [
      makeOffer({ editionKey: 'deluxe', editionCategory: 'deluxe', region: 'eu', regionStatus: 'uncertain' }),
      makeOffer({ editionKey: 'deluxe', editionCategory: 'deluxe', inStock: false })
    ]);
    expect(availability.availableInThailand).toBe(false);
    expect(availability.minimumPriceSatang).toBeNull();
    expect(availability.confirmedOfferCount).toBe(0);
    expect(availability.status).toBe('no-thai-offer');
  });
});
