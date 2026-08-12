import { and, asc, desc, eq, gte, sql } from 'drizzle-orm'
import type { Database } from '../../db/client'
import { editions, offersCurrent, priceHistory } from '../../db/schema'
import type { EditionRow, OfferRow } from '../../db/schema'

export interface EditionAvailabilityAggregate {
  edition: EditionRow
  confirmedOfferCount: number
  minimumPriceSatang: number | null
}

export interface PricingRepository {
  /**
   * Every offer for one game/edition, joined with its edition, pre-ordered to
   * match `compareOffersByFinalPrice`: final price ascending, then most
   * recently observed first (equivalent to `updatedMinutesAgo` ascending),
   * then store id.
   */
  getOffersForEdition(
    gameSlug: string,
    editionId: string
  ): Promise<{ offer: OfferRow; edition: EditionRow }[]>

  /**
   * One grouped query per game: COUNT/MIN over confirmed, in-stock offers for
   * every edition of the game, including editions with zero confirmed
   * offers (left join). No N+1 per edition.
   */
  getEditionAvailabilityAggregates(
    gameSlug: string
  ): Promise<EditionAvailabilityAggregate[]>

  getFirstEditionId(gameSlug: string): Promise<string | undefined>

  getPriceHistory(
    gameSlug: string,
    editionId: string,
    sinceMs: number
  ): Promise<{ observedAt: number; priceSatang: number }[]>
}

export const createPricingRepository = (db: Database): PricingRepository => ({
  async getOffersForEdition(gameSlug, editionId) {
    return db
      .select({ offer: offersCurrent, edition: editions })
      .from(offersCurrent)
      .innerJoin(editions, eq(offersCurrent.editionId, editions.id))
      .where(
        and(
          eq(offersCurrent.gameSlug, gameSlug),
          eq(offersCurrent.editionId, editionId)
        )
      )
      .orderBy(
        asc(offersCurrent.finalSatang),
        desc(offersCurrent.observedAt),
        asc(offersCurrent.storeId)
      )
  },

  async getEditionAvailabilityAggregates(gameSlug) {
    const confirmedInStock = and(
      eq(offersCurrent.regionStatus, 'confirmed'),
      eq(offersCurrent.inStock, 1)
    )
    const rows = await db
      .select({
        edition: editions,
        confirmedOfferCount: sql<number>`COUNT(CASE WHEN ${confirmedInStock} THEN 1 END)`,
        minimumPriceSatang: sql<
          number | null
        >`MIN(CASE WHEN ${confirmedInStock} THEN ${offersCurrent.finalSatang} END)`
      })
      .from(editions)
      .leftJoin(offersCurrent, eq(offersCurrent.editionId, editions.id))
      .where(eq(editions.gameSlug, gameSlug))
      .groupBy(editions.id)
      .orderBy(asc(editions.position))

    return rows.map((row) => ({
      edition: row.edition,
      confirmedOfferCount: Number(row.confirmedOfferCount),
      minimumPriceSatang:
        row.minimumPriceSatang === null ? null : Number(row.minimumPriceSatang)
    }))
  },

  async getFirstEditionId(gameSlug) {
    const [row] = await db
      .select({ id: editions.id })
      .from(editions)
      .where(eq(editions.gameSlug, gameSlug))
      .orderBy(asc(editions.position))
      .limit(1)
    return row?.id
  },

  async getPriceHistory(gameSlug, editionId, sinceMs) {
    return db
      .select({
        observedAt: priceHistory.observedAt,
        priceSatang: priceHistory.priceSatang
      })
      .from(priceHistory)
      .where(
        and(
          eq(priceHistory.gameSlug, gameSlug),
          eq(priceHistory.editionId, editionId),
          gte(priceHistory.observedAt, sinceMs)
        )
      )
      .orderBy(asc(priceHistory.observedAt))
  }
})
