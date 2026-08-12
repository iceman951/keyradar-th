/**
 * Generates `drizzle/seed.sql` from the shared deterministic catalog.
 *
 * Run with plain `node` (Node 24 strips TypeScript types natively) — this
 * script must not depend on SvelteKit's `$lib` alias or on Vite.
 *
 *   node scripts/generate-seed-sql.ts
 *
 * `SEED_NOW_MS` may be set to a fixed timestamp for reproducible test runs;
 * it defaults to `Date.now()` so a freshly seeded database doesn't
 * immediately report every offer as old.
 *
 * Every invariant in IMPLEMENTATION spec §17 is checked in-memory before any
 * SQL string is written. On failure this script exits non-zero and writes
 * nothing — no partial seed file is ever produced.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildOffers,
  buildPriceHistory,
  games,
  regionStatusFor,
  SEED_HISTORY_DAYS,
  stores
} from '../shared/seed/catalog.ts'
import { bestThaiOffer } from '../shared/domain/pricing.ts'
import type {
  Edition,
  Game,
  Offer,
  OfferFee,
  Store
} from '../shared/domain/models.ts'

const SEED_NOW = process.env.SEED_NOW_MS
  ? Number(process.env.SEED_NOW_MS)
  : Date.now()
if (!Number.isFinite(SEED_NOW)) {
  throw new Error(
    `SEED_NOW_MS must be a finite number, got "${process.env.SEED_NOW_MS}"`
  )
}

const DAY_MS = 86_400_000
// Offer rows are keyed by a deterministic id (no timestamp in the key), so
// upserting by exact `SEED_NOW` is already idempotent. Price-history rows are
// keyed by `(game_slug, edition_id, observed_at)`, and every point in a
// series shifts together with its `endsAt` anchor — so anchoring to raw
// `Date.now()` would make every reseed within the same day mint a full new
// set of ~800 rows purely from millisecond drift. Truncating to the UTC day
// containing `SEED_NOW` keeps same-day reseeds byte-identical, so
// `ON CONFLICT ... DO NOTHING` actually dedupes them. A reseed on a later
// calendar day intentionally produces a shifted series (documented in the
// ADR as a Phase 1 limitation — real accumulating history is Phase 3).
const PRICE_HISTORY_ANCHOR_MS = Math.floor(SEED_NOW / DAY_MS) * DAY_MS

const EDITION_CATEGORIES = new Set([
  'standard',
  'deluxe',
  'complete',
  'dlc',
  'bundle'
])
const STORE_TYPES = new Set(['steam', 'official', 'reseller', 'marketplace'])
const REGION_CODES = new Set([
  'global',
  'sea',
  'thailand',
  'eu',
  'row',
  'north-america'
])
const REGION_STATUSES = new Set(['confirmed', 'uncertain', 'blocked'])
const FEE_KINDS = new Set(['platform', 'buyer-protection', 'payment'])

class SeedValidationError extends Error {}

const fail = (message: string): never => {
  throw new SeedValidationError(message)
}

const isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// 1. Validate the in-memory catalog before generating any row.
// ---------------------------------------------------------------------------

const validateCatalog = (): void => {
  const gameSlugs = new Set<string>()
  for (const game of games) {
    if (gameSlugs.has(game.slug)) fail(`duplicate game slug "${game.slug}"`)
    gameSlugs.add(game.slug)
    if (game.editions.length === 0) fail(`game "${game.slug}" has no editions`)

    const editionKeys = new Set<string>()
    for (const edition of game.editions) {
      if (editionKeys.has(edition.key)) {
        fail(`duplicate edition key "${edition.key}" on game "${game.slug}"`)
      }
      editionKeys.add(edition.key)
      if (!EDITION_CATEGORIES.has(edition.category)) {
        fail(
          `unknown edition category "${edition.category}" on ${game.slug}:${edition.key}`
        )
      }
      if (
        !Number.isInteger(edition.steamPriceSatang) ||
        edition.steamPriceSatang < 0
      ) {
        fail(
          `edition ${game.slug}:${edition.key} has a non-integer or negative steamPriceSatang`
        )
      }
    }
  }

  const storeIds = new Set<string>()
  for (const store of stores) {
    if (storeIds.has(store.id)) fail(`duplicate store id "${store.id}"`)
    storeIds.add(store.id)
    if (!STORE_TYPES.has(store.type))
      fail(`unknown store type "${store.type}" on ${store.id}`)
    if (!isHttpsUrl(store.websiteUrl))
      fail(`store ${store.id} websiteUrl is not HTTPS`)
    if (store.feeRate < 0) fail(`store ${store.id} has a negative feeRate`)
  }
}

const validateOffer = (offer: Offer, context: string): void => {
  if (!Number.isInteger(offer.advertisedSatang) || offer.advertisedSatang < 0) {
    fail(`${context}: advertisedSatang must be a non-negative integer`)
  }
  if (!Number.isInteger(offer.finalSatang) || offer.finalSatang < 0) {
    fail(`${context}: finalSatang must be a non-negative integer`)
  }
  const feeTotal = offer.fees.reduce((sum: number, fee: OfferFee) => {
    if (!FEE_KINDS.has(fee.kind))
      fail(`${context}: unknown fee kind "${fee.kind}"`)
    if (!Number.isInteger(fee.amountSatang) || fee.amountSatang < 0) {
      fail(`${context}: fee amountSatang must be a non-negative integer`)
    }
    return sum + fee.amountSatang
  }, 0)
  if (offer.advertisedSatang + feeTotal !== offer.finalSatang) {
    fail(
      `${context}: finalSatang (${offer.finalSatang}) !== advertisedSatang + fees (${offer.advertisedSatang + feeTotal})`
    )
  }
  if (!REGION_CODES.has(offer.region))
    fail(`${context}: unknown region "${offer.region}"`)
  if (!REGION_STATUSES.has(offer.regionStatus)) {
    fail(`${context}: unknown regionStatus "${offer.regionStatus}"`)
  }
  if (offer.regionStatus !== regionStatusFor(offer.region)) {
    fail(
      `${context}: regionStatus does not match the centralized region mapping`
    )
  }
  if (!isHttpsUrl(offer.purchaseUrl))
    fail(`${context}: purchaseUrl is not HTTPS`)
  const hasRating = offer.sellerRating !== undefined
  const hasReviewCount = offer.sellerReviewCount !== undefined
  if (hasRating !== hasReviewCount) {
    fail(
      `${context}: sellerRating and sellerReviewCount must both be present or both absent`
    )
  }
}

// ---------------------------------------------------------------------------
// 2. SQL generation helpers
// ---------------------------------------------------------------------------

const sqlString = (value: string): string => `'${value.replace(/'/g, "''")}'`
const sqlJson = (value: unknown): string => sqlString(JSON.stringify(value))
const sqlNumber = (value: number): string => {
  if (!Number.isFinite(value))
    fail(`attempted to write a non-finite number: ${value}`)
  return String(value)
}
const sqlNullableNumber = (value: number | null | undefined): string =>
  value === null || value === undefined ? 'NULL' : sqlNumber(value)
const sqlBool = (value: boolean): string => (value ? '1' : '0')

const statements: string[] = []

const upsertGame = (game: Game): void => {
  const normalizedTitle = game.title.toLocaleLowerCase()
  statements.push(
    `INSERT INTO games (slug, title, normalized_title, year, developer, publisher, release_date, genres_json, review_percent, review_count, popularity, hue, created_at, updated_at) VALUES (${[
      sqlString(game.slug),
      sqlString(game.title),
      sqlString(normalizedTitle),
      sqlNumber(game.year),
      sqlString(game.developer),
      sqlString(game.publisher),
      sqlString(game.releaseDate),
      sqlJson(game.genres),
      sqlNumber(game.reviewPercent),
      sqlNumber(game.reviewCount),
      sqlNumber(game.popularity),
      sqlNumber(game.hue),
      sqlNumber(SEED_NOW),
      sqlNumber(SEED_NOW)
    ].join(
      ', '
    )}) ON CONFLICT(slug) DO UPDATE SET title=excluded.title, normalized_title=excluded.normalized_title, year=excluded.year, developer=excluded.developer, publisher=excluded.publisher, release_date=excluded.release_date, genres_json=excluded.genres_json, review_percent=excluded.review_percent, review_count=excluded.review_count, popularity=excluded.popularity, hue=excluded.hue, updated_at=excluded.updated_at;`
  )
}

const upsertEdition = (
  game: Game,
  edition: Edition,
  position: number
): void => {
  const id = `${game.slug}:${edition.key}`
  statements.push(
    `INSERT INTO editions (id, game_slug, edition_key, name, category, steam_price_satang, position, created_at, updated_at) VALUES (${[
      sqlString(id),
      sqlString(game.slug),
      sqlString(edition.key),
      sqlString(edition.name),
      sqlString(edition.category),
      sqlNumber(edition.steamPriceSatang),
      sqlNumber(position),
      sqlNumber(SEED_NOW),
      sqlNumber(SEED_NOW)
    ].join(
      ', '
    )}) ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, steam_price_satang=excluded.steam_price_satang, position=excluded.position, updated_at=excluded.updated_at;`
  )
}

const upsertStore = (store: Store): void => {
  const feeRateBps = Math.round(store.feeRate * 10000)
  statements.push(
    `INSERT INTO stores (id, name, initials, type, payments_json, fee_rate_bps, fee_label, note, website_url, created_at, updated_at) VALUES (${[
      sqlString(store.id),
      sqlString(store.name),
      sqlString(store.initials),
      sqlString(store.type),
      sqlJson(store.payments),
      sqlNumber(feeRateBps),
      sqlString(store.feeLabel),
      sqlString(store.note),
      sqlString(store.websiteUrl),
      sqlNumber(SEED_NOW),
      sqlNumber(SEED_NOW)
    ].join(
      ', '
    )}) ON CONFLICT(id) DO UPDATE SET name=excluded.name, initials=excluded.initials, type=excluded.type, payments_json=excluded.payments_json, fee_rate_bps=excluded.fee_rate_bps, fee_label=excluded.fee_label, note=excluded.note, website_url=excluded.website_url, updated_at=excluded.updated_at;`
  )
}

const upsertOffer = (offer: Offer): void => {
  const editionId = `${offer.gameSlug}:${offer.editionKey}`
  const observedAt = SEED_NOW - offer.updatedMinutesAgo * 60_000
  statements.push(
    `INSERT INTO offers_current (id, game_slug, edition_id, store_id, advertised_satang, fees_json, final_satang, region, region_status, drm, in_stock, observed_at, seller_rating_tenths, seller_review_count, is_historical_low, purchase_url, created_at, updated_at) VALUES (${[
      sqlString(offer.id),
      sqlString(offer.gameSlug),
      sqlString(editionId),
      sqlString(offer.storeId),
      sqlNumber(offer.advertisedSatang),
      sqlJson(offer.fees),
      sqlNumber(offer.finalSatang),
      sqlString(offer.region),
      sqlString(offer.regionStatus),
      sqlString(offer.drm),
      sqlBool(offer.inStock),
      sqlNumber(observedAt),
      offer.sellerRating === undefined
        ? 'NULL'
        : sqlNumber(Math.round(offer.sellerRating * 10)),
      sqlNullableNumber(offer.sellerReviewCount),
      sqlBool(offer.isHistoricalLow),
      sqlString(offer.purchaseUrl),
      sqlNumber(SEED_NOW),
      sqlNumber(SEED_NOW)
    ].join(
      ', '
    )}) ON CONFLICT(id) DO UPDATE SET advertised_satang=excluded.advertised_satang, fees_json=excluded.fees_json, final_satang=excluded.final_satang, region=excluded.region, region_status=excluded.region_status, drm=excluded.drm, in_stock=excluded.in_stock, observed_at=excluded.observed_at, seller_rating_tenths=excluded.seller_rating_tenths, seller_review_count=excluded.seller_review_count, is_historical_low=excluded.is_historical_low, purchase_url=excluded.purchase_url, updated_at=excluded.updated_at;`
  )
}

const insertPricePoint = (
  gameSlug: string,
  editionId: string,
  observedAt: number,
  priceSatang: number
): void => {
  if (!Number.isInteger(priceSatang) || priceSatang < 0) {
    fail(
      `price history point for ${gameSlug} has a non-integer or negative price`
    )
  }
  statements.push(
    `INSERT INTO price_history (game_slug, edition_id, observed_at, price_satang) VALUES (${[
      sqlString(gameSlug),
      sqlString(editionId),
      sqlNumber(observedAt),
      sqlNumber(priceSatang)
    ].join(', ')}) ON CONFLICT(game_slug, edition_id, observed_at) DO NOTHING;`
  )
}

// ---------------------------------------------------------------------------
// 3. Build
// ---------------------------------------------------------------------------

const build = (): void => {
  validateCatalog()

  const seenEditionIds = new Set<string>()
  const seenOfferIds = new Set<string>()

  for (const store of stores) upsertStore(store)

  for (const game of games) {
    upsertGame(game)

    for (const [position, edition] of game.editions.entries()) {
      const editionId = `${game.slug}:${edition.key}`
      if (seenEditionIds.has(editionId))
        fail(`duplicate edition id "${editionId}"`)
      seenEditionIds.add(editionId)
      upsertEdition(game, edition, position)

      const offers = buildOffers(game.slug, edition.key)
      const historicalId = bestThaiOffer(offers)?.id
      for (const offer of offers) {
        if (seenOfferIds.has(offer.id)) fail(`duplicate offer id "${offer.id}"`)
        seenOfferIds.add(offer.id)
        const marked = { ...offer, isHistoricalLow: offer.id === historicalId }
        validateOffer(marked, `offer ${marked.id}`)
        upsertOffer(marked)
      }

      // Price history is seeded only for each game's first edition, matching
      // `MockGameRepository.getPriceHistory`, which always charts the game's
      // first edition regardless of which edition is currently selected.
      if (edition.key === game.editions[0].key) {
        const ending =
          bestThaiOffer(offers)?.finalSatang ?? edition.steamPriceSatang
        const points = buildPriceHistory(
          game.slug,
          SEED_HISTORY_DAYS,
          ending,
          PRICE_HISTORY_ANCHOR_MS
        )
        for (const point of points) {
          insertPricePoint(
            game.slug,
            editionId,
            point.observedAt,
            point.priceSatang
          )
        }
      }
    }
  }

  // Foreign-key sanity check: every edition_id/store_id referenced by an
  // offer statement must exist among the rows we are about to write.
  const storeIds = new Set(stores.map((store) => store.id))
  for (const game of games) {
    for (const edition of game.editions) {
      const editionId = `${game.slug}:${edition.key}`
      if (!seenEditionIds.has(editionId))
        fail(`FK check: missing edition "${editionId}"`)
    }
  }
  for (const store of stores) {
    if (!storeIds.has(store.id)) fail(`FK check: missing store "${store.id}"`)
  }
}

build()

// Deliberately NOT under `drizzle/`: `wrangler d1 migrations apply` treats
// every `.sql` file in `migrations_dir` as a migration to track and run, so a
// generated seed file sitting there gets executed a second time as a
// "migration" on top of the explicit `wrangler d1 execute --file` in
// scripts/seed-d1.mjs, silently doubling every row on first seed.
const outPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '.generated',
  'seed.sql'
)
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, `${statements.join('\n')}\n`, 'utf8')

console.log(
  `Generated ${statements.length} statements from ${games.length} games / ${stores.length} stores -> ${outPath}`
)
