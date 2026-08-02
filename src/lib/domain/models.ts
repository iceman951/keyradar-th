export type StoreType = 'steam' | 'official' | 'reseller' | 'marketplace';
export type RegionStatus = 'confirmed' | 'uncertain' | 'blocked';

export interface Edition {
  key: string;
  name: string;
  steamPriceSatang: number;
}

export interface Game {
  slug: string;
  title: string;
  year: number;
  developer: string;
  publisher: string;
  releaseDate: string;
  genres: string[];
  reviewPercent: number;
  reviewCount: number;
  popularity: number;
  hue: number;
  editions: Edition[];
}

export interface Store {
  id: string;
  name: string;
  initials: string;
  type: StoreType;
  payments: string[];
  feeRate: number;
  feeLabel: string;
  note: string;
}

export interface Offer {
  id: string;
  gameSlug: string;
  storeId: string;
  editionKey: string;
  advertisedSatang: number;
  feeSatang: number;
  finalSatang: number;
  steamPriceSatang: number;
  region: string;
  regionStatus: RegionStatus;
  drm: string;
  inStock: boolean;
  updatedMinutesAgo: number;
  sellerRating?: number;
}

export interface PricePoint {
  date: Date;
  priceSatang: number;
}

export interface GameFilters {
  thailandOnly: boolean;
  officialOnly: boolean;
  excludeMarketplace: boolean;
  inStockOnly: boolean;
  historicalLowOnly: boolean;
  maxPriceSatang: number;
  minDiscountPercent: number;
}
