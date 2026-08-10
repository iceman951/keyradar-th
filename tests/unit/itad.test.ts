import { describe, expect, it } from 'vitest';
import type { Game, Store } from '$lib/domain/models';
import { hasConsistentFinalPrice } from '$lib/domain/pricing';
import { regionPresentation } from '$lib/domain/presentation';
import { crossRates, toSatang } from '$lib/itad/fx';
import { FX_FEE_RATE, drmLabel, mapDealToCatalogOffer } from '$lib/itad/map-offer';
import { buildCatalog, editionLookups } from '$lib/itad/build-catalog';
import {
  DAY_MS,
  HISTORY_CAP_DAYS,
  appendHistory,
  downsampleByBucketMin,
  historyToPoints,
  ictEpochDay
} from '$lib/itad/history';
import { catalogIsStale, reviveCatalog, snapshotFromCatalog } from '$lib/itad/revive';
import { CATALOG_VERSION, type Catalog, type ItadDeal } from '$lib/itad/types';

const FX = { amount: 1, base: 'USD', date: '2026-08-08', rates: { THB: 33.055, EUR: 0.86693, GBP: 0.74352 } };
const RATES = crossRates(FX);
const FETCHED_AT = '2026-08-10T01:00:00.000Z';

const deal = (overrides: Partial<ItadDeal> = {}): ItadDeal => ({
  shop: { id: 6, name: 'Fanatical' },
  price: { amount: 29.99, amountInt: 2999, currency: 'USD' },
  regular: { amount: 59.99, amountInt: 5999, currency: 'USD' },
  cut: 50,
  voucher: null,
  drm: [{ id: 61, name: 'Steam' }],
  timestamp: '2026-08-10T00:30:00.000Z',
  url: 'https://www.fanatical.com/en/game/x?ref=itad-affiliate',
  ...overrides
});

describe('fx', () => {
  it('derives THB cross rates instead of reusing the base-quoted figure', () => {
    // The bug this guards: taking rates.EUR (0.867) as "THB per EUR".
    expect(RATES.THB).toBe(1);
    expect(RATES.USD).toBeCloseTo(33.055, 3);
    expect(RATES.EUR).toBeCloseTo(33.055 / 0.86693, 3);
    expect(RATES.GBP).toBeCloseTo(33.055 / 0.74352, 3);
    expect(RATES.EUR).toBeGreaterThan(RATES.USD);
  });

  it('rejects an FX response with no usable THB rate', () => {
    expect(() => crossRates({ ...FX, rates: { EUR: 0.86 } })).toThrow(/THB/);
  });

  it('converts minor units to integer satang and treats THB as identity', () => {
    expect(toSatang(159000, 'THB', RATES)).toBe(159000);
    expect(toSatang(2999, 'USD', RATES)).toBe(Math.round(2999 * 33.055));
    expect(Number.isInteger(toSatang(2999, 'USD', RATES))).toBe(true);
    expect(toSatang(2999, 'JPY', RATES)).toBeNull();
  });
});

