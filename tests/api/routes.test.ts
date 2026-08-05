import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../worker/app';
import { createFakeCatalog, createFakePricing } from './fakes';
import type {
  EditionAvailabilityDto,
  GameDto,
  HealthDto,
  OfferSnapshotDto,
  PricePointDto,
  StoreDto
} from '../../shared/contracts/api-dto';

const get = (app: ReturnType<typeof createApp>, path: string) =>
  app.handle(new Request(`http://localhost/api/v1${path}`));

/** `Response.json()` resolves to `unknown`; each assertion knows its shape. */
const body = async <T>(res: Response): Promise<T> => (await res.json()) as T;

interface ErrorBody {
  error: { code: string; message: string };
}

describe('Elysia API routes (in-memory catalog/pricing, no D1)', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp({ catalog: createFakeCatalog(), pricing: createFakePricing() });
  });

  it('GET /health -> 200, no-store, correct shape', async () => {
    const res = await get(app, '/health');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await body<HealthDto>(res)).toEqual({
      status: 'ok',
      service: 'keyradar-api',
      version: '0.1.0'
    });
  });

  it('GET /games -> 200, array of GameDto', async () => {
    const res = await get(app, '/games');
    expect(res.status).toBe(200);
    const games = await body<GameDto[]>(res);
    expect(Array.isArray(games)).toBe(true);
    expect(games.length).toBeGreaterThan(0);
    expect(games[0]).toHaveProperty('slug');
    expect(games[0]).toHaveProperty('editions');
  });

  it('GET /search?q=valheim -> 200', async () => {
    const res = await get(app, '/search?q=valheim');
    expect(res.status).toBe(200);
    const games = await body<GameDto[]>(res);
    expect(games.some((game) => game.slug === 'valheim')).toBe(true);
  });

  it('GET /search?q= -> 400 VALIDATION_ERROR', async () => {
    const res = await get(app, '/search?q=');
    expect(res.status).toBe(400);
    expect((await body<ErrorBody>(res)).error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /games/valheim -> 200', async () => {
    const res = await get(app, '/games/valheim');
    expect(res.status).toBe(200);
    expect((await body<GameDto>(res)).slug).toBe('valheim');
  });

  it('GET /games/unknown -> 404 JSON GAME_NOT_FOUND, never cached', async () => {
    const res = await get(app, '/games/unknown');
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect((await body<ErrorBody>(res)).error.code).toBe('GAME_NOT_FOUND');
  });

  it('GET /games/valheim/offers -> 200 OfferSnapshotDto, offers sorted by final price', async () => {
    const res = await get(app, '/games/valheim/offers');
    expect(res.status).toBe(200);
    const snapshot = await body<OfferSnapshotDto>(res);
    expect(snapshot.gameSlug).toBe('valheim');
    expect(snapshot.offers.length).toBeGreaterThan(0);
    const prices = snapshot.offers.map((offer) => offer.finalSatang);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('GET /games/valheim/offers?editionKey=unknown -> 404 EDITION_NOT_FOUND', async () => {
    const res = await get(app, '/games/valheim/offers?editionKey=unknown');
    expect(res.status).toBe(404);
    expect((await body<ErrorBody>(res)).error.code).toBe('EDITION_NOT_FOUND');
  });

  it('GET /games/valheim/editions -> 200 array', async () => {
    const res = await get(app, '/games/valheim/editions');
    expect(res.status).toBe(200);
    const editions = await body<EditionAvailabilityDto[]>(res);
    expect(Array.isArray(editions)).toBe(true);
    expect(editions[0]).toHaveProperty('availableInThailand');
  });

  it('GET /games/valheim/price-history?days=30 -> 200 ascending', async () => {
    const res = await get(app, '/games/valheim/price-history?days=30');
    expect(res.status).toBe(200);
    const points = await body<PricePointDto[]>(res);
    const dates = points.map((point) => new Date(point.date).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => a - b));
  });

  it('GET /games/valheim/price-history?days=999 -> 400 VALIDATION_ERROR', async () => {
    const res = await get(app, '/games/valheim/price-history?days=999');
    expect(res.status).toBe(400);
    expect((await body<ErrorBody>(res)).error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/v1/unknown -> 404 JSON (not the SPA shell)', async () => {
    const res = await get(app, '/unknown');
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await body<ErrorBody>(res)).toHaveProperty('error');
  });

  it('GET /stores -> 200, Steam first (trust order)', async () => {
    const res = await get(app, '/stores');
    expect(res.status).toBe(200);
    expect((await body<StoreDto[]>(res))[0].id).toBe('steam');
  });

  it('every successful response carries a Cache-Control header', async () => {
    const paths = [
      '/health',
      '/games',
      '/search?q=valheim',
      '/games/valheim',
      '/stores',
      '/games/valheim/offers',
      '/games/valheim/editions',
      '/games/valheim/price-history?days=30'
    ];
    for (const path of paths) {
      const res = await get(app, path);
      expect(res.headers.get('cache-control'), `missing Cache-Control for ${path}`).toBeTruthy();
    }
  });
});
