// Shared by the browser bundle and the Cloudflare Worker.
// Only relative imports here — wrangler bundles with esbuild, which has no `$lib` alias.
import type { EditionCategory, RegionCode, Store } from '../domain/models'

/* ── IsThereAnyDeal API ───────────────────────────────────────────────────── */

export interface ItadAmount {
  /** Major units, e.g. 29.99 */
  amount: number
  /** Minor units, e.g. 2999. Present for every currency, so THB maps 1:1 to satang. */
  amountInt: number
  currency: string
}

export interface ItadNamed {
  id: number
  name: string
}

export interface ItadDeal {
  shop: ItadNamed
  price: ItadAmount
  regular?: ItadAmount | null
  cut?: number
  voucher?: string | null
  storeLow?: ItadAmount | null
  drm?: ItadNamed[]
  platforms?: ItadNamed[]
  timestamp?: string
  expiry?: string | null
  url: string
  flag?: string | null
}

/**
 * The `historyLow` sub-shape is read defensively: we only need `all`, and the
 * exact envelope has moved between API versions.
 */
export interface ItadGamePrices {
  id: string
  historyLow?: { all?: ItadAmount | null } | null
  deals?: ItadDeal[]
}

export interface ItadLookupResult {
  found: boolean
  game?: { id: string; title: string }
}

/* ── FX ───────────────────────────────────────────────────────────────────── */

export interface FrankfurterResponse {
  amount: number
  base: string
  date: string
  rates: Record<string, number>
}

/** THB per one unit of each currency. `THB` is always 1. */
export type ThbRates = Record<string, number>

/* ── Catalog wire format (what lives in KV and crosses the network) ───────── */

export interface CatalogFx {
  /** Quote date reported by the FX provider. */
  date: string
  /** THB per one unit of each currency. */
  rates: ThbRates
  /** True when the quote was carried forward because the FX fetch failed. */
  stale: boolean
}

export interface CatalogOffer {
  storeId: string
  advertisedSatang: number
  feesSatang: number
  finalSatang: number
  region: RegionCode
  drm: string
  /** ISO timestamp. `updatedMinutesAgo` is derived at revive time, never stored. */
  updatedAt: string
  isHistoricalLow: boolean
  sourceCurrency: string
  /** True when the price was converted from a non-THB currency. */
  approximate: boolean
  voucherCode: string | null
  purchaseUrl: string
}

export interface CatalogEdition {
  name: string
  category: EditionCategory
  steamPriceSatang: number
  offers: CatalogOffer[]
}

export interface CatalogGame {
  stale: boolean
  editions: Record<string, CatalogEdition>
}

export interface Catalog {
  version: number
  fetchedAt: string
  fx: CatalogFx
  /** Only stores that returned at least one offer this run. */
  stores: Store[]
  failedStores: string[]
  games: Record<string, CatalogGame>
}

export const CATALOG_VERSION = 1

/* ── Rolling daily history ────────────────────────────────────────────────── */

export interface HistoryStore {
  version: number
  /** Epoch-day index (ICT) that `series[key][0]` refers to. */
  startDay: number
  /** `"<gameSlug>|<editionKey>"` → daily minimum in satang, `null` for missed days. */
  series: Record<string, (number | null)[]>
}

export const HISTORY_VERSION = 1

/* ── ITAD id resolution cache ─────────────────────────────────────────────── */

export interface IdCacheEntry {
  /** `null` is a negative cache entry — retried only after IDS_RETRY_DAYS. */
  id: string | null
  day: number
}

export interface IdCache {
  version: number
  shopsFetchedAt: string | null
  /** ITAD shop id → shop name. */
  shops: Record<string, string>
  /** Lookup title → resolved ITAD game id. */
  titles: Record<string, IdCacheEntry>
}

export const ID_CACHE_VERSION = 1
