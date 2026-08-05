import { Elysia, t } from 'elysia';
import { storeDtoSchema } from '../schemas/store.schema';
import { applyCacheProfile } from '../middleware/cache-headers';
import type { RouteCatalogService } from '../app';

export const storeRoutes = (catalog: RouteCatalogService) =>
  new Elysia().get(
    '/stores',
    { response: { 200: t.Array(storeDtoSchema) } },
    async ({ set }) => {
      applyCacheProfile(set, 'stores');
      return catalog.listStores();
    }
  );
