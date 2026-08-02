import { describe, expect, it } from 'vitest';
import { MockGameRepository } from '$lib/data/mock-repository';

describe('mock repository', () => {
  const repository = new MockGameRepository();
  it('keeps cross-screen game and offer data consistent', async () => {
    const game = await repository.getGame('elden-ring');
    const offers = await repository.getOffers('elden-ring');
    expect(game?.title).toBe('ELDEN RING');
    expect(offers).toHaveLength(10);
    expect(offers.every((offer) => Number.isInteger(offer.finalSatang))).toBe(true);
    expect(offers.map((offer) => offer.finalSatang)).toEqual([...offers].sort((a, b) => a.finalSatang - b.finalSatang).map((offer) => offer.finalSatang));
  });
  it('searches case-insensitively and returns popular games for an empty query', async () => {
    expect((await repository.searchGames('forest')).map((game) => game.slug)).toContain('the-forest');
    expect((await repository.searchGames(''))[0].slug).toBe('elden-ring');
  });
});
