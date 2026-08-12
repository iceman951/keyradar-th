import type { Game, Offer } from './models'
import { discountPercent } from './pricing'

export type ResultSortKey =
  'final' | 'discount' | 'popular' | 'release' | 'updated'

export interface GameOfferResult {
  game: Game
  offer: Offer
}

export const sortGameOfferResults = <T extends GameOfferResult>(
  entries: readonly T[],
  sort: ResultSortKey
): T[] =>
  [...entries].sort((a, b) => {
    switch (sort) {
      case 'final':
        return a.offer.finalSatang - b.offer.finalSatang
      case 'discount':
        return discountPercent(b.offer) - discountPercent(a.offer)
      case 'popular':
        return b.game.popularity - a.game.popularity
      case 'release':
        return b.game.year - a.game.year
      case 'updated':
        return a.offer.updatedMinutesAgo - b.offer.updatedMinutesAgo
      default: {
        const exhaustive: never = sort
        return exhaustive
      }
    }
  })
