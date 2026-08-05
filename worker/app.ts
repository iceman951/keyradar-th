import { Elysia } from 'elysia';
import { CloudflareWorkerAdapter } from './adapter/cloudflare';
import { errorHandler } from './middleware/error-handler';
import { healthRoutes } from './routes/health';
import { gameRoutes } from './routes/games';
import { storeRoutes } from './routes/stores';
import { offerRoutes } from './routes/offers';
import { priceHistoryRoutes } from './routes/price-history';
import type { CatalogService } from './modules/catalog/catalog.service';
import type { PricingService } from './modules/pricing/pricing.service';

/**
 * `CatalogService` minus `getGameRowOrThrow`: that method exists solely so
 * the real `createPricingService(db, catalog)` can resolve/validate a game +
 * edition against D1 without a second query — routes never call it (see
 * `worker/routes/games.ts`, `worker/routes/stores.ts`). Narrowing it out of
 * `AppDeps` means route tests can hand-write a fake catalog implementing
 * just the four methods routes use, instead of also faking Drizzle's
 * `GameRow`/`EditionRow` shapes.
 */
export type RouteCatalogService = Omit<CatalogService, 'getGameRowOrThrow'>;

export interface AppDeps {
  catalog: RouteCatalogService;
  pricing: PricingService;
}

/**
 * Builds the Elysia application from injected services rather than a raw D1
 * `Database` — free of `cloudflare:workers` globals, and route tests can pass
 * hand-written fake `CatalogService`/`PricingService` objects (see
 * `tests/api/`) instead of standing up D1/drizzle. `worker/index.ts` is the
 * one place real D1-backed services are built and wired in.
 */
export const createApp = (deps: AppDeps) => {
  const { catalog, pricing } = deps;

  return new Elysia({
    adapter: CloudflareWorkerAdapter,
    prefix: '/api/v1'
  })
    .error(errorHandler)
    .use(healthRoutes)
    .use(gameRoutes(catalog))
    .use(storeRoutes(catalog))
    .use(offerRoutes(pricing))
    .use(priceHistoryRoutes(pricing));
};

export type KeyRadarApi = ReturnType<typeof createApp>;
