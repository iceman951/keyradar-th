import type { GameRepository } from './game-repository';
import { games, stores } from './fixtures';
import { getEditionAvailability } from '$lib/domain/editions';
import type {
  EditionAvailability,
  OfferSnapshot,
  PricePoint
} from '$lib/domain/models';
import { bestThaiOffer, compareOffersByFinalPrice } from '$lib/domain/pricing';
import { sortStoresByTrust } from '$lib/domain/stores';
import {
  buildOffers,
  buildPriceHistory,
  findEdition,
  findGame
} from '../../../shared/seed/catalog.ts';

export type MockOfferMode = 'ready' | 'stale' | 'store-down' | 'error';

export interface MockRepositoryOptions {
  offerMode?: MockOfferMode;
  now?: Date;
}

const DEFAULT_FETCHED_AT = new Date('2026-08-02T14:32:00+07:00');

const failedStoresFor = (mode: MockOfferMode): string[] => {
  switch (mode) {
    case 'ready':
      return [];
    case 'stale':
      return ['gamesplanet'];
    case 'store-down':
      return ['gamesplanet', 'gamersgate'];
    case 'error':
      return [];
  }
};

export class MockGameRepository implements GameRepository {
  private readonly offerMode: MockOfferMode;
  private readonly now: Date;

  constructor(options: MockRepositoryOptions = {}) {
    this.offerMode = options.offerMode ?? 'ready';
    this.now = new Date(options.now ?? DEFAULT_FETCHED_AT);
  }

  async listGames() {
    return games;
  }

  async getGame(slug: string) {
    return games.find((game) => game.slug === slug);
  }

  async searchGames(query: string) {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) {
      return [...games].sort((a, b) => b.popularity - a.popularity).slice(0, 6);
    }
    return games.filter((game) => game.title.toLocaleLowerCase().includes(normalized));
  }

  async listStores() {
    return sortStoresByTrust(stores);
  }

  async getOffers(gameSlug: string, editionKey = 'standard'): Promise<OfferSnapshot> {
    if (this.offerMode === 'error') {
      throw new Error('ไม่สามารถดึงข้อมูลราคาจากร้านค้าได้');
    }

    const game = findGame(gameSlug);
    if (!game) {
      return {
        gameSlug,
        editionKey,
        offers: [],
        fetchedAt: new Date(this.now),
        failedStores: failedStoresFor(this.offerMode),
        stale: this.offerMode !== 'ready'
      };
    }

    const selected = findEdition(game, editionKey);
    const offers = buildOffers(game.slug, selected.key);
    const historicalId = bestThaiOffer(offers)?.id;
    const sortedOffers = offers
      .map((offer) => ({ ...offer, isHistoricalLow: offer.id === historicalId }))
      .sort(compareOffersByFinalPrice);

    return {
      gameSlug: game.slug,
      editionKey: selected.key,
      offers: sortedOffers,
      fetchedAt: new Date(this.now),
      failedStores: failedStoresFor(this.offerMode),
      stale: this.offerMode !== 'ready'
    };
  }

  async getEditionAvailability(gameSlug: string): Promise<EditionAvailability[]> {
    const game = findGame(gameSlug);
    if (!game) return [];
    const snapshots = await Promise.all(
      game.editions.map((edition) => this.getOffers(game.slug, edition.key))
    );
    return game.editions.map((edition, index) =>
      getEditionAvailability(edition, snapshots[index].offers)
    );
  }

  async getPriceHistory(gameSlug: string, days: number): Promise<PricePoint[]> {
    const game = findGame(gameSlug);
    if (!game) return [];
    const snapshot = await this.getOffers(gameSlug);
    const current = bestThaiOffer(snapshot.offers)?.finalSatang ?? game.editions[0].steamPriceSatang;
    return buildPriceHistory(gameSlug, days, current, this.now.getTime()).map(
      (point): PricePoint => ({
        date: new Date(point.observedAt),
        priceSatang: point.priceSatang
      })
    );
  }
}

export const gameRepository: GameRepository = new MockGameRepository();
