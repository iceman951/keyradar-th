/**
 * Pricing rules shared by the mock repository, the D1 seed generator, and the
 * Worker. Framework-neutral so it can run under plain Node (the seed script)
 * as well as be bundled into the browser and Worker builds.
 */
import type { Offer } from './models.ts';

export const offerFeeTotal = (offer: Pick<Offer, 'fees'>): number =>
  offer.fees.reduce((total, fee) => total + fee.amountSatang, 0);

export const hasAdditionalFees = (offer: Pick<Offer, 'fees'>): boolean =>
  offer.fees.length > 0;

export const hasConsistentFinalPrice = (
  offer: Pick<Offer, 'advertisedSatang' | 'fees' | 'finalSatang'>
): boolean => offer.finalSatang === offer.advertisedSatang + offerFeeTotal(offer);

export const discountPercent = (
  offer: Pick<Offer, 'finalSatang' | 'steamPriceSatang'>
): number => {
  if (offer.steamPriceSatang <= 0) return 0;
  return Math.max(0, Math.round((1 - offer.finalSatang / offer.steamPriceSatang) * 100));
};

export const compareOffersByFinalPrice = (a: Offer, b: Offer): number =>
  a.finalSatang - b.finalSatang ||
  a.updatedMinutesAgo - b.updatedMinutesAgo ||
  a.storeId.localeCompare(b.storeId, 'en');

export const confirmedThaiOffers = (offers: readonly Offer[]): Offer[] =>
  offers
    .filter((offer) => offer.regionStatus === 'confirmed' && offer.inStock)
    .sort(compareOffersByFinalPrice);

export const bestThaiOffer = (offers: readonly Offer[]): Offer | undefined =>
  confirmedThaiOffers(offers)[0];
