import type { EditionCategory, Game, Store } from '../domain/models';
import { toSatang } from './fx';
import { HISTORICAL_LOW_TOLERANCE, mapDealToCatalogOffer } from './map-offer';
import { regionForStore } from './store-regions';
import type { SteamPrice } from './steam';
import {
  CATALOG_VERSION,
  type Catalog,
  type CatalogEdition,
  type CatalogFx,
  type CatalogGame,
  type CatalogOffer,
  type ItadGamePrices,
  type ThbRates
} from './types';

export interface EditionLookup {
  gameSlug: string;
  editionKey: string;
  editionName: string;
  editionCategory: EditionCategory;
  fixtureSteamPriceSatang: number;
  /** Title we ask ITAD to resolve. */
  lookupTitle: string;
  /** Hard-pinned ITAD id, bypassing lookup entirely. */
  itadId?: string;
}

export const lookupKey = (gameSlug: string, editionKey: string): string =>
  `${gameSlug}|${editionKey}`;

/** ITAD's shop id for Steam. Its rows are dropped in favour of Steam's own API. */
export const ITAD_STEAM_SHOP_ID = 61;

const steamOfferFrom = (
  price: SteamPrice,
  appId: number,
  historyLowSatang: number | null,
  fetchedAt: string
): CatalogOffer => ({
  storeId: 'steam',
  advertisedSatang: price.finalSatang,
  feesSatang: 0,
  finalSatang: price.finalSatang,
  region: regionForStore('steam'),
  drm: 'Steam',
  updatedAt: fetchedAt,
  isHistoricalLow:
    historyLowSatang !== null && price.finalSatang <= historyLowSatang * HISTORICAL_LOW_TOLERANCE,
  sourceCurrency: 'THB',
  approximate: false,
  voucherCode: null,
  purchaseUrl: `https://store.steampowered.com/app/${appId}/`
});

/**
 * One lookup per edition, because ITAD models each edition as its own game.
 * Resolving these up front means every returned deal already belongs to a known
 * edition — no fuzzy matching on the response side.
 */
export const editionLookups = (games: readonly Game[]): EditionLookup[] =>
  games.flatMap((game) =>
    game.editions.map((edition) => ({
      gameSlug: game.slug,
      editionKey: edition.key,
      editionName: edition.name,
      editionCategory: edition.category,
      fixtureSteamPriceSatang: edition.steamPriceSatang,
      lookupTitle:
        edition.itadTitle ??
        (edition.key === 'standard' ? game.title : `${game.title} ${edition.name}`),
      itadId: edition.itadId
    }))
  );

export interface BuildCatalogInput {
  games: readonly Game[];
  stores: readonly Store[];
  /** ITAD game id → its price payload. */
  prices: Readonly<Record<string, ItadGamePrices>>;
  /** `lookupKey()` → ITAD game id. */
  idByEdition: Readonly<Record<string, string>>;
  /** Steam app id → real Thai price, straight from Steam's storefront. */
  steamPrices: Readonly<Record<number, SteamPrice>>;
  rates: ThbRates;
  fx: CatalogFx;
  fetchedAt: string;
  previous: Catalog | null;
}

