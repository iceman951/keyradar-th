import { asc, desc, eq, inArray, like, sql } from 'drizzle-orm'
import type { Database } from '../../db/client'
import { editions, games, stores } from '../../db/schema'
import type { EditionRow, GameRow, StoreRow } from '../../db/schema'
import { STORE_TRUST_RANK } from '../../../shared/domain/stores.ts'
import type { GameSortOrder } from '../../../shared/contracts/api-dto.ts'

/** Batches one query for editions across many games instead of N+1 per game. */
const editionsByGameSlug = async (
  db: Database,
  gameSlugs: readonly string[]
): Promise<Map<string, EditionRow[]>> => {
  if (gameSlugs.length === 0) return new Map()
  const rows = await db
    .select()
    .from(editions)
    .where(inArray(editions.gameSlug, gameSlugs))
    .orderBy(asc(editions.position))

  const grouped = new Map<string, EditionRow[]>()
  for (const row of rows) {
    const list = grouped.get(row.gameSlug)
    if (list) list.push(row)
    else grouped.set(row.gameSlug, [row])
  }
  return grouped
}

const orderForSort = (sort: GameSortOrder) => {
  switch (sort) {
    case 'release':
      // `release_date` is a pre-formatted Thai display string (e.g. "25 ก.พ.
      // 2565"), not a sortable date. `year` is the closest sortable proxy.
      return [desc(games.year), desc(games.popularity), asc(games.slug)]
    case 'title':
      return [asc(games.normalizedTitle), asc(games.slug)]
    case 'popular':
    default:
      return [desc(games.popularity), asc(games.slug)]
  }
}

export interface CatalogRepository {
  listGames(options: { limit?: number; sort?: GameSortOrder }): Promise<
    {
      game: GameRow
      editionRows: EditionRow[]
    }[]
  >
  searchGames(
    query: string,
    limit?: number
  ): Promise<{ game: GameRow; editionRows: EditionRow[] }[]>
  getGame(
    slug: string
  ): Promise<{ game: GameRow; editionRows: EditionRow[] } | undefined>
  listStores(): Promise<StoreRow[]>
}

export const createCatalogRepository = (db: Database): CatalogRepository => ({
  async listGames({ limit, sort = 'popular' }) {
    const query = db
      .select()
      .from(games)
      .orderBy(...orderForSort(sort))
    const gameRows = limit ? await query.limit(limit) : await query
    const editionsBySlug = await editionsByGameSlug(
      db,
      gameRows.map((game) => game.slug)
    )
    return gameRows.map((game) => ({
      game,
      editionRows: editionsBySlug.get(game.slug) ?? []
    }))
  },

  async searchGames(query, limit = 6) {
    const normalized = query.trim().toLocaleLowerCase()
    const gameRows = await db
      .select()
      .from(games)
      .where(like(games.normalizedTitle, `%${normalized}%`))
      .orderBy(desc(games.popularity), asc(games.slug))
      .limit(limit)
    const editionsBySlug = await editionsByGameSlug(
      db,
      gameRows.map((game) => game.slug)
    )
    return gameRows.map((game) => ({
      game,
      editionRows: editionsBySlug.get(game.slug) ?? []
    }))
  },

  async getGame(slug) {
    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.slug, slug))
      .limit(1)
    if (!game) return undefined
    const editionRows = await db
      .select()
      .from(editions)
      .where(eq(editions.gameSlug, slug))
      .orderBy(asc(editions.position))
    return { game, editionRows }
  },

  async listStores() {
    // Generates the ORDER BY CASE from STORE_TRUST_RANK (the same map
    // `compareStoresByTrust` uses) instead of hardcoding a second copy of
    // the trust ordering in SQL.
    const trustCase = sql.join(
      [
        sql`CASE ${stores.type}`,
        ...Object.entries(STORE_TRUST_RANK).map(
          ([type, rank]) => sql` WHEN ${type} THEN ${rank}`
        ),
        sql` END`
      ],
      sql``
    )
    return db
      .select()
      .from(stores)
      .orderBy(trustCase, asc(stores.name), asc(stores.id))
  }
})
