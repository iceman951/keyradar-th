import type { Game, Offer, PricePoint, Store } from '$lib/domain/models';

export interface GameRepository {
  listGames(): Promise<Game[]>;
  getGame(slug: string): Promise<Game | undefined>;
  searchGames(query: string): Promise<Game[]>;
  listStores(): Promise<Store[]>;
  getOffers(gameSlug: string, editionKey?: string): Promise<Offer[]>;
  getPriceHistory(gameSlug: string, days: number): Promise<PricePoint[]>;
}