export const buildCatalog = ({
  games,
  stores,
  prices,
  idByEdition,
  steamPrices,
  rates,
  fx,
  fetchedAt,
  previous
}: BuildCatalogInput): Catalog => {
  // The fixture store list is the allowlist: an ITAD shop we have not vetted
  // never reaches the UI, which is what keeps unauthorised marketplaces out.
  const storeByShopId = new Map<number, Store>();
  for (const store of stores) {
    if (typeof store.itadShopId === 'number') storeByShopId.set(store.itadShopId, store);
  }

  const seenStoreIds = new Set<string>();
  const catalogGames: Record<string, CatalogGame> = {};
  const staleGames: string[] = [];

  for (const game of games) {
    const editions: Record<string, CatalogEdition> = {};

    for (const edition of game.editions) {
      const itadId = edition.itadId ?? idByEdition[lookupKey(game.slug, edition.key)];
      const payload = itadId ? prices[itadId] : undefined;
      // The game-level id belongs to the standard edition; other editions need
      // their own, which we only use once verified.
      const steamAppId =
        edition.steamAppId ?? (edition.key === 'standard' ? game.steamAppId : undefined);
      const steam = steamAppId ? steamPrices[steamAppId] : undefined;
      if (!payload && !steam) continue;

      const historyLowAmount = payload?.historyLow?.all ?? null;
      const historyLowSatang = historyLowAmount
        ? toSatang(historyLowAmount.amountInt, historyLowAmount.currency, rates)
        : null;

      const offers: CatalogOffer[] = [];

      for (const deal of payload?.deals ?? []) {
        // ITAD quotes Steam in USD even for country=TH, so its Steam row would
        // be the US price. Steam's own API supplies the real Thai one below.
        if (deal.shop?.id === ITAD_STEAM_SHOP_ID) continue;

        const store = storeByShopId.get(deal.shop?.id);
        if (!store) continue;

        const offer = mapDealToCatalogOffer({
          deal,
          storeId: store.id,
          rates,
          historyLowSatang,
          fetchedAt
        });
        if (!offer) continue;

        offers.push(offer);
        seenStoreIds.add(store.id);
      }

      if (steam && steamAppId) {
        offers.push(steamOfferFrom(steam, steamAppId, historyLowSatang, fetchedAt));
        seenStoreIds.add('steam');
      }

      if (offers.length === 0) continue;

      offers.sort((a, b) => a.finalSatang - b.finalSatang);
      editions[edition.key] = {
        name: edition.name,
        category: edition.category,
        // Steam's live regular price keeps discounts honest through Steam's own
        // sales; the fixture value is only a fallback.
        steamPriceSatang: steam?.initialSatang ?? edition.steamPriceSatang,
        offers
      };
    }

    if (Object.keys(editions).length > 0) {
      catalogGames[game.slug] = { stale: false, editions };
      continue;
    }

    // Nothing resolved for this game. Prefer the previous run's data over a blank
    // page, but say plainly that it is stale.
    const carried = previous?.games[game.slug];
    if (carried && Object.keys(carried.editions).length > 0) {
      catalogGames[game.slug] = { stale: true, editions: carried.editions };
      staleGames.push(game.slug);
      for (const carriedEdition of Object.values(carried.editions)) {
        for (const offer of carriedEdition.offers) seenStoreIds.add(offer.storeId);
      }
      continue;
    }

    // Keep every edition so the edition switcher is never empty; the page then
    // routes into its existing "no price" empty state.
    catalogGames[game.slug] = {
      stale: false,
      editions: Object.fromEntries(
        game.editions.map((edition) => [
          edition.key,
          {
            name: edition.name,
            category: edition.category,
            steamPriceSatang: edition.steamPriceSatang,
            offers: []
          }
        ])
      )
    };
  }

  const allowlisted = stores.filter((store) => typeof store.itadShopId === 'number');

  // A store that simply does not stock these games is not "failing" — flagging it
  // would raise a permanent false alarm in the UI. Only a store that had offers
  // last run and has none now is a real regression worth reporting.
  const previousStoreIds = new Set<string>();
  for (const game of Object.values(previous?.games ?? {})) {
    for (const edition of Object.values(game.editions)) {
      for (const offer of edition.offers) previousStoreIds.add(offer.storeId);
    }
  }

  return {
    version: CATALOG_VERSION,
    fetchedAt,
    fx,
    stores: allowlisted.filter((store) => seenStoreIds.has(store.id)),
    failedStores: allowlisted
      .filter((store) => !seenStoreIds.has(store.id) && previousStoreIds.has(store.id))
      .map((store) => store.id),
    games: catalogGames
  };
};
