import type {
  EditionAvailability,
  Game,
  OfferSnapshot,
  PricePoint,
  Store
} from '$lib/domain/models'

export interface GameRepository {
  listGames(): Promise<Game[]>
  getGame(slug: string): Promise<Game | undefined>
  searchGames(query: string): Promise<Game[]>
  listStores(): Promise<Store[]>
  getOffers(gameSlug: string, editionKey?: string): Promise<OfferSnapshot>
  getEditionAvailability(gameSlug: string): Promise<EditionAvailability[]>
  getPriceHistory(gameSlug: string, days: number): Promise<PricePoint[]>
}
