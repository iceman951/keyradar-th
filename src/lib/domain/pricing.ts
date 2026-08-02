import type { Offer } from './models';

export const discountPercent = (offer: Offer): number =>
  Math.max(0, Math.round((1 - offer.finalSatang / offer.steamPriceSatang) * 100));

export const bestThaiOffer = (offers: Offer[]): Offer | undefined =>
  offers
    .filter((offer) => offer.regionStatus === 'confirmed' && offer.inStock)
    .sort((a, b) => a.finalSatang - b.finalSatang)[0];
