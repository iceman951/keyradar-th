import type { GameRepository } from './game-repository';
import { KvGameRepository } from './kv-repository';
import { MockGameRepository } from './mock-repository';

/**
 * The app's single data source. Real prices come from `/api/catalog`; the mock
 * repository stands in whenever that is unreachable — which is the normal case
 * under `vite dev`, where no Worker is running.
 */
const repository = new KvGameRepository(new MockGameRepository());

export const gameRepository: GameRepository = repository;

/**
 * Forces the next read to refetch. Caching is not a data concern, so this stays
 * off the `GameRepository` interface.
 */
export const invalidateCatalog = (): void => repository.invalidate();
