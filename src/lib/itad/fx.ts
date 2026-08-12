import type { FrankfurterResponse, ThbRates } from './types'

/**
 * Convert a base-quoted FX response into "THB per one unit of X".
 *
 * Frankfurter quotes everything against `base`, so for a USD base the THB rate
 * is direct but every other currency needs a cross rate: THB/EUR, not the
 * EUR-per-USD figure the response hands you. Inverting this is the classic bug.
 */
export const crossRates = (response: FrankfurterResponse): ThbRates => {
  const thbPerBase = response.rates?.THB
  if (!Number.isFinite(thbPerBase) || thbPerBase <= 0) {
    throw new Error('FX response is missing a usable THB rate')
  }

  const rates: ThbRates = { THB: 1, [response.base]: thbPerBase }
  for (const [code, perBase] of Object.entries(response.rates)) {
    if (code === 'THB') continue
    if (!Number.isFinite(perBase) || perBase <= 0) continue
    rates[code] = thbPerBase / perBase
  }
  return rates
}

/**
 * Minor units in `currency` → satang. Returns null for a currency we cannot
 * convert, so the caller drops the offer rather than publishing a wrong price.
 */
export const toSatang = (
  amountInt: number,
  currency: string,
  rates: ThbRates
): number | null => {
  if (!Number.isFinite(amountInt)) return null
  const rate = rates[currency]
  if (!Number.isFinite(rate) || rate <= 0) return null
  return Math.round(amountInt * rate)
}
