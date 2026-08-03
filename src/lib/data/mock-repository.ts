import type { GameRepository } from './game-repository';
import { games, stores } from './fixtures';
import { getEditionAvailability } from '$lib/domain/editions';
import type {
  EditionAvailability,
  Offer,
  OfferFee,
  OfferSnapshot,
  PricePoint,
  RegionCode,
  Store
} from '$lib/domain/models';
import { regionPresentation } from '$lib/domain/presentation';
import {
  bestThaiOffer,
  compareOffersByFinalPrice,
  offerFeeTotal
} from '$lib/domain/pricing';
import { sortStoresByTrust } from '$lib/domain/stores';

export type MockOfferMode = 'ready' | 'stale' | 'store-down' | 'error';

export interface MockRepositoryOptions {
  offerMode?: MockOfferMode;
  now?: Date;
}

const DEFAULT_FETCHED_AT = new Date('2026-08-02T14:32:00+07:00');

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

const PRICE_BANDS: Readonly<Record<string, readonly [number, number]>> = {
  eneba: [0.44, 0.16],
  kinguin: [0.47, 0.15],
  cdkeys: [0.52, 0.14],
  instant: [0.55, 0.14],
  fanatical: [0.61, 0.15],
  gmg: [0.65, 0.15],
  humble: [0.7, 0.15],
  gamesplanet: [0.72, 0.15],
  gamersgate: [0.68, 0.16],
  steam: [1, 0]
};

const purchaseUrlFor = (store: Store, title: string): string => {
  const query = encodeURIComponent(title);
  switch (store.id) {
    case 'steam':
      return `https://store.steampowered.com/search/?term=${query}`;
    case 'fanatical':
      return `https://www.fanatical.com/en/search?search=${query}`;
    case 'gamersgate':
      return `https://www.gamersgate.com/games/?query=${query}`;
    case 'gamesplanet':
      return `https://us.gamesplanet.com/search?query=${query}`;
    case 'gmg':
      return `https://www.greenmangaming.com/search/?query=${query}`;
    case 'humble':
      return `https://www.humblebundle.com/store/search?search=${query}`;
    case 'cdkeys':
      return `https://www.cdkeys.com/catalogsearch/result/?q=${query}`;
    case 'instant':
      return `https://www.instant-gaming.com/en/search/?query=${query}`;
    case 'eneba':
      return `https://www.eneba.com/store?text=${query}`;
    case 'kinguin':
      return `https://www.kinguin.net/listing?active=1&phrase=${query}`;
    default:
      return store.websiteUrl;
  }
};

const regionFor = (storeId: string, gameSlug: string, random: () => number): RegionCode => {
  switch (storeId) {
    case 'steam':
      return 'thailand';
    case 'cdkeys':
      return 'sea';
    case 'gamesplanet':
      return 'eu';
    case 'kinguin':
      return 'row';
    case 'humble':
      return gameSlug === 'helldivers-2' ? 'north-america' : 'global';
    case 'eneba':
      return random() < 0.34 ? 'eu' : 'global';
    default:
      return 'global';
  }
};

const drmFor = (gameSlug: string, storeId: string): string => {
  if (storeId === 'steam') return 'Steam';
  if (gameSlug === 'it-takes-two' && (storeId === 'gmg' || storeId === 'humble')) {
    return 'EA app';
  }
  if (gameSlug === 'cyberpunk-2077' && storeId === 'gmg') return 'GOG.com';
  return 'Steam Key';
};

const feesFor = (store: Store, advertisedSatang: number, random: () => number): OfferFee[] => {
  const fees: OfferFee[] = [];
  if (store.feeRate > 0) {
    fees.push({
      kind: store.id === 'kinguin' ? 'buyer-protection' : 'platform',
      label: store.feeLabel,
      amountSatang: Math.max(900, Math.round(advertisedSatang * store.feeRate))
    });
  }
  if (store.id === 'eneba' && random() < 0.4) {
    fees.push({
      kind: 'payment',
      label: 'ค่าธรรมเนียมการชำระเงิน',
      amountSatang: 1_500
    });
  }
  return fees;
};

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

    const game = games.find((item) => item.slug === gameSlug);
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

    const selected = game.editions.find((item) => item.key === editionKey) ?? game.editions[0];
    const random = randomFor(`${game.slug}|${selected.key}`);
    const offers = stores.map((store): Offer => {
      const [low, spread] = PRICE_BANDS[store.id];
      const advertisedSatang = store.id === 'steam'
        ? selected.steamPriceSatang
        : Math.max(
            4_900,
            Math.round((selected.steamPriceSatang * (low + random() * spread)) / 500) * 500 - 100
          );
      const fees = feesFor(store, advertisedSatang, random);
      const region = regionFor(store.id, game.slug, random);
      const presentation = regionPresentation(region);
      const marketplace = store.type === 'marketplace';
      return {
        id: `${game.slug}-${selected.key}-${store.id}`,
        gameSlug: game.slug,
        storeId: store.id,
        editionKey: selected.key,
        editionName: selected.name,
        editionCategory: selected.category,
        advertisedSatang,
        fees,
        finalSatang: advertisedSatang + offerFeeTotal({ fees }),
        steamPriceSatang: selected.steamPriceSatang,
        region,
        regionStatus: presentation.status,
        drm: drmFor(game.slug, store.id),
        inStock: !(store.id === 'gamersgate' && random() < 0.5),
        updatedMinutesAgo: 2 + Math.floor(random() * 220),
        sellerRating: marketplace ? Math.round((95.5 + random() * 4) * 10) / 10 : undefined,
        sellerReviewCount: marketplace ? 1_200 + Math.floor(random() * 38_000) : undefined,
        isHistoricalLow: false,
        purchaseUrl: purchaseUrlFor(store, game.title)
      };
    });

    const historicalCandidate = bestThaiOffer(offers);
    const historicalId = historicalCandidate?.id;
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
    const game = games.find((item) => item.slug === gameSlug);
    if (!game) return [];
    const snapshots = await Promise.all(
      game.editions.map((edition) => this.getOffers(game.slug, edition.key))
    );
    return game.editions.map((edition, index) =>
      getEditionAvailability(edition, snapshots[index].offers)
    );
  }

  async getPriceHistory(gameSlug: string, days: number): Promise<PricePoint[]> {
    const game = games.find((item) => item.slug === gameSlug);
    if (!game) return [];
    const snapshot = await this.getOffers(gameSlug);
    const current = bestThaiOffer(snapshot.offers)?.finalSatang ?? game.editions[0].steamPriceSatang;
    const safeDays = Math.max(2, Math.floor(days));
    const count = safeDays <= 30 ? 30 : safeDays <= 92 ? 46 : safeDays <= 183 ? 61 : 73;
    const random = randomFor(`${gameSlug}|${safeDays}`);
    return Array.from({ length: count }, (_, index): PricePoint => ({
      date: new Date(
        this.now.getTime() - (count - 1 - index) * (safeDays / (count - 1)) * 86_400_000
      ),
      priceSatang: index === count - 1
        ? current
        : Math.round(game.editions[0].steamPriceSatang * (0.45 + random() * 0.5) / 100) * 100
    }));
  }
}

export const gameRepository: GameRepository = new MockGameRepository();