describe('mapDealToCatalogOffer', () => {
  const base = { storeId: 'fanatical', rates: RATES, historyLowSatang: null, fetchedAt: FETCHED_AT };

  it('preserves the affiliate URL byte-for-byte', () => {
    const source = deal();
    const offer = mapDealToCatalogOffer({ ...base, deal: source })!;
    // ITAD's terms require the affiliate tag to survive intact.
    expect(offer.purchaseUrl).toBe(source.url);
  });

  it('adds an FX conversion fee for non-THB prices and keeps the total consistent', () => {
    const offer = mapDealToCatalogOffer({ ...base, deal: deal() })!;
    expect(offer.approximate).toBe(true);
    expect(offer.sourceCurrency).toBe('USD');
    expect(offer.feesSatang).toBe(Math.round(offer.advertisedSatang * FX_FEE_RATE));
    expect(offer.finalSatang).toBe(offer.advertisedSatang + offer.feesSatang);
  });

  it('charges no conversion fee when the store already quotes THB', () => {
    const offer = mapDealToCatalogOffer({
      ...base,
      storeId: 'steam',
      deal: deal({ shop: { id: 61, name: 'Steam' }, price: { amount: 1590, amountInt: 159000, currency: 'THB' } })
    })!;
    expect(offer.approximate).toBe(false);
    expect(offer.feesSatang).toBe(0);
    expect(offer.finalSatang).toBe(159000);
  });

  it('derives region from the curated table and defaults unknown stores to uncertain', () => {
    expect(mapDealToCatalogOffer({ ...base, storeId: 'steam', deal: deal() })!.region).toBe('thailand');
    expect(mapDealToCatalogOffer({ ...base, storeId: 'dreamgame', deal: deal() })!.region).toBe('sea');
    const unknown = mapDealToCatalogOffer({ ...base, storeId: 'brand-new-shop', deal: deal() })!;
    expect(unknown.region).toBe('row');
    expect(regionPresentation(unknown.region).status).toBe('uncertain');
  });

  it('flags a historical low only at or below the recorded low', () => {
    const offer = mapDealToCatalogOffer({ ...base, deal: deal() })!;
    const atLow = mapDealToCatalogOffer({ ...base, deal: deal(), historyLowSatang: offer.advertisedSatang })!;
    const above = mapDealToCatalogOffer({ ...base, deal: deal(), historyLowSatang: 100 })!;
    expect(atLow.isHistoricalLow).toBe(true);
    expect(above.isHistoricalLow).toBe(false);
  });

  it('passes a voucher code through without folding it into the price', () => {
    const offer = mapDealToCatalogOffer({ ...base, deal: deal({ voucher: 'SUMMER10' }) })!;
    expect(offer.voucherCode).toBe('SUMMER10');
    expect(offer.finalSatang).toBe(offer.advertisedSatang + offer.feesSatang);
  });

  it('drops a deal it cannot price in THB rather than guessing', () => {
    expect(
      mapDealToCatalogOffer({
        ...base,
        deal: deal({ price: { amount: 1, amountInt: 100, currency: 'JPY' } })
      })
    ).toBeNull();
  });

  it('labels DRM so the Steam filter matches exactly the Steam-activated stores', () => {
    expect(drmLabel(deal(), 'steam')).toBe('Steam');
    expect(drmLabel(deal(), 'fanatical')).toBe('Steam Key');
    expect(drmLabel(deal({ drm: [{ id: 1, name: 'GOG' }] }), 'gog')).toBe('GOG.com');
    expect(drmLabel(deal({ drm: [{ id: 2, name: 'EA App' }] }), 'gmg')).toBe('EA app');
    // filters.ts decides by substring, so non-Steam labels must not contain "steam".
    expect(drmLabel(deal({ drm: [{ id: 1, name: 'GOG' }] }), 'gog').toLowerCase()).not.toContain('steam');
  });
});

