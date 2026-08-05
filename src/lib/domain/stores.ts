/**
 * Framework-neutral; lives in `shared/` so the Worker's SQL store ordering
 * can be generated from the same `STORE_TRUST_RANK` map. Re-exported here so
 * existing `$lib/domain/stores` imports keep working.
 */
export {
  compareStoresByTrust,
  sortStoresByTrust,
  STORE_TRUST_RANK
} from '../../../shared/domain/stores.ts';
