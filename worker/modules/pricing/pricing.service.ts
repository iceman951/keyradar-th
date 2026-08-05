import type { Database } from '../../db/client';
import { editionAvailabilityDto, offerRowToDto } from '../../db/mappers';
import { editionNotFound } from '../../errors';
import type {
  EditionAvailabilityDto,
  OfferSnapshotDto,
  PricePointDto
} from '../../../shared/contracts/api-dto.ts';
import type { CatalogService } from '../catalog/catalog.service';
import { createPricingRepository } from './pricing.repository';

const DAY_MS = 86_400_000;

export interface PricingService {
  getOffers(gameSlug: string, editionKey?: string): Promise<OfferSnapshotDto>;
  getEditionAvailability(gameSlug: string): Promise<EditionAvailabilityDto[]>;
  getPriceHistory(gameSlug: string, days: number): Promise<PricePointDto[]>;
}

export const createPricingService = (db: Database, catalog: CatalogService): PricingService => {
  const repository = createPricingRepository(db);

  return {
    async getOffers(gameSlug, editionKey) {
      // Throws GAME_NOT_FOUND if the slug doesn't exist.
      const { editionRows } = await catalog.getGameRowOrThrow(gameSlug);

      // Spec §12.6: "if editionKey is absent, use the game's first edition."
      // `editionRows` is pre-ordered by `position`, so [0] is that edition.
      const edition = editionKey
        ? editionRows.find((row) => row.editionKey === editionKey)
        : editionRows[0];
      if (!edition) throw editionNotFound(gameSlug, editionKey ?? '(default)');

      const rows = await repository.getOffersForEdition(gameSlug, edition.id);
      const offers = rows.map(({ offer, edition: editionRow }) => offerRowToDto(offer, editionRow));

      return {
        gameSlug,
        editionKey: edition.editionKey,
        offers,
        // "When this snapshot was assembled," distinct from each offer's own
        // `observedAt`. Phase 1 seed data is healthy, so failedStores/stale
        // are always empty/false (spec §12.6).
        fetchedAt: new Date().toISOString(),
        failedStores: [],
        stale: false
      };
    },

    async getEditionAvailability(gameSlug) {
      await catalog.getGameRowOrThrow(gameSlug); // GAME_NOT_FOUND if missing
      const aggregates = await repository.getEditionAvailabilityAggregates(gameSlug);
      return aggregates.map((aggregate) => editionAvailabilityDto(aggregate.edition, aggregate));
    },

    async getPriceHistory(gameSlug, days) {
      await catalog.getGameRowOrThrow(gameSlug); // GAME_NOT_FOUND if missing
      const editionId = await repository.getFirstEditionId(gameSlug);
      if (!editionId) return [];
      const sinceMs = Date.now() - days * DAY_MS;
      const rows = await repository.getPriceHistory(gameSlug, editionId, sinceMs);
      return rows.map(
        (row): PricePointDto => ({
          date: new Date(row.observedAt).toISOString(),
          priceSatang: row.priceSatang
        })
      );
    }
  };
};
