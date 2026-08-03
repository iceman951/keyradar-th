import type { Edition, EditionAvailability, Offer } from './models';
import { bestThaiOffer, confirmedThaiOffers } from './pricing';

export const getEditionAvailability = (
  edition: Edition,
  offers: readonly Offer[]
): EditionAvailability => {
  const editionOffers = offers.filter((offer) => offer.editionKey === edition.key);
  const confirmed = confirmedThaiOffers(editionOffers);
  const best = bestThaiOffer(editionOffers);
  return {
    editionKey: edition.key,
    editionName: edition.name,
    category: edition.category,
    steamPriceSatang: edition.steamPriceSatang,
    minimumPriceSatang: best?.finalSatang ?? null,
    confirmedOfferCount: confirmed.length,
    availableInThailand: confirmed.length > 0,
    status: confirmed.length > 0 ? 'available' : 'no-thai-offer'
  };
};
