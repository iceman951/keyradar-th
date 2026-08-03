import { describe, expect, it } from 'vitest';
import { games } from '$lib/data/fixtures';
import { sortGameOfferResults, type ResultSortKey } from '$lib/domain/results';
import { makeOffer } from './helpers';

describe('result sorting', () => {
  const entries = [
    {
      game: { ...games[0], popularity: 50, year: 2020 },
      offer: makeOffer({
        id: 'a',
        finalSatang: 80_000,
        steamPriceSatang: 100_000,
        updatedMinutesAgo: 20
      })
    },
    {
      game: { ...games[1], popularity: 90, year: 2024 },
      offer: makeOffer({
        id: 'b',
        finalSatang: 70_000,
        steamPriceSatang: 140_000,
        updatedMinutesAgo: 5
      })
    }
  ];

  it.each<[ResultSortKey, string]>([
    ['final', 'b'],
    ['discount', 'b'],
    ['popular', 'b'],
    ['release', 'b'],
    ['updated', 'b']
  ])('sorts by %s', (sort, firstId) => {
    expect(sortGameOfferResults(entries, sort)[0].offer.id).toBe(firstId);
  });

  it('does not mutate the candidate list', () => {
    expect(sortGameOfferResults(entries, 'final')).not.toBe(entries);
    expect(entries.map((entry) => entry.offer.id)).toEqual(['a', 'b']);
  });
});
