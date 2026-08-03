import type {
  RegionCode,
  RegionPresentation,
  RegionStatus,
  StoreType
} from './models';

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

export const REGION_PRESENTATIONS: Readonly<Record<RegionCode, RegionPresentation>> = {
  global: {
    code: 'global',
    label: 'Global',
    status: 'confirmed',
    statusLabel: REGION_STATUS_LABELS.confirmed,
    description: 'คีย์ Global ไม่จำกัดภูมิภาค เปิดใช้งานจากประเทศไทยได้',
    tone: 'success'
  },
  sea: {
    code: 'sea',
    label: 'SEA',
    status: 'confirmed',
    statusLabel: REGION_STATUS_LABELS.confirmed,
    description: 'คีย์สำหรับเอเชียตะวันออกเฉียงใต้ ครอบคลุมประเทศไทย',
    tone: 'success'
  },
  thailand: {
    code: 'thailand',
    label: 'ไทย',
    status: 'confirmed',
    statusLabel: REGION_STATUS_LABELS.confirmed,
    description: 'ราคาและคีย์สำหรับร้านค้าประเทศไทยโดยตรง',
    tone: 'success'
  },
  eu: {
    code: 'eu',
    label: 'ยุโรป (EU)',
    status: 'uncertain',
    statusLabel: REGION_STATUS_LABELS.uncertain,
    description: 'คีย์ล็อกภูมิภาคยุโรป อาจเปิดใช้งานจากไทยไม่ได้ ควรสอบถามร้านค้าก่อนซื้อ',
    tone: 'warning'
  },
  row: {
    code: 'row',
    label: 'ROW (ยกเว้นบางประเทศ)',
    status: 'uncertain',
    statusLabel: REGION_STATUS_LABELS.uncertain,
    description: 'ผู้ขายไม่ได้ระบุรายชื่อประเทศที่รองรับอย่างชัดเจน',
    tone: 'warning'
  },
  'north-america': {
    code: 'north-america',
    label: 'อเมริกาเหนือ',
    status: 'blocked',
    statusLabel: REGION_STATUS_LABELS.blocked,
    description: 'คีย์ล็อกเฉพาะอเมริกาเหนือ ไม่สามารถเปิดใช้งานจากประเทศไทยได้',
    tone: 'error'
  }
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
