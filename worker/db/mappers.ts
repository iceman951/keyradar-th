/**
 * D1 row -> API DTO mapping. Every JSON and enum-like column is routed
 * through `validation.ts` here, at the one boundary where untrusted D1
 * content becomes a typed response.
 */
import type {
  EditionAvailabilityDto,
  EditionDto,
  GameDto,
  OfferDto,
  StoreDto
} from '../../shared/contracts/api-dto.ts'
import type { EditionRow, GameRow, OfferRow, StoreRow } from './schema'
import {
  assertConsistentFinalPrice,
  assertEditionCategory,
  assertRegionCode,
  assertRegionStatus,
  assertStoreType,
  parseOfferFees,
  parseStringArray
} from './validation'

export const editionRowToDto = (row: EditionRow): EditionDto => ({
  key: row.editionKey,
  name: row.name,
  category: assertEditionCategory(row.category, `edition ${row.id}`),
  steamPriceSatang: row.steamPriceSatang
})

export const gameRowToDto = (
  row: GameRow,
  editionRows: readonly EditionRow[]
): GameDto => ({
  slug: row.slug,
  title: row.title,
  year: row.year,
  developer: row.developer,
  publisher: row.publisher,
  releaseDate: row.releaseDate,
  genres: parseStringArray(row.genresJson, `game ${row.slug} genres`),
  reviewPercent: row.reviewPercent,
  reviewCount: row.reviewCount,
  popularity: row.popularity,
  hue: row.hue,
  editions: editionRows.map(editionRowToDto)
})

export const storeRowToDto = (row: StoreRow): StoreDto => ({
  id: row.id,
  name: row.name,
  initials: row.initials,
  type: assertStoreType(row.type, `store ${row.id}`),
  payments: parseStringArray(row.paymentsJson, `store ${row.id} payments`),
  feeRateBps: row.feeRateBps,
  feeLabel: row.feeLabel,
  note: row.note,
  websiteUrl: row.websiteUrl
})

/**
 * `offerRow` + its joined `edition` — the edition supplies `editionKey`,
 * `editionName`, `editionCategory`, and `steamPriceSatang`, matching the
 * frontend's `Offer` shape (spec §8.4: "The API derives ... from the joined
 * edition").
 */
export const offerRowToDto = (
  offerRow: OfferRow,
  editionRow: EditionRow
): OfferDto => {
  const context = `offer ${offerRow.id}`
  const fees = parseOfferFees(offerRow.feesJson, `${context} fees`)
  assertConsistentFinalPrice(
    offerRow.advertisedSatang,
    fees,
    offerRow.finalSatang,
    context
  )

  return {
    id: offerRow.id,
    gameSlug: offerRow.gameSlug,
    storeId: offerRow.storeId,
    editionKey: editionRow.editionKey,
    editionName: editionRow.name,
    editionCategory: assertEditionCategory(
      editionRow.category,
      `${context} edition`
    ),
    advertisedSatang: offerRow.advertisedSatang,
    fees,
    finalSatang: offerRow.finalSatang,
    steamPriceSatang: editionRow.steamPriceSatang,
    region: assertRegionCode(offerRow.region, context),
    regionStatus: assertRegionStatus(offerRow.regionStatus, context),
    drm: offerRow.drm,
    inStock: offerRow.inStock === 1,
    observedAt: new Date(offerRow.observedAt).toISOString(),
    sellerRating:
      offerRow.sellerRatingTenths === null
        ? undefined
        : offerRow.sellerRatingTenths / 10,
    sellerReviewCount: offerRow.sellerReviewCount ?? undefined,
    isHistoricalLow: offerRow.isHistoricalLow === 1,
    purchaseUrl: offerRow.purchaseUrl
  }
}

/**
 * Mirrors `getEditionAvailability` in `src/lib/domain/editions.ts`, but takes
 * an aggregate already computed by one grouped SQL query (COUNT/MIN over
 * confirmed, in-stock offers per edition) rather than in-memory `Offer[]`, so
 * the Worker never re-derives the "available in Thailand" rule with
 * different logic than the frontend, and never runs one query per edition.
 */
export const editionAvailabilityDto = (
  editionRow: EditionRow,
  aggregate: { confirmedOfferCount: number; minimumPriceSatang: number | null }
): EditionAvailabilityDto => ({
  editionKey: editionRow.editionKey,
  editionName: editionRow.name,
  category: assertEditionCategory(
    editionRow.category,
    `edition ${editionRow.id}`
  ),
  steamPriceSatang: editionRow.steamPriceSatang,
  minimumPriceSatang: aggregate.minimumPriceSatang,
  confirmedOfferCount: aggregate.confirmedOfferCount,
  availableInThailand: aggregate.confirmedOfferCount > 0,
  status: aggregate.confirmedOfferCount > 0 ? 'available' : 'no-thai-offer'
})
