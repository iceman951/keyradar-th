/**
 * Cache-Control values from the spec's §13 table. Isolated in one helper so
 * caching can be disabled globally (flip `CACHE_HEADERS_ENABLED`) without
 * touching every route, and so an explicit `caches.default` layer — if ever
 * added post-Phase-1 — has one place to hook in.
 */
export type CacheProfile =
  | 'no-store'
  | 'games'
  | 'search'
  | 'game-detail'
  | 'stores'
  | 'offers'
  | 'editions'
  | 'price-history'

const CACHE_HEADERS_ENABLED = true

const PROFILE_VALUES: Readonly<Record<CacheProfile, string>> = {
  'no-store': 'no-store',
  games: 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
  search: 'public, max-age=30, s-maxage=600, stale-while-revalidate=3600',
  'game-detail':
    'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
  stores: 'public, max-age=300, s-maxage=86400, stale-while-revalidate=86400',
  offers: 'public, max-age=30, s-maxage=600, stale-while-revalidate=3600',
  editions: 'public, max-age=60, s-maxage=600, stale-while-revalidate=3600',
  'price-history':
    'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
}

export const applyCacheProfile = (
  set: { headers: Record<string, string | number | string[]> },
  profile: CacheProfile
): void => {
  if (!CACHE_HEADERS_ENABLED) return
  set.headers['cache-control'] = PROFILE_VALUES[profile]
}
