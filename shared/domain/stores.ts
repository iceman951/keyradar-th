import type { Store, StoreType } from './models.ts';

/**
 * The one place the store trust order is defined. The Worker's SQL
 * `ORDER BY` for `/api/v1/stores` is generated from this map (see
 * `worker/modules/catalog/catalog.repository.ts`) rather than hardcoding its
 * own copy of these numbers.
 */
export const STORE_TRUST_RANK: Readonly<Record<StoreType, number>> = {
  steam: 0,
  official: 1,
  reseller: 2,
  marketplace: 3
};

export const compareStoresByTrust = (a: Store, b: Store): number =>
  STORE_TRUST_RANK[a.type] - STORE_TRUST_RANK[b.type] ||
  a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) ||
  a.id.localeCompare(b.id, 'en');

export const sortStoresByTrust = (stores: readonly Store[]): Store[] =>
  [...stores].sort(compareStoresByTrust);