describe('buildCatalog', () => {
  const game: Game = {
    slug: 'test-game', steamAppId: 4242, title: 'Test Game', year: 2024, developer: 'D', publisher: 'P',
    releaseDate: '1 ม.ค. 2567', genres: ['แอ็กชัน'], reviewPercent: 90, reviewCount: 10, popularity: 50, hue: 10,
    editions: [
      { key: 'standard', name: 'Standard Edition', category: 'standard', steamPriceSatang: 159000 },
      { key: 'deluxe', name: 'Deluxe Edition', category: 'deluxe', steamPriceSatang: 199000 }
    ]
  };
  const store = (id: string, itadShopId?: number): Store => ({
    id, name: id, initials: id.slice(0, 2).toUpperCase(), type: id === 'steam' ? 'steam' : 'official',
    payments: [], feeRate: 0, feeLabel: '', note: '', websiteUrl: 'https://example.com/', itadShopId
  });
  const stores = [store('steam', 61), store('fanatical', 6), store('humble', 37), store('legacy')];

  const prices = {
    'itad-std': {
      id: 'itad-std',
      historyLow: { all: { amount: 9.99, amountInt: 999, currency: 'USD' } },
      deals: [
        deal({ shop: { id: 61, name: 'Steam' }, price: { amount: 1290, amountInt: 129000, currency: 'THB' }, regular: { amount: 1490, amountInt: 149000, currency: 'THB' } }),
        deal({ shop: { id: 6, name: 'Fanatical' } }),
        deal({ shop: { id: 999, name: 'Kinguin' }, url: 'https://kinguin.net/x' })
      ]
    }
  };
  // Steam's real Thai price, which never comes from ITAD.
  const steamPrices = { 4242: { initialSatang: 149000, finalSatang: 129000, discountPercent: 13 } };
  const input = {
    games: [game], stores, prices, idByEdition: { 'test-game|standard': 'itad-std' }, steamPrices,
    rates: RATES, fx: { date: FX.date, rates: RATES, stale: false }, fetchedAt: FETCHED_AT, previous: null
  };

  it('builds one lookup per edition because ITAD models editions as separate games', () => {
    const lookups = editionLookups([game]);
    expect(lookups.map((l) => l.lookupTitle)).toEqual(['Test Game', 'Test Game Deluxe Edition']);
  });

  it('excludes shops that are not in the fixture allowlist', () => {
    const catalog = buildCatalog(input);
    const ids = catalog.games['test-game'].editions.standard.offers.map((o) => o.storeId);
    expect(ids).toContain('steam');
    expect(ids).toContain('fanatical');
    expect(ids).not.toContain('kinguin');
    expect(catalog.stores.map((s) => s.id)).not.toContain('legacy');
  });

  it('drops editions with no offers but keeps games that resolved at least one', () => {
    const catalog = buildCatalog(input);
    expect(Object.keys(catalog.games['test-game'].editions)).toEqual(['standard']);
  });

  it('takes the Steam price from Steam, not from ITAD', () => {
    const catalog = buildCatalog(input);
    const standard = catalog.games['test-game'].editions.standard;
    // Reference price is Steam's regular THB figure, not the fixture's 159000.
    expect(standard.steamPriceSatang).toBe(149000);

    const steamOffer = standard.offers.find((offer) => offer.storeId === 'steam')!;
    // ITAD's Steam row quoted THB 1290.00 as a *US-derived* price; the offer must
    // come from Steam's own API instead, and must never be marked approximate.
    expect(steamOffer.finalSatang).toBe(129000);
    expect(steamOffer.approximate).toBe(false);
    expect(steamOffer.feesSatang).toBe(0);
    expect(steamOffer.purchaseUrl).toBe('https://store.steampowered.com/app/4242/');
  });

  it('falls back to the fixture price when Steam has nothing to say', () => {
    const catalog = buildCatalog({ ...input, steamPrices: {} });
    const standard = catalog.games['test-game'].editions.standard;
    expect(standard.steamPriceSatang).toBe(159000);
    expect(standard.offers.some((offer) => offer.storeId === 'steam')).toBe(false);
  });

  it('does not flag a store that simply never stocked these games', () => {
    // Humble returns nothing here, but it never did — that is not a failure, and
    // reporting it would show a permanent false warning in the UI.
    const catalog = buildCatalog(input);
    expect(catalog.failedStores).toEqual([]);
  });

  it('flags a store as failed only when it drops out after having offers', () => {
    const previous = buildCatalog(input);
    const withoutFanatical = {
      'itad-std': {
        ...prices['itad-std'],
        deals: prices['itad-std'].deals.filter((d) => d.shop.id !== 6)
      }
    };
    const next = buildCatalog({ ...input, prices: withoutFanatical, previous });
    expect(next.failedStores).toEqual(['fanatical']);
  });

  it('still serves the Steam price when ITAD returns nothing', () => {
    const catalog = buildCatalog({ ...input, prices: {} });
    const offers = catalog.games['test-game'].editions.standard.offers;
    // Two independent sources: losing ITAD must not blank the page.
    expect(offers.map((offer) => offer.storeId)).toEqual(['steam']);
    expect(catalog.games['test-game'].stale).toBe(false);
  });

  it('carries the previous run forward and marks it stale when nothing resolves', () => {
    const previous = buildCatalog(input);
    const carried = buildCatalog({ ...input, prices: {}, steamPrices: {}, previous });
    expect(carried.games['test-game'].stale).toBe(true);
    expect(carried.games['test-game'].editions.standard.offers.length).toBeGreaterThan(0);
  });

  it('keeps every edition with empty offers when there is nothing to carry forward', () => {
    const empty = buildCatalog({ ...input, prices: {}, steamPrices: {}, previous: null });
    expect(Object.keys(empty.games['test-game'].editions).sort()).toEqual(['deluxe', 'standard']);
    expect(empty.games['test-game'].editions.standard.offers).toEqual([]);
  });
});

