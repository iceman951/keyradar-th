import { describe, expect, it } from 'vitest';
import {
  bestThaiOffer,
  discountPercent,
  hasAdditionalFees,
  hasConsistentFinalPrice,
  offerFeeTotal
} from '$lib/domain/pricing';
import { makeOffer } from './helpers';

describe('pricing', () => {
  it('selects the cheapest confirmed in-stock offer without mutating the input', () => {
    const offers = [
      makeOffer({ id: 'blocked', finalSatang: 10_000, region: 'north-america', regionStatus: 'blocked' }),
      makeOffer({ id: 'cheap', finalSatang: 40_000 }),
      makeOffer({ id: 'stock', finalSatang: 30_000, inStock: false })
    ];
    const originalOrder = offers.map((offer) => offer.id);
    expect(bestThaiOffer(offers)?.id).toBe('cheap');
    expect(offers.map((offer) => offer.id)).toEqual(originalOrder);
  });

  it('calculates discounts from integer satang values', () => {
    expect(discountPercent(makeOffer({ finalSatang: 55_000 }))).toBe(45);
    expect(discountPercent(makeOffer({ steamPriceSatang: 0 }))).toBe(0);
  });

  it('totals itemized fees and enforces the final price invariant', () => {
    const offer = makeOffer({
      advertisedSatang: 45_000,
      fees: [
        { kind: 'platform', label: 'ค่าบริการแพลตฟอร์ม', amountSatang: 2_500 },
        { kind: 'payment', label: 'ค่าธรรมเนียมการชำระเงิน', amountSatang: 1_500 }
      ],
      finalSatang: 49_000
    });
    expect(offerFeeTotal(offer)).toBe(4_000);
    expect(hasAdditionalFees(offer)).toBe(true);
    expect(hasConsistentFinalPrice(offer)).toBe(true);
    expect(hasConsistentFinalPrice({ ...offer, finalSatang: 48_999 })).toBe(false);
  });
});
