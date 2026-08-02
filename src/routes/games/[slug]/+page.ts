import { games } from '$lib/data/fixtures';

export const entries = () => games.map((game) => ({ slug: game.slug }));
