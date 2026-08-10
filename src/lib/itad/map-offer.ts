import type { CatalogOffer, ItadDeal, ThbRates } from './types';
import { toSatang } from './fx';
import { regionForStore } from './store-regions';

/**
 * Thai card issuers charge a foreign-transaction fee on non-THB purchases, so a
 * converted price is not what the buyer actually pays. Surfacing it as a fee is
 * more honest than pretending the converted number is final.
 */
export const FX_FEE_RATE = 0.025;
export const FX_FEE_LABEL = 'ค่าธรรมเนียมแปลงสกุลเงินโดยประมาณ (2.5%)';

/** Absorbs FX drift so a genuine all-time low is not missed by a rounding cent. */
export const HISTORICAL_LOW_TOLERANCE = 1.005;

/**
 * `filters.ts` decides "activates on Steam" by substring, so every Steam-ish
 * label must contain "steam" and every non-Steam one must not.
 */
export const drmLabel = (deal: ItadDeal, storeId: string): string => {
  if (storeId === 'steam') return 'Steam';
  const names = (deal.drm ?? []).map((entry) => entry.name.toLocaleLowerCase('en'));
  if (names.some((name) => name.includes('gog') || name.includes('drm free'))) return 'GOG.com';
  if (names.some((name) => name.includes('ea ') || name.includes('origin'))) return 'EA app';
  if (names.some((name) => name.includes('epic'))) return 'Epic Games';
  if (names.some((name) => name.includes('ubisoft') || name.includes('uplay'))) {
    return 'Ubisoft Connect';
  }
  return 'Steam Key';
};

export interface MapDealInput {
  deal: ItadDeal;
  storeId: string;
  rates: ThbRates;
  /** All-time low for the game in satang, or null when ITAD did not report one. */
  historyLowSatang: number | null;
  /** Used when the deal carries no timestamp of its own. */
  fetchedAt: string;
}

/**
 * Returns null when the deal cannot be priced in THB — dropping the row beats
 * publishing a number we cannot stand behind.
 */
export const mapDealToCatalogOffer = ({
  deal,
  storeId,
  rates,
  historyLowSatang,
  fetchedAt
}: MapDealInput): CatalogOffer | null => {
  const currency = deal.price?.currency;
  if (!currency || !deal.url) return null;

  const advertisedSatang = toSatang(deal.price.amountInt, currency, rates);
  if (advertisedSatang === null || advertisedSatang <= 0) return null;

  const approximate = currency !== 'THB';
  const feesSatang = approximate ? Math.round(advertisedSatang * FX_FEE_RATE) : 0;

  return {
    storeId,
    advertisedSatang,
    feesSatang,
    finalSatang: advertisedSatang + feesSatang,
    region: regionForStore(storeId),
    drm: drmLabel(deal, storeId),
    updatedAt: deal.timestamp ?? fetchedAt,
    isHistoricalLow:
      historyLowSatang !== null && advertisedSatang <= historyLowSatang * HISTORICAL_LOW_TOLERANCE,
    sourceCurrency: currency,
    approximate,
    voucherCode: deal.voucher ?? null,
    // Verbatim: the affiliate tag lives in this URL and ITAD's terms require it intact.
    purchaseUrl: deal.url
  };
};
