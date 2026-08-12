import { describe, expect, it } from 'vitest'
import { stores } from '$lib/data/fixtures'
import type { RegionCode } from '$lib/domain/models'
import {
  REGION_PRESENTATIONS,
  regionPresentation,
  regionStatusLabel,
  storeTypeLabel
} from '$lib/domain/presentation'
import { sortStoresByTrust, STORE_TRUST_RANK } from '$lib/domain/stores'

describe('presentation and trust order', () => {
  it('orders Steam, official stores alphabetically, resellers, then marketplaces', () => {
    const sorted = sortStoresByTrust([...stores].reverse())
    expect(sorted[0].id).toBe('steam')
    expect(sorted.map((store) => STORE_TRUST_RANK[store.type])).toEqual(
      [...sorted]
        .map((store) => STORE_TRUST_RANK[store.type])
        .sort((a, b) => a - b)
    )
    const officialNames = sorted
      .filter((store) => store.type === 'official')
      .map((store) => store.name)
    expect(officialNames).toEqual(
      [...officialNames].sort((a, b) =>
        a.localeCompare(b, 'en', { sensitivity: 'base' })
      )
    )
  })

  it('centralizes all store-type and region-status Thai labels', () => {
    expect(storeTypeLabel('steam')).toBe('Steam โดยตรง')
    expect(storeTypeLabel('official')).toBe('ร้านค้าอย่างเป็นทางการ')
    expect(storeTypeLabel('reseller')).toBe('ตัวแทนจำหน่ายคีย์')
    expect(storeTypeLabel('marketplace')).toBe('Marketplace')
    expect(regionStatusLabel('confirmed')).toBe('ใช้งานในไทยได้')
    expect(regionStatusLabel('uncertain')).toBe('ตรวจสอบภูมิภาค')
    expect(regionStatusLabel('blocked')).toBe('ไม่รองรับไทย')
  })

  it('provides an exhaustive presentation for every region', () => {
    const codes: RegionCode[] = [
      'global',
      'sea',
      'thailand',
      'eu',
      'row',
      'north-america'
    ]
    expect(Object.keys(REGION_PRESENTATIONS)).toHaveLength(codes.length)
    expect(codes.map((code) => regionPresentation(code).code)).toEqual(codes)
    expect(regionPresentation('global').status).toBe('confirmed')
    expect(regionPresentation('eu').status).toBe('uncertain')
    expect(regionPresentation('row').status).toBe('uncertain')
    expect(regionPresentation('north-america').status).toBe('blocked')
  })
})
