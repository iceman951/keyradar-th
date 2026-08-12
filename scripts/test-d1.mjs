#!/usr/bin/env node
/**
 * Local D1 integration test (IMPLEMENTATION_SPEC.md §18.4). Verifies, against
 * a real local D1 instance via `wrangler d1`, that:
 *  - migrations apply cleanly;
 *  - the seed runs and populates every table;
 *  - offers join to their edition and store correctly (no orphaned rows);
 *  - price history is chronological;
 *  - rerunning the seed does not duplicate rows.
 *
 * This shells out to `wrangler`, which needs the `workerd` binary — it does
 * not run in every sandbox (workerd needs glibc >= 2.35; some CI/dev
 * containers ship older glibc and need this run inside a newer-glibc
 * container instead). It runs unmodified in GitHub Actions' ubuntu-latest.
 */
import { spawnSync } from 'node:child_process'

const DB_NAME = 'keyradar-th-prod'
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8' })
  if (result.status !== 0) {
    console.error(result.stdout)
    console.error(result.stderr)
    throw new Error(`Command failed: ${command} ${args.join(' ')}`)
  }
  return result.stdout
}

const query = (sql) => {
  const output = run('node_modules/.bin/wrangler', [
    'd1',
    'execute',
    DB_NAME,
    '--local',
    '--json',
    `--command=${sql}`
  ])
  const parsed = JSON.parse(output)
  return parsed[0].results
}

const assert = (condition, message) => {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
  console.log(`  ok - ${message}`)
}

console.log('1. Applying migrations...')
run('node_modules/.bin/wrangler', [
  'd1',
  'migrations',
  'apply',
  DB_NAME,
  '--local'
])

console.log('2. Seeding (first run)...')
run(process.execPath, ['scripts/seed-d1.mjs', '--local'])

console.log('3. Verifying every table is populated...')
const countsAfterFirstSeed = query(
  `SELECT
     (SELECT COUNT(*) FROM games) AS games,
     (SELECT COUNT(*) FROM editions) AS editions,
     (SELECT COUNT(*) FROM stores) AS stores,
     (SELECT COUNT(*) FROM offers_current) AS offers,
     (SELECT COUNT(*) FROM price_history) AS price_history`
)[0]
assert(countsAfterFirstSeed.games > 0, 'games table is populated')
assert(countsAfterFirstSeed.editions > 0, 'editions table is populated')
assert(countsAfterFirstSeed.stores > 0, 'stores table is populated')
assert(countsAfterFirstSeed.offers > 0, 'offers_current table is populated')
assert(
  countsAfterFirstSeed.price_history > 0,
  'price_history table is populated'
)

console.log(
  '4. Verifying offers join to editions and stores with no orphans...'
)
const orphanEditions = query(
  `SELECT COUNT(*) AS n FROM offers_current o LEFT JOIN editions e ON o.edition_id = e.id WHERE e.id IS NULL`
)[0].n
const orphanStores = query(
  `SELECT COUNT(*) AS n FROM offers_current o LEFT JOIN stores s ON o.store_id = s.id WHERE s.id IS NULL`
)[0].n
assert(orphanEditions === 0, 'no offer references a missing edition')
assert(orphanStores === 0, 'no offer references a missing store')

console.log(
  '5. Verifying price history is chronological per (game, edition)...'
)
const outOfOrder = query(
  `SELECT COUNT(*) AS n FROM (
     SELECT observed_at,
            LAG(observed_at) OVER (PARTITION BY game_slug, edition_id ORDER BY observed_at) AS prev
     FROM price_history
   ) WHERE prev IS NOT NULL AND observed_at < prev`
)[0].n
assert(outOfOrder === 0, 'no price_history point is out of chronological order')

console.log(
  '6. Verifying the final-price invariant holds for every seeded offer...'
)
const badOffers = query(
  `SELECT id, advertised_satang, final_satang, fees_json FROM offers_current`
).filter((row) => {
  const fees = JSON.parse(row.fees_json).reduce(
    (sum, fee) => sum + fee.amountSatang,
    0
  )
  return row.advertised_satang + fees !== row.final_satang
})
assert(
  badOffers.length === 0,
  'every offer satisfies finalSatang === advertisedSatang + fees'
)

console.log('7. Reseeding (second run) and verifying zero new rows...')
run(process.execPath, ['scripts/seed-d1.mjs', '--local'])
const countsAfterSecondSeed = query(
  `SELECT
     (SELECT COUNT(*) FROM games) AS games,
     (SELECT COUNT(*) FROM editions) AS editions,
     (SELECT COUNT(*) FROM stores) AS stores,
     (SELECT COUNT(*) FROM offers_current) AS offers,
     (SELECT COUNT(*) FROM price_history) AS price_history`
)[0]
assert(
  JSON.stringify(countsAfterSecondSeed) ===
    JSON.stringify(countsAfterFirstSeed),
  `reseeding is idempotent (${JSON.stringify(countsAfterFirstSeed)} unchanged)`
)

console.log('\nAll D1 integration checks passed.')
