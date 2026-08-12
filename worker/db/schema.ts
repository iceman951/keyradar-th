/**
 * Cloudflare D1 (SQLite) schema.
 *
 * Conventions used throughout:
 *  - Money is INTEGER satang. Never store baht decimals.
 *  - Store fee rates are INTEGER basis points (5.2% -> 520). Never floats.
 *  - **All timestamps are Unix milliseconds** (`Date.now()`), stored as
 *    INTEGER. This unit is consistent across every table in this file.
 *  - Identifiers are TEXT and domain-stable, so a re-run of the seed updates
 *    rows in place instead of appending duplicates. `price_history` is the one
 *    exception: it is an append-only series keyed by a unique triple.
 *  - JSON columns hold validated JSON strings; readers must re-validate them
 *    (see `worker/db/validation.ts`) because D1 content is not trusted.
 */
import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex
} from 'drizzle-orm/sqlite-core';

export const games = sqliteTable(
  'games',
  {
    slug: text('slug').primaryKey(),
    title: text('title').notNull(),
    normalizedTitle: text('normalized_title').notNull(),
    year: integer('year').notNull(),
    developer: text('developer').notNull(),
    publisher: text('publisher').notNull(),
    releaseDate: text('release_date').notNull(),
    /** JSON string array of Thai genre labels. */
    genresJson: text('genres_json').notNull(),
    reviewPercent: integer('review_percent').notNull(),
    reviewCount: integer('review_count').notNull(),
    popularity: integer('popularity').notNull(),
    hue: integer('hue').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull()
  },
  (table) => [
    index('games_normalized_title_idx').on(table.normalizedTitle),
    index('games_popularity_idx').on(sql`${table.popularity} DESC`)
  ]
);

export const editions = sqliteTable(
  'editions',
  {
    /** `${gameSlug}:${editionKey}` */
    id: text('id').primaryKey(),
    gameSlug: text('game_slug')
      .notNull()
      .references(() => games.slug),
    editionKey: text('edition_key').notNull(),
    name: text('name').notNull(),
    /** One of the exhaustive `EditionCategory` values. */
    category: text('category').notNull(),
    steamPriceSatang: integer('steam_price_satang').notNull(),
    /**
     * 0-based position within `game.editions`. Not in the spec's column list,
     * but needed because `getPriceHistory` (like `MockGameRepository`) always
     * charts a game's *first* edition regardless of which edition is
     * currently selected, and nothing else in this table is a reliable proxy
     * for catalog order (`edition_key` sorts alphabetically, not by intent —
     * e.g. "standard" sorts after "deluxe").
     */
    position: integer('position').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull()
  },
  (table) => [
    uniqueIndex('editions_game_edition_key_idx').on(table.gameSlug, table.editionKey),
    index('editions_game_slug_idx').on(table.gameSlug)
  ]
);

export const stores = sqliteTable('stores', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  initials: text('initials').notNull(),
  /** One of the exhaustive `StoreType` values. */
  type: text('type').notNull(),
  /** JSON string array of Thai payment-method labels. */
  paymentsJson: text('payments_json').notNull(),
  /** Integer basis points; 5.2% is 520. */
  feeRateBps: integer('fee_rate_bps').notNull(),
  feeLabel: text('fee_label').notNull(),
  note: text('note').notNull(),
  websiteUrl: text('website_url').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
});

export const offersCurrent = sqliteTable(
  'offers_current',
  {
    /** `${gameSlug}-${editionKey}-${storeId}` */
    id: text('id').primaryKey(),
    gameSlug: text('game_slug')
      .notNull()
      .references(() => games.slug),
    editionId: text('edition_id')
      .notNull()
      .references(() => editions.id),
    storeId: text('store_id')
      .notNull()
      .references(() => stores.id),
    advertisedSatang: integer('advertised_satang').notNull(),
    /** JSON-encoded `OfferFee[]`. */
    feesJson: text('fees_json').notNull(),
    /** Must equal `advertised_satang` plus every fee in `fees_json`. */
    finalSatang: integer('final_satang').notNull(),
    /** One of the exhaustive `RegionCode` values. */
    region: text('region').notNull(),
    /** One of the exhaustive `RegionStatus` values. */
    regionStatus: text('region_status').notNull(),
    drm: text('drm').notNull(),
    inStock: integer('in_stock').notNull(),
    observedAt: integer('observed_at').notNull(),
    /** Rating in tenths (98.7 -> 987) so no float is stored. Marketplaces only. */
    sellerRatingTenths: integer('seller_rating_tenths'),
    sellerReviewCount: integer('seller_review_count'),
    isHistoricalLow: integer('is_historical_low').notNull(),
    purchaseUrl: text('purchase_url').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull()
  },
  (table) => [
    // Covers the offers query: filter by game + edition, then order by price.
    index('offers_game_edition_price_idx').on(
      table.gameSlug,
      table.editionId,
      table.regionStatus,
      table.inStock,
      table.finalSatang
    ),
    index('offers_store_idx').on(table.storeId)
  ]
);

export const priceHistory = sqliteTable(
  'price_history',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    gameSlug: text('game_slug')
      .notNull()
      .references(() => games.slug),
    editionId: text('edition_id')
      .notNull()
      .references(() => editions.id),
    observedAt: integer('observed_at').notNull(),
    priceSatang: integer('price_satang').notNull()
  },
  (table) => [
    // Makes re-seeding idempotent: a repeated point conflicts instead of
    // appending a duplicate.
    uniqueIndex('price_history_unique_idx').on(
      table.gameSlug,
      table.editionId,
      table.observedAt
    ),
    index('price_history_game_edition_time_idx').on(
      table.gameSlug,
      table.editionId,
      table.observedAt
    )
  ]
);

/**
 * Ingestion bookkeeping. Created now so Phase 2 has somewhere to record runs;
 * Phase 1 does not write to it.
 */
export const syncRuns = sqliteTable('sync_runs', {
  id: text('id').primaryKey(),
  source: text('source').notNull(),
  /** `running` | `success` | `partial` | `failed` */
  status: text('status').notNull(),
  startedAt: integer('started_at').notNull(),
  finishedAt: integer('finished_at'),
  recordsReceived: integer('records_received').notNull().default(0),
  recordsChanged: integer('records_changed').notNull().default(0),
  errorMessage: text('error_message')
});

export type GameRow = typeof games.$inferSelect;
export type EditionRow = typeof editions.$inferSelect;
export type StoreRow = typeof stores.$inferSelect;
export type OfferRow = typeof offersCurrent.$inferSelect;
export type PriceHistoryRow = typeof priceHistory.$inferSelect;
