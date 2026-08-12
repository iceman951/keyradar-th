import { Elysia, t } from 'elysia'
import { searchQuery, slugParams } from '../schemas/common.schema'
import { gameDtoSchema, gameListQuery } from '../schemas/game.schema'
import { applyCacheProfile } from '../middleware/cache-headers'
import type { RouteCatalogService } from '../app'

export const gameRoutes = (catalog: RouteCatalogService) =>
  new Elysia()
    .get(
      '/games',
      { query: gameListQuery, response: { 200: t.Array(gameDtoSchema) } },
      async ({ query, set }) => {
        applyCacheProfile(set, 'games')
        return catalog.listGames({ limit: query.limit, sort: query.sort })
      }
    )
    .get(
      '/search',
      { query: searchQuery, response: { 200: t.Array(gameDtoSchema) } },
      async ({ query, set }) => {
        applyCacheProfile(set, 'search')
        return catalog.searchGames(query.q, query.limit)
      }
    )
    .get(
      '/games/:slug',
      { params: slugParams, response: { 200: gameDtoSchema } },
      async ({ params, set }) => {
        applyCacheProfile(set, 'game-detail')
        return catalog.getGame(params.slug)
      }
    )
