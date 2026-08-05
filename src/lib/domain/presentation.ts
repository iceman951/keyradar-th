import type {
  RegionCode,
  RegionPresentation,
  RegionStatus,
  RegionTone,
  StoreType
} from './models';
import { regionStatusFor } from '../../../shared/seed/catalog.ts';

export const STORE_TYPE_LABELS: Readonly<Record<StoreType, string>> = {
  steam: 'Steam โดยตรง',
  official: 'ร้านค้าอย่างเป็นทางการ',
  reseller: 'ตัวแทนจำหน่ายคีย์',
  marketplace: 'Marketplace'
};

export const REGION_STATUS_LABELS: Readonly<Record<RegionStatus, string>> = {
  confirmed: 'ใช้งานในไทยได้',
  uncertain: 'ตรวจสอบภูมิภาค',
  blocked: 'ไม่รองรับไทย'
};

const REGION_TONES: Readonly<Record<RegionStatus, RegionTone>> = {
  confirmed: 'success',
  uncertain: 'warning',
  blocked: 'error'
};

/**
 * Builds a region presentation from its Thai copy. Status, status label, and
 * tone are always derived from `regionStatusFor` in the shared catalog — the
 * one place that decides whether a region can be activated from Thailand — so
 * the API and the UI can never disagree about whether an offer is confirmed.
 */
const present = (
  code: RegionCode,
  label: string,
  description: string
): RegionPresentation => {
  const status = regionStatusFor(code);
  return {
    code,
    label,
    status,
    statusLabel: REGION_STATUS_LABELS[status],
    description,
    tone: REGION_TONES[status]
  };
};

export const REGION_PRESENTATIONS: Readonly<Record<RegionCode, RegionPresentation>> = {
  global: present(
    'global',
    'Global',
    'คีย์ Global ไม่จำกัดภูมิภาค เปิดใช้งานจากประเทศไทยได้'
  ),
  sea: present('sea', 'SEA', 'คีย์สำหรับเอเชียตะวันออกเฉียงใต้ ครอบคลุมประเทศไทย'),
  thailand: present('thailand', 'ไทย', 'ราคาและคีย์สำหรับร้านค้าประเทศไทยโดยตรง'),
  eu: present(
    'eu',
    'ยุโรป (EU)',
    'คีย์ล็อกภูมิภาคยุโรป อาจเปิดใช้งานจากไทยไม่ได้ ควรสอบถามร้านค้าก่อนซื้อ'
  ),
  row: present(
    'row',
    'ROW (ยกเว้นบางประเทศ)',
    'ผู้ขายไม่ได้ระบุรายชื่อประเทศที่รองรับอย่างชัดเจน'
  ),
  'north-america': present(
    'north-america',
    'อเมริกาเหนือ',
    'คีย์ล็อกเฉพาะอเมริกาเหนือ ไม่สามารถเปิดใช้งานจากประเทศไทยได้'
  )
};

export const storeTypeLabel = (type: StoreType): string => STORE_TYPE_LABELS[type];

export const regionStatusLabel = (status: RegionStatus): string =>
  REGION_STATUS_LABELS[status];

export const regionPresentation = (region: RegionCode): RegionPresentation => {
  switch (region) {
    case 'global':
      return REGION_PRESENTATIONS.global;
    case 'sea':
      return REGION_PRESENTATIONS.sea;
    case 'thailand':
      return REGION_PRESENTATIONS.thailand;
    case 'eu':
      return REGION_PRESENTATIONS.eu;
    case 'row':
      return REGION_PRESENTATIONS.row;
    case 'north-america':
      return REGION_PRESENTATIONS['north-america'];
    default: {
      const exhaustive: never = region;
      return exhaustive;
    }
  }
};
