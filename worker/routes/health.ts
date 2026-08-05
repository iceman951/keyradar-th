import { Elysia, t } from 'elysia';
import { applyCacheProfile } from '../middleware/cache-headers';

const API_VERSION = '0.1.0';

const healthDtoSchema = t.Object({
  status: t.String(),
  service: t.String(),
  version: t.String()
});

// A plain, schema-validated route. Deliberately does not touch D1 — the spec
// asks that liveness checks stay cheap, not run a database query.
export const healthRoutes = new Elysia().get(
  '/health',
  { response: { 200: healthDtoSchema } },
  ({ set }) => {
    applyCacheProfile(set, 'no-store');
    return { status: 'ok', service: 'keyradar-api', version: API_VERSION };
  }
);
