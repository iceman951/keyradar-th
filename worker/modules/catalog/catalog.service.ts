import type { Database } from '../../db/client';
import type { EditionRow, GameRow } from '../../db/schema';
import { gameRowToDto, storeRowToDto } from '../../db/mappers';
import { gameNotFound } from '../../errors';
import type { GameDto, GameSortOrder, StoreDto } from '../../../shared/contracts/api-dto.ts';
import { createCatalogRepository } from './catalog.repository';

export interface GameWithEditions {
  game: GameRow;
  editionRows: EditionRow[];
}

export interface CatalogService {
  listGames(options: { limit?: number; sort?: GameSortOrder }): Promise<GameDto[]>;
  searchGames(query: string, limit?: number): Promise<GameDto[]>;
  getGame(slug: string): Promise<GameDto>;
  listStores(): Promise<StoreDto[]>;
  /** Used internally by the pricing service to resolve/validate a game+edition. */
  getGameRowOrThrow(slug: string): Promise<GameWithEditions>;
}

export const createCatalogService = (db: Database): CatalogService => {
  const repository = createCatalogRepository(db);

  const getGameRowOrThrow = async (slug: string): Promise<GameWithEditions> => {
    const row = await repository.getGame(slug);
    if (!row) throw gameNotFound(slug);
    return row;
  };

  return {
    async listGames(options) {
      const rows = await repository.listGames(options);
      return rows.map(({ game, editionRows }) => gameRowToDto(game, editionRows));
    },

    async searchGames(query, limit) {
      const rows = await repository.searchGames(query, limit);
      return rows.map(({ game, editionRows }) => gameRowToDto(game, editionRows));
    },

    async getGame(slug) {
      const { game, editionRows } = await getGameRowOrThrow(slug);
      return gameRowToDto(game, editionRows);
    },

    async listStores() {
      const rows = await repository.listStores();
      return rows.map(storeRowToDto);
    },

    getGameRowOrThrow
  };
};