describe('appendHistory', () => {
  const t0 = Date.parse('2026-08-10T05:00:00Z');
  const key = 'test-game|standard';

  it('records the day minimum, not the latest reading', () => {
    let store = appendHistory(null, { [key]: 12000 }, t0);
    store = appendHistory(store, { [key]: 9000 }, t0 + 3_600_000);
    store = appendHistory(store, { [key]: 15000 }, t0 + 7_200_000);
    expect(store.series[key]).toEqual([9000]);
  });

  it('pads missed runs with null instead of flattening the line', () => {
    let store = appendHistory(null, { [key]: 12000 }, t0);
    store = appendHistory(store, { [key]: 8000 }, t0 + DAY_MS * 3);
    expect(store.series[key]).toEqual([12000, null, null, 8000]);
  });

  it('keeps series aligned when a key is missing from a run', () => {
    let store = appendHistory(null, { a: 100, b: 200 }, t0);
    store = appendHistory(store, { a: 90 }, t0 + DAY_MS);
    expect(store.series.a).toEqual([100, 90]);
    expect(store.series.b).toEqual([200, null]);
  });

  it('trims the head past the cap and advances startDay by what it dropped', () => {
    const startDay = ictEpochDay(t0);
    const full = {
      version: 1,
      startDay,
      series: { [key]: Array.from({ length: HISTORY_CAP_DAYS }, () => 1000) }
    };
    const rolled = appendHistory(full, { [key]: 500 }, t0 + DAY_MS * HISTORY_CAP_DAYS);
    expect(rolled.series[key]).toHaveLength(HISTORY_CAP_DAYS);
    expect(rolled.startDay).toBe(startDay + 1);
    expect(rolled.series[key].at(-1)).toBe(500);
  });

  it('reads back only real points inside the requested window', () => {
    let store = appendHistory(null, { [key]: 12000 }, t0);
    store = appendHistory(store, { [key]: 8000 }, t0 + DAY_MS * 2);
    const points = historyToPoints(store, key, 30, t0 + DAY_MS * 2);
    expect(points.map((p) => p.priceSatang)).toEqual([12000, 8000]);
    expect(points[0].date).toBeInstanceOf(Date);
  });
});

