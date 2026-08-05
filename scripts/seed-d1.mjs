#!/usr/bin/env node
/**
 * Regenerates drizzle/seed.sql from the current catalog, then executes it
 * against local or remote D1 via `wrangler d1 execute --file`.
 *
 *   node scripts/seed-d1.mjs --local
 *   node scripts/seed-d1.mjs --remote
 *
 * All INSERT statements in the generated SQL are `ON CONFLICT DO UPDATE` (or
 * `DO NOTHING` for price_history), so running this repeatedly against the
 * same database never duplicates rows.
 */
import { spawnSync } from 'node:child_process';

const target = process.argv.includes('--remote') ? '--remote' : '--local';

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

console.log('Generating scripts/.generated/seed.sql from the current catalog...');
run(process.execPath, ['scripts/generate-seed-sql.ts']);

console.log(`Applying scripts/.generated/seed.sql to D1 (${target})...`);
run('node_modules/.bin/wrangler', [
  'd1',
  'execute',
  'keyradar-th-prod',
  target,
  '--file=scripts/.generated/seed.sql'
]);

console.log('Seed complete.');
