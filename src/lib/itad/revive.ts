import type { Offer, OfferSnapshot } from '../domain/models';
import { regionPresentation } from '../domain/presentation';
import { compareOffersByFinalPrice } from '../domain/pricing';
import { FX_FEE_LABEL } from './map-offer';
import { CATALOG_VERSION, type Catalog, type CatalogOffer } from './types';

/** 8 h cadence plus slack: past this, the catalog is presented as stale. */
export const STALE_AFTER_MS = 10 * 60 * 60 * 1000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Validate a parsed `/api/catalog` payload. Returns null for anything we cannot
 * trust, which sends the repository to its mock fallback.
 */
export const reviveCatalog = (raw: unknown): Catalog | null => {
  if (!isRecord(raw)) return null;
  if (raw.version !== CATALOG_VERSION) return null;
  if (typeof raw.fetchedAt !== 'string' || Number.isNaN(Date.parse(raw.fetchedAt))) return null;
  if (!isRecord(raw.games)) return null;
  if (!Array.isArray(raw.stores)) return null;
  return raw as unknown as Catalog;
};

export const catalogIsStale = (catalog: Catalog, now: number): boolean =>
  now - Date.parse(catalog.fetchedAt) > STALE_AFTER_MS;

export interface OfferContext {
  gameSlug: string;
  editionKey: string;
  editionName: string;
  editionCategory: Offer['editionCategory'];
  steamPriceSatang: number;
  now: number;
  /** When this catalog was fetched — the basis for "last updated". */
  fetchedAtMs: number;
}

export const catalogOfferToDomain = (offer: CatalogOffer, context: OfferContext): Offer => {
  // Freshness means "when did we last check", not `offer.updatedAt`, which is
  // when the shop last *changed* its price — often months ago for a stable
  // listing, and shown here it would read as badly stale data.
  const updatedMinutesAgo = Number.isNaN(context.fetchedAtMs)
    ? 0
    : Math.max(0, Math.round((context.now - context.fetchedAtMs) / 60_000));

  return {
    id: `${context.gameSlug}-${context.editionKey}-${offer.storeId}`,
    gameSlug: context.gameSlug,
    storeId: offer.storeId,
    editionKey: context.editionKey,
    editionName: context.editionName,
    editionCategory: context.editionCategory,
    advertisedSatang: offer.advertisedSatang,
    fees:
      offer.feesSatang > 0
        ? [{ kind: 'payment', label: FX_FEE_LABEL, amountSatang: offer.feesSatang }]
        : [],
    finalSatang: offer.finalSatang,
    steamPriceSatang: context.steamPriceSatang,
    region: offer.region,
    regionStatus: regionPresentation(offer.region).status,
    drm: offer.drm,
    // ITAD does not model stock: a store with nothing to sell simply has no row.
    inStock: true,
    updatedMinutesAgo,
    isHistoricalLow: offer.isHistoricalLow,
    purchaseUrl: offer.purchaseUrl,
    sourceCurrency: offer.sourceCurrency,
    approximate: offer.approximate,
    voucherCode: offer.voucherCode ?? undefined
  };
};

export const snapshotFromCatalog = (
  catalog: Catalog,
  gameSlug: string,
  editionKey: string,
  now: number
): OfferSnapshot => {
  const game = catalog.games[gameSlug];
  const edition = game?.editions[editionKey];
  const fetchedAtMs = Date.parse(catalog.fetchedAt);
  const offers = (edition?.offers ?? [])
    .map((offer) =>
      catalogOfferToDomain(offer, {
        gameSlug,
        editionKey,
        editionName: edition!.name,
        editionCategory: edition!.category,
        steamPriceSatang: edition!.steamPriceSatang,
        now,
        fetchedAtMs
      })
    )
    .sort(compareOffersByFinalPrice);

  return {
    gameSlug,
    editionKey,
    offers,
    fetchedAt: new Date(catalog.fetchedAt),
    failedStores: catalog.failedStores ?? [],
    stale: catalogIsStale(catalog, now) || Boolean(game?.stale)
  };
};
