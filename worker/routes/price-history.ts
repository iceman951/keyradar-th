import { Elysia, t } from 'elysia'
import { daysQuery, slugParams } from '../schemas/common.schema'
import { pricePointDtoSchema } from '../schemas/price-history.schema'
import { applyCacheProfile } from '../middleware/cache-headers'
import type { PricingService } from '../modules/pricing/pricing.service'

const DEFAULT_DAYS = 30

export const priceHistoryRoutes = (pricing: PricingService) =>
  new Elysia().get(
    '/games/:slug/price-history',
    {
      params: slugParams,
      query: daysQuery,
      response: { 200: t.Array(pricePointDtoSchema) }
    },
    async ({ params, query, set }) => {
      applyCacheProfile(set, 'price-history')
      return pricing.getPriceHistory(params.slug, query.days ?? DEFAULT_DAYS)
    }
  )
