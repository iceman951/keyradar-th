import type { GameRepository } from './game-repository';
import { games, stores } from './fixtures';
import type { Offer, PricePoint } from '$lib/domain/models';

const hash = (text: string): number => {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
};

const randomFor = (seed: string): (() => number) => {
  let state = hash(seed);
  return () => {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
};

const priceBands: Record<string, [number, number]> = {
  eneba: [0.44, 0.16], kinguin: [0.47, 0.15], cdkeys: [0.52, 0.14], instant: [0.55, 0.14],
  fanatical: [0.61, 0.15], gmg: [0.65, 0.15], humble: [0.7, 0.15], gamesplanet: [0.72, 0.15],
  gamersgate: [0.68, 0.16], steam: [1, 0]
};

export class MockGameRepository implements GameRepository {
  async listGames() { return games; }
  async getGame(slug: string) { return games.find((game) => game.slug === slug); }
  async searchGames(query: string) {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return [...games].sort((a, b) => b.popularity - a.popularity).slice(0, 6);
    return games.filter((game) => game.title.toLocaleLowerCase().includes(normalized));
  }
  async listStores() { return stores; }
  async getOffers(gameSlug: string, editionKey = 'standard') {
    const game = games.find((item) => item.slug === gameSlug) ?? games[0];
    const selected = game.editions.find((item) => item.key === editionKey) ?? game.editions[0];
    const rand = randomFor(`${game.slug}|${selected.key}`);
    const offers: Offer[] = stores.map((store, index) => {
      const [low, spread] = priceBands[store.id];
      const advertisedBaht = store.id === 'steam'
        ? selected.steamPriceSatang / 100
        : Math.max(49, Math.round((selected.steamPriceSatang / 100) * (low + rand() * spread) / 5) * 5 - 1);
      const advertisedSatang = advertisedBaht * 100;
      const feeSatang = store.feeRate ? Math.max(900, Math.round(advertisedSatang * store.feeRate)) : 0;
      const region = store.id === 'steam' ? 'ไทย' : store.id === 'gamesplanet' ? 'ยุโรป (EU)' : index % 5 === 0 ? 'SEA' : 'Global';
      const regionStatus = region === 'ยุโรป (EU)' ? 'uncertain' as const : 'confirmed' as const;
      return {
        id: `${game.slug}-${selected.key}-${store.id}`,
        gameSlug: game.slug,
        storeId: store.id,
        editionKey: selected.key,
        advertisedSatang,
        feeSatang,
        finalSatang: advertisedSatang + feeSatang,
        steamPriceSatang: selected.steamPriceSatang,
        region,
        regionStatus,
        drm: store.id === 'steam' ? 'Steam' : 'Steam Key',
        inStock: !(store.id === 'gamersgate' && rand() < 0.45),
        updatedMinutesAgo: 2 + Math.floor(rand() * 220),
        sellerRating: store.type === 'marketplace' ? 95.5 + rand() * 4 : undefined
      };
    });
    return offers.sort((a, b) => a.finalSatang - b.finalSatang);
  }
  async getPriceHistory(gameSlug: string, days: number) {
    const game = games.find((item) => item.slug === gameSlug) ?? games[0];
    const offers = await this.getOffers(gameSlug);
    const current = offers.find((offer) => offer.regionStatus === 'confirmed' && offer.inStock)?.finalSatang ?? game.editions[0].steamPriceSatang;
    const count = days <= 30 ? 30 : days <= 92 ? 46 : days <= 183 ? 61 : 73;
    const rand = randomFor(`${gameSlug}|${days}`);
    const now = new Date('2026-08-02T14:32:00+07:00');
    return Array.from({ length: count }, (_, index): PricePoint => ({
      date: new Date(now.getTime() - (count - 1 - index) * (days / (count - 1)) * 86400000),
      priceSatang: index === count - 1 ? current : Math.round(game.editions[0].steamPriceSatang * (0.45 + rand() * 0.5) / 100) * 100
    }));
  }
}

export const gameRepository: GameRepository = new MockGameRepository();
