/**
 * Steam pricing comes from Steam, not from IsThereAnyDeal.
 *
 * ITAD does not localise prices for Thailand — `country=TH` returns the same USD
 * figures as `country=US` (verified against the live API). Converting that USD
 * price would overstate the Thai Steam price by roughly 10-25%, and since every
 * discount percentage on the site is measured against it, the error would
 * propagate everywhere. Steam's own storefront API returns real THB.
 */
export const STEAM_APPDETAILS_URL = 'https://store.steampowered.com/api/appdetails';

export interface SteamPrice {
  /** Regular price — the reference discounts are measured against. */
  initialSatang: number;
  /** What the buyer pays today. */
  finalSatang: number;
  discountPercent: number;
}

interface SteamPriceOverview {
  currency?: string;
  initial?: number;
  final?: number;
  discount_percent?: number;
}

/** Batch endpoint: one request covers every app id. */
export const steamPricesUrl = (appIds: readonly number[]): string =>
  `${STEAM_APPDETAILS_URL}?appids=${appIds.join(',')}&cc=th&filters=price_overview`;

/**
 * Steam reports minor units in the requested currency, so THB maps straight to
 * satang. Anything that is not THB is discarded rather than guessed at.
 */
export const parseSteamPrices = (raw: unknown): Record<number, SteamPrice> => {
  const out: Record<number, SteamPrice> = {};
  if (typeof raw !== 'object' || raw === null) return out;

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const appId = Number(key);
    if (!Number.isInteger(appId)) continue;

    const entry = value as { success?: boolean; data?: { price_overview?: SteamPriceOverview } };
    if (!entry?.success) continue;

    const price = entry.data?.price_overview;
    if (!price || price.currency !== 'THB') continue;

    const finalSatang = price.final;
    const initialSatang = price.initial ?? price.final;
    if (!Number.isFinite(finalSatang) || !Number.isFinite(initialSatang)) continue;
    if (finalSatang === undefined || initialSatang === undefined) continue;

    out[appId] = {
      initialSatang,
      finalSatang,
      discountPercent: price.discount_percent ?? 0
    };
  }
  return out;
};