describe('downsampleByBucketMin', () => {
  const points = Array.from({ length: 100 }, (_, i) => ({
    date: new Date(Date.parse('2026-01-01T00:00:00Z') + i * DAY_MS),
    priceSatang: 1000 + ((i * 37) % 500)
  }));

  it('caps the count while preserving the true endpoints', () => {
    const out = downsampleByBucketMin(points, 10);
    expect(out).toHaveLength(10);
    expect(out[0]).toEqual(points[0]);
    expect(out.at(-1)).toEqual(points.at(-1));
  });

  it('returns the input untouched when it already fits', () => {
    expect(downsampleByBucketMin(points.slice(0, 5), 10)).toHaveLength(5);
  });

  it('takes the minimum of each bucket', () => {
    const out = downsampleByBucketMin(points, 4);
    const secondBucket = points.slice(25, 50);
    expect(out[1].priceSatang).toBe(Math.min(...secondBucket.map((p) => p.priceSatang)));
  });
});

describe('reviveCatalog', () => {
  const catalog: Catalog = {
    version: CATALOG_VERSION,
    fetchedAt: FETCHED_AT,
    fx: { date: FX.date, rates: RATES, stale: false },
    stores: [],
    failedStores: [],
    games: {
      'test-game': {
        stale: false,
        editions: {
          standard: {
            name: 'Standard Edition',
            category: 'standard',
            steamPriceSatang: 159000,
            offers: [
              {
                storeId: 'fanatical', advertisedSatang: 99132, feesSatang: 2478, finalSatang: 101610,
                region: 'global', drm: 'Steam Key', updatedAt: '2026-06-11T20:50:49.000Z',
                isHistoricalLow: false, sourceCurrency: 'USD', approximate: true,
                voucherCode: null, purchaseUrl: 'https://example.com/buy?ref=itad'
              }
            ]
          }
        }
      }
    }
  };

  it('rejects payloads it cannot trust, including an HTML SPA fallback', () => {
    expect(reviveCatalog(null)).toBeNull();
    expect(reviveCatalog('<!doctype html>')).toBeNull();
    expect(reviveCatalog({ version: 99, fetchedAt: FETCHED_AT, games: {}, stores: [] })).toBeNull();
    expect(reviveCatalog({ ...catalog, fetchedAt: 'not-a-date' })).toBeNull();
    expect(reviveCatalog(catalog)).not.toBeNull();
  });

  it('reports freshness from when we fetched, not when the shop changed its price', () => {
    const now = Date.parse('2026-08-10T02:00:00.000Z');
    const snapshot = snapshotFromCatalog(catalog, 'test-game', 'standard', now);
    expect(snapshot.fetchedAt).toBeInstanceOf(Date);
    // The offer's own updatedAt is 60 days old here; surfacing that under
    // "last updated" would read as badly stale data we had just refreshed.
    expect(Date.now() - Date.parse(catalog.games['test-game'].editions.standard.offers[0].updatedAt))
      .toBeGreaterThan(0);
    expect(snapshot.offers[0].updatedMinutesAgo).toBe(60);
  });

  it('rebuilds the fee breakdown so the final price stays internally consistent', () => {
    const snapshot = snapshotFromCatalog(catalog, 'test-game', 'standard', Date.parse(FETCHED_AT));
    const offer = snapshot.offers[0];
    expect(offer.fees).toHaveLength(1);
    expect(hasConsistentFinalPrice(offer)).toBe(true);
    expect(offer.regionStatus).toBe(regionPresentation(offer.region).status);
    expect(offer.inStock).toBe(true);
  });

  it('turns stale once the catalog ages past the refresh window', () => {
    const fresh = Date.parse(FETCHED_AT) + 60_000;
    const old = Date.parse(FETCHED_AT) + 11 * 60 * 60 * 1000;
    expect(catalogIsStale(catalog, fresh)).toBe(false);
    expect(catalogIsStale(catalog, old)).toBe(true);
    expect(snapshotFromCatalog(catalog, 'test-game', 'standard', old).stale).toBe(true);
  });

  it('returns an empty snapshot for a game the catalog does not carry', () => {
    const snapshot = snapshotFromCatalog(catalog, 'missing', 'standard', Date.now());
    expect(snapshot.offers).toEqual([]);
    expect(snapshot.gameSlug).toBe('missing');
  });
});
