/**
 * The domain model is framework-neutral and lives in `shared/` so the
 * Cloudflare Worker, the D1 seed generator, and the SvelteKit app all compile
 * against one definition. This module re-exports it so every existing
 * `$lib/domain/models` import keeps working unchanged.
 */
export type {
  Edition,
  EditionAvailability,
  EditionCategory,
  EmptyStateKind,
  Game,
  GameFilters,
  Offer,
  OfferFee,
  OfferFeeKind,
  OfferLoadState,
  OfferSnapshot,
  PricePoint,
  RegionCode,
  RegionPresentation,
  RegionStatus,
  RegionTone,
  Store,
  StoreType
} from '../../../shared/domain/models.ts'
