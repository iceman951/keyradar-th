export type StoreType = 'steam' | 'official' | 'reseller' | 'marketplace'

export type RegionCode =
  'global' | 'sea' | 'thailand' | 'eu' | 'row' | 'north-america'

export type RegionStatus = 'confirmed' | 'uncertain' | 'blocked'
export type RegionTone = 'success' | 'warning' | 'error'
export type EditionCategory =
  'standard' | 'deluxe' | 'complete' | 'dlc' | 'bundle'
export type EmptyStateKind =
  'no-results' | 'no-th' | 'no-price' | 'no-deals' | 'store-down'
export type OfferFeeKind = 'platform' | 'buyer-protection' | 'payment'

export interface RegionPresentation {
  code: RegionCode
  label: string
  status: RegionStatus
  statusLabel: string
  description: string
  tone: RegionTone
}

export interface Edition {
  key: string
  name: string
  category: EditionCategory
  steamPriceSatang: number
  /**
   * In ITAD an edition is a separate game entry, so each edition resolves to its
   * own id. `itadTitle` overrides the derived lookup title; `itadId` pins the
   * result outright when a title lookup keeps missing. Unset for D1-backed data
   * (Phase 1 has no ITAD sync yet).
   */
  itadTitle?: string
  itadId?: string
  steamAppId?: number
}

export interface Game {
  slug: string
  /** Base game's Steam app id — the standard edition's, used for real THB pricing. */
  steamAppId?: number
  title: string
  year: number
  developer: string
  publisher: string
  releaseDate: string
  genres: string[]
  reviewPercent: number
  reviewCount: number
  popularity: number
  hue: number
  editions: Edition[]
}

export interface Store {
  id: string
  name: string
  initials: string
  type: StoreType
  payments: string[]
  feeRate: number
  feeLabel: string
  note: string
  websiteUrl: string
  /** ITAD shop id. Unset for D1-backed data (Phase 1 has no ITAD sync yet). */
  itadShopId?: number
}

export interface OfferFee {
  kind: OfferFeeKind
  label: string
  amountSatang: number
}

export interface Offer {
  id: string
  gameSlug: string
  storeId: string
  editionKey: string
  editionName: string
  editionCategory: EditionCategory
  advertisedSatang: number
  fees: OfferFee[]
  finalSatang: number
  steamPriceSatang: number
  region: RegionCode
  regionStatus: RegionStatus
  drm: string
  inStock: boolean
  updatedMinutesAgo: number
  sellerRating?: number
  sellerReviewCount?: number
  isHistoricalLow: boolean
  purchaseUrl: string
  /** Currency the store actually quoted, when it was not THB. Unset for D1-backed data (Phase 1 has no currency conversion yet). */
  sourceCurrency?: string
  /** True when the price shown was converted into THB rather than quoted in it. */
  approximate?: boolean
  /** Coupon code required to reach the advertised price. */
  voucherCode?: string
}

export interface PricePoint {
  date: Date
  priceSatang: number
}

export interface GameFilters {
  thailandOnly: boolean
  steamOnly: boolean
  officialOnly: boolean
  excludeMarketplace: boolean
  inStockOnly: boolean
  historicalLowOnly: boolean
  noAdditionalFeeOnly: boolean
  maxPriceSatang: number
  minDiscountPercent: number
  editionCategory: EditionCategory | 'all'
}

export interface OfferSnapshot {
  gameSlug: string
  editionKey: string
  offers: Offer[]
  fetchedAt: Date
  failedStores: string[]
  stale: boolean
}

export type OfferLoadState =
  | { status: 'loading' }
  | { status: 'ready'; snapshot: OfferSnapshot }
  | { status: 'refreshing'; snapshot: OfferSnapshot }
  | { status: 'stale'; snapshot: OfferSnapshot; message: string }
  | { status: 'error'; message: string; previousSnapshot?: OfferSnapshot }

export interface EditionAvailability {
  editionKey: string
  editionName: string
  category: EditionCategory
  steamPriceSatang: number
  minimumPriceSatang: number | null
  confirmedOfferCount: number
  availableInThailand: boolean
  status: 'available' | 'no-thai-offer'
}
