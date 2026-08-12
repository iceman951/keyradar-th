import { Elysia, t } from 'elysia'
import { editionKeyQuery, slugParams } from '../schemas/common.schema'
import {
  editionAvailabilityDtoSchema,
  offerSnapshotDtoSchema
} from '../schemas/offer.schema'
import { applyCacheProfile } from '../middleware/cache-headers'
import type { PricingService } from '../modules/pricing/pricing.service'

export const offerRoutes = (pricing: PricingService) =>
  new Elysia()
    .get(
      '/games/:slug/offers',
      {
        params: slugParams,
        query: editionKeyQuery,
        response: { 200: offerSnapshotDtoSchema }
      },
      async ({ params, query, set }) => {
        applyCacheProfile(set, 'offers')
        return pricing.getOffers(params.slug, query.editionKey)
      }
    )
    .get(
      '/games/:slug/editions',
      {
        params: slugParams,
        response: { 200: t.Array(editionAvailabilityDtoSchema) }
      },
      async ({ params, set }) => {
        applyCacheProfile(set, 'editions')
        return pricing.getEditionAvailability(params.slug)
      }
    )
