/**
 * D1 content is untrusted input, not because a user can write to it directly
 * in Phase 1, but because nothing in SQLite enforces the shape of a JSON
 * column or the membership of a string column in an enum. Every mapper in
 * `mappers.ts` routes JSON and enum-like columns through here before they
 * reach an API DTO.
 */
import type {
  EditionCategory,
  OfferFee,
  OfferFeeKind,
  RegionCode,
  RegionStatus,
  StoreType
} from '../../shared/domain/models.ts'

export class D1DataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'D1DataError'
  }
}

const EDITION_CATEGORIES: ReadonlySet<string> = new Set<EditionCategory>([
  'standard',
  'deluxe',
  'complete',
  'dlc',
  'bundle'
])

const STORE_TYPES: ReadonlySet<string> = new Set<StoreType>([
  'steam',
  'official',
  'reseller',
  'marketplace'
])

const REGION_CODES: ReadonlySet<string> = new Set<RegionCode>([
  'global',
  'sea',
  'thailand',
  'eu',
  'row',
  'north-america'
])

const REGION_STATUSES: ReadonlySet<string> = new Set<RegionStatus>([
  'confirmed',
  'uncertain',
  'blocked'
])

const OFFER_FEE_KINDS: ReadonlySet<string> = new Set<OfferFeeKind>([
  'platform',
  'buyer-protection',
  'payment'
])

export const assertEditionCategory = (
  value: string,
  context: string
): EditionCategory => {
  if (!EDITION_CATEGORIES.has(value)) {
    throw new D1DataError(`${context}: unknown edition category "${value}"`)
  }
  return value as EditionCategory
}

export const assertStoreType = (value: string, context: string): StoreType => {
  if (!STORE_TYPES.has(value)) {
    throw new D1DataError(`${context}: unknown store type "${value}"`)
  }
  return value as StoreType
}

export const assertRegionCode = (
  value: string,
  context: string
): RegionCode => {
  if (!REGION_CODES.has(value)) {
    throw new D1DataError(`${context}: unknown region code "${value}"`)
  }
  return value as RegionCode
}

export const assertRegionStatus = (
  value: string,
  context: string
): RegionStatus => {
  if (!REGION_STATUSES.has(value)) {
    throw new D1DataError(`${context}: unknown region status "${value}"`)
  }
  return value as RegionStatus
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const parseStringArray = (json: string, context: string): string[] => {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new D1DataError(`${context}: invalid JSON`)
  }
  if (
    !Array.isArray(parsed) ||
    !parsed.every((item) => typeof item === 'string')
  ) {
    throw new D1DataError(`${context}: expected a JSON string array`)
  }
  return parsed
}

export const parseOfferFees = (json: string, context: string): OfferFee[] => {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new D1DataError(`${context}: invalid JSON`)
  }
  if (!Array.isArray(parsed)) {
    throw new D1DataError(`${context}: expected a JSON array of fees`)
  }
  return parsed.map((item, index): OfferFee => {
    if (!isRecord(item)) {
      throw new D1DataError(`${context}[${index}]: fee is not an object`)
    }
    const { kind, label, amountSatang } = item
    if (typeof kind !== 'string' || !OFFER_FEE_KINDS.has(kind)) {
      throw new D1DataError(
        `${context}[${index}]: unknown fee kind "${String(kind)}"`
      )
    }
    if (typeof label !== 'string') {
      throw new D1DataError(`${context}[${index}]: fee label must be a string`)
    }
    if (!Number.isInteger(amountSatang) || (amountSatang as number) < 0) {
      throw new D1DataError(
        `${context}[${index}]: amountSatang must be a non-negative integer`
      )
    }
    return {
      kind: kind as OfferFeeKind,
      label,
      amountSatang: amountSatang as number
    }
  })
}

/**
 * Fails loudly rather than silently repairing a bad row — an inconsistent
 * final price is a data-integrity bug, not something to paper over.
 */
export const assertConsistentFinalPrice = (
  advertisedSatang: number,
  fees: readonly OfferFee[],
  finalSatang: number,
  context: string
): void => {
  const total =
    advertisedSatang + fees.reduce((sum, fee) => sum + fee.amountSatang, 0)
  if (total !== finalSatang) {
    throw new D1DataError(
      `${context}: finalSatang (${finalSatang}) does not equal advertisedSatang + fees (${total})`
    )
  }
}
