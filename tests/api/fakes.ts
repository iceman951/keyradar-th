/**
 * In-memory `RouteCatalogService`/`PricingService` implementations backed by
 * the same deterministic catalog D1 is seeded from. Route tests exercise the
 * real Elysia app (schemas, error handling, cache headers) without standing
 * up D1/drizzle — see IMPLEMENTATION_SPEC.md §18.3: "Use dependency
 * injection or repository stubs for fast route tests."
 */
import { games, stores, buildOffers, buildPriceHistory } from '../../shared/seed/catalog';
import { bestThaiOffer, confirmedThaiOffers } from '../../shared/domain/pricing';
import { sortStoresByTrust } from '../../shared/domain/stores';
import { gameNotFound, editionNotFound } from '../../worker/errors';
import type { RouteCatalogService } from '../../worker/app';
import type { PricingService } from '../../worker/modules/pricing/pricing.service';
import type { Game } from '../../shared/domain/models';
import type { GameDto, GameSortOrder, StoreDto } from '../../shared/contracts/api-dto';

const toGameDto = (game: Game): GameDto => ({ ...game, editions: game.editions.map((e) => ({ ...e })) });

const sortGames = (list: Game[], sort: GameSortOrder): Game[] => {
  const sorted = [...list];
  switch (sort) {
    case 'title':
      return sorted.sort(
        (a, b) => a.title.toLocaleLowerCase().localeCompare(b.title.toLocaleLowerCase()) || a.slug.localeCompare(b.slug)
      );
    case 'release':
      return sorted.sort((a, b) => b.year - a.year || b.popularity - a.popularity || a.slug.localeCompare(b.slug));
    case 'popular':
    default:
      return sorted.sort((a, b) => b.popularity - a.popularity || a.slug.localeCompare(b.slug));
  }
};

export const createFakeCatalog = (): RouteCatalogService => ({
  async listGames({ limit, sort = 'popular' }) {
    const sorted = sortGames(games, sort);
    return (limit ? sorted.slice(0, limit) : sorted).map(toGameDto);
  },

  async searchGames(query, limit = 6) {
    const normalized = query.trim().toLocaleLowerCase();
    const matches = games.filter((game) => game.title.toLocaleLowerCase().includes(normalized));
    return sortGames(matches, 'popular').slice(0, limit).map(toGameDto);
  },

  async getGame(slug) {
    const game = games.find((item) => item.slug === slug);
    if (!game) throw gameNotFound(slug);
    return toGameDto(game);
  },

  async listStores() {
    const dtos: StoreDto[] = stores.map((store) => ({
      id: store.id,
      name: store.name,
      initials: store.initials,
      type: store.type,
      payments: store.payments,
      feeRateBps: Math.round(store.feeRate * 10_000),
      feeLabel: store.feeLabel,
      note: store.note,
      websiteUrl: store.websiteUrl
    }));
    // sortStoresByTrust operates on the domain Store[] shape; sort the DTOs
    // by the same rule so the fake matches the real SQL ORDER BY exactly.
    const order = new Map(sortStoresByTrust(stores).map((store, index) => [store.id, index]));
    return dtos.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }
});

export const createFakePricing = (): PricingService => ({
  async getOffers(gameSlug, editionKey) {
    const game = games.find((item) => item.slug === gameSlug);
    if (!game) throw gameNotFound(gameSlug);
    const edition = editionKey
      ? game.editions.find((item) => item.key === editionKey)
      : game.editions[0];
    if (!edition) throw editionNotFound(gameSlug, editionKey ?? '(default)');

    const offers = buildOffers(gameSlug, edition.key);
    const historicalId = bestThaiOffer(offers)?.id;
    const sorted = offers
      .map((offer) => ({ ...offer, isHistoricalLow: offer.id === historicalId }))
      .sort((a, b) => a.finalSatang - b.finalSatang || a.storeId.localeCompare(b.storeId));

    return {
      gameSlug,
      editionKey: edition.key,
      offers: sorted.map((offer) => ({
        ...offer,
        observedAt: new Date(Date.now() - offer.updatedMinutesAgo * 60_000).toISOString()
      })),
      fetchedAt: new Date().toISOString(),
      failedStores: [],
      stale: false
    };
  },

  async getEditionAvailability(gameSlug) {
    const game = games.find((item) => item.slug === gameSlug);
    if (!game) throw gameNotFound(gameSlug);

    return game.editions.map((edition) => {
      const offers = buildOffers(gameSlug, edition.key);
      const confirmed = confirmedThaiOffers(offers);
      const best = bestThaiOffer(offers);
      return {
        editionKey: edition.key,
        editionName: edition.name,
        category: edition.category,
        steamPriceSatang: edition.steamPriceSatang,
        minimumPriceSatang: best?.finalSatang ?? null,
        confirmedOfferCount: confirmed.length,
        availableInThailand: confirmed.length > 0,
        status: confirmed.length > 0 ? ('available' as const) : ('no-thai-offer' as const)
      };
    });
  },

  async getPriceHistory(gameSlug, days) {
    const game = games.find((item) => item.slug === gameSlug);
    if (!game) throw gameNotFound(gameSlug);
    const firstEdition = game.editions[0];
    const offers = buildOffers(gameSlug, firstEdition.key);
    const ending = bestThaiOffer(offers)?.finalSatang ?? firstEdition.steamPriceSatang;
    return buildPriceHistory(gameSlug, days, ending, Date.now()).map((point) => ({
      date: new Date(point.observedAt).toISOString(),
      priceSatang: point.priceSatang
    }));
  }
});
