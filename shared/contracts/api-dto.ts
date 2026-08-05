/**
 * Wire contracts for `/api/v1`.
 *
 * Rules that differ from the internal domain model:
 *  - money is always integer satang (never baht decimals);
 *  - store fee rates are integer basis points (5.2% -> 520), never floats;
 *  - timestamps are ISO 8601 strings, because JSON cannot carry `Date`;
 *  - offers carry `observedAt` rather than `updatedMinutesAgo`. A relative age
 *    baked into the body would be wrong the moment the response is served from
 *    cache, so `ApiGameRepository` computes the age from `observedAt` against
 *    the client clock.
 */
import type {
  EditionCategory,
  OfferFee,
  RegionCode,
  RegionStatus,
  StoreType
} from '../domain/models.ts';

export interface EditionDto {
  key: string;
  name: string;
  category: EditionCategory;
  steamPriceSatang: number;
}

export interface GameDto {
  slug: string;
  title: string;
  year: number;
  developer: string;
  publisher: string;
  releaseDate: string;
  genres: string[];
  reviewPercent: number;
  reviewCount: number;
  popularity: number;
  hue: number;
  editions: EditionDto[];
}

export interface StoreDto {
  id: string;
  name: string;
  initials: string;
  type: StoreType;
  payments: string[];
  /** Integer basis points. 5.2% is 520. Divided by 10000 at the UI boundary. */
  feeRateBps: number;
  feeLabel: string;
  note: string;
  websiteUrl: string;
}

export interface OfferDto {
  id: string;
  gameSlug: string;
  storeId: string;
  editionKey: string;
  editionName: string;
  editionCategory: EditionCategory;
  advertisedSatang: number;
  fees: OfferFee[];
  finalSatang: number;
  steamPriceSatang: number;
  region: RegionCode;
  regionStatus: RegionStatus;
  drm: string;
  inStock: boolean;
  /** ISO 8601. The client derives `updatedMinutesAgo` from this. */
  observedAt: string;
  sellerRating?: number;
  sellerReviewCount?: number;
  isHistoricalLow: boolean;
  purchaseUrl: string;
}

export interface OfferSnapshotDto {
  gameSlug: string;
  editionKey: string;
  offers: OfferDto[];
  fetchedAt: string;
  failedStores: string[];
  stale: boolean;
}

export interface EditionAvailabilityDto {
  editionKey: string;
  editionName: string;
  category: EditionCategory;
  steamPriceSatang: number;
  minimumPriceSatang: number | null;
  confirmedOfferCount: number;
  availableInThailand: boolean;
  status: 'available' | 'no-thai-offer';
}

export interface PricePointDto {
  /** ISO 8601. */
  date: string;
  priceSatang: number;
}

export interface HealthDto {
  status: string;
  service: string;
  version: string;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'GAME_NOT_FOUND'
  | 'EDITION_NOT_FOUND'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR'
  /** No route matches the request path. Not one of the spec's five required
   *  codes, but needed so an unknown `/api/*` path returns the same
   *  `ApiErrorDto` envelope as every other error instead of Elysia's default
   *  `application/problem+json` body. */
  | 'NOT_FOUND';

export interface ApiErrorDto {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type GameSortOrder = 'popular' | 'release' | 'title';
