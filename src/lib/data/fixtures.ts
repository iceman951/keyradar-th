/**
 * The catalog now lives in `shared/seed/catalog.ts` so that
 * `MockGameRepository` and the Cloudflare D1 seed generator consume one
 * definition instead of two hand-synchronized copies. This module re-exports
 * it so existing `$lib/data/fixtures` imports keep working.
 */
export { games, stores } from '../../../shared/seed/catalog.ts'
