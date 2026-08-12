import type { GameFilters, Offer, Store } from './models'
import {
  compareOffersByFinalPrice,
  discountPercent,
  hasAdditionalFees
} from './pricing'

export const DEFAULT_GAME_FILTERS: Readonly<GameFilters> = {
  thailandOnly: true,
  steamOnly: false,
  officialOnly: false,
  excludeMarketplace: false,
  inStockOnly: true,
  historicalLowOnly: false,
  noAdditionalFeeOnly: false,
  maxPriceSatang: 240_000,
  minDiscountPercent: 0,
  editionCategory: 'all'
}

const activatesOnSteam = (drm: string): boolean =>
  drm.toLocaleLowerCase('en').includes('steam')

export const offerMatchesFilters = (
  offer: Offer,
  store: Store | undefined,
  filters: GameFilters
): boolean => {
  if (filters.thailandOnly && offer.regionStatus !== 'confirmed') return false
  if (filters.steamOnly && !activatesOnSteam(offer.drm)) return false
  if (
    filters.officialOnly &&
    store?.type !== 'official' &&
    store?.type !== 'steam'
  )
    return false
  if (filters.excludeMarketplace && store?.type === 'marketplace') return false
  if (filters.inStockOnly && !offer.inStock) return false
  if (filters.historicalLowOnly && !offer.isHistoricalLow) return false
  if (filters.noAdditionalFeeOnly && hasAdditionalFees(offer)) return false
  if (offer.finalSatang > filters.maxPriceSatang) return false
  if (discountPercent(offer) < filters.minDiscountPercent) return false
  if (
    filters.editionCategory !== 'all' &&
    offer.editionCategory !== filters.editionCategory
  ) {
    return false
  }
  return true
}

export const filterOffers = (
  offers: readonly Offer[],
  stores: readonly Store[],
  filters: GameFilters
): Offer[] => {
  const storesById = new Map(stores.map((store) => [store.id, store]))
  return offers
    .filter((offer) =>
      offerMatchesFilters(offer, storesById.get(offer.storeId), filters)
    )
    .sort(compareOffersByFinalPrice)
}

export const selectDisplayedOffer = (
  offers: readonly Offer[],
  stores: readonly Store[],
  filters: GameFilters
): Offer | undefined => filterOffers(offers, stores, filters)[0]
