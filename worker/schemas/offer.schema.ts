import { t } from 'elysia'
import { editionCategorySchema } from './game.schema'

const regionCodeSchema = t.Union([
  t.Literal('global'),
  t.Literal('sea'),
  t.Literal('thailand'),
  t.Literal('eu'),
  t.Literal('row'),
  t.Literal('north-america')
])

const regionStatusSchema = t.Union([
  t.Literal('confirmed'),
  t.Literal('uncertain'),
  t.Literal('blocked')
])

const offerFeeSchema = t.Object({
  kind: t.Union([
    t.Literal('platform'),
    t.Literal('buyer-protection'),
    t.Literal('payment')
  ]),
  label: t.String(),
  amountSatang: t.Number()
})

export const offerDtoSchema = t.Object({
  id: t.String(),
  gameSlug: t.String(),
  storeId: t.String(),
  editionKey: t.String(),
  editionName: t.String(),
  editionCategory: editionCategorySchema,
  advertisedSatang: t.Number(),
  fees: t.Array(offerFeeSchema),
  finalSatang: t.Number(),
  steamPriceSatang: t.Number(),
  region: regionCodeSchema,
  regionStatus: regionStatusSchema,
  drm: t.String(),
  inStock: t.Boolean(),
  observedAt: t.String(),
  sellerRating: t.Optional(t.Number()),
  sellerReviewCount: t.Optional(t.Number()),
  isHistoricalLow: t.Boolean(),
  purchaseUrl: t.String()
})

export const offerSnapshotDtoSchema = t.Object({
  gameSlug: t.String(),
  editionKey: t.String(),
  offers: t.Array(offerDtoSchema),
  fetchedAt: t.String(),
  failedStores: t.Array(t.String()),
  stale: t.Boolean()
})

export const editionAvailabilityDtoSchema = t.Object({
  editionKey: t.String(),
  editionName: t.String(),
  category: editionCategorySchema,
  steamPriceSatang: t.Number(),
  minimumPriceSatang: t.Union([t.Number(), t.Null()]),
  confirmedOfferCount: t.Number(),
  availableInThailand: t.Boolean(),
  status: t.Union([t.Literal('available'), t.Literal('no-thai-offer')])
})
