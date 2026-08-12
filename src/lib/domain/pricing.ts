/**
 * Framework-neutral; lives in `shared/` so the mock repository, the D1 seed
 * generator, and the Worker share one pricing implementation. Re-exported
 * here so existing `$lib/domain/pricing` imports keep working.
 */
export {
  bestThaiOffer,
  compareOffersByFinalPrice,
  confirmedThaiOffers,
  discountPercent,
  hasAdditionalFees,
  hasConsistentFinalPrice,
  offerFeeTotal
} from '../../../shared/domain/pricing.ts';
