import type { RegionCode } from '../domain/models';

/**
 * Key-region locking is editorial: ITAD does not model it, so it comes from what
 * each store publicly commits to. Keep this in sync with the store notes in
 * `fixtures.ts`.
 */
export const STORE_REGION: Readonly<Record<string, RegionCode>> = {
  steam: 'thailand',
  dreamgame: 'sea',
  fanatical: 'global',
  gamersgate: 'global',
  gamebillet: 'global',
  gmg: 'global',
  humble: 'global',
  allyouplay: 'global',
  // DRM-free and account-bound stores have no key to region-lock.
  gog: 'global',
  epic: 'global',
  // Gamesplanet region-locks some titles without enumerating the countries, so
  // it stays "uncertain" rather than being presented as safe for Thailand.
  gamesplanet: 'row'
};

/**
 * A store we have not vetted is "uncertain", never "confirmed" — the honest
 * failure mode, and it keeps unvetted keys out of the Thailand-only filter.
 */
export const UNKNOWN_STORE_REGION: RegionCode = 'row';

export const regionForStore = (storeId: string): RegionCode =>
  STORE_REGION[storeId] ?? UNKNOWN_STORE_REGION;
