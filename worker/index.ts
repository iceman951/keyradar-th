// I have nothing but my burger and I want nothing more
import { CATALOG_KEY } from './keys';
import { refreshCatalog } from './refresh';

interface Env {
  KV: KVNamespace;
  ASSETS: Fetcher;
  ITAD_API_KEY?: string;
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers }
  });

/**
 * Synthetic key on a hostname we never serve. `caches.default` is the shared
 * edge cache, so keying on the real request can read back a response the asset
 * pipeline stored — e.g. the SPA's 307 to /200 during deploy propagation, which
 * this Worker would then hand out as if it were the catalog.
 */
const catalogCacheKey = new Request('https://catalog.internal/v1');

const serveCatalog = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
  const cache = caches.default;
  const cached = await cache.match(catalogCacheKey);
  if (cached?.ok && cached.headers.get('content-type')?.includes('application/json')) return cached;

  // Pass the stored text straight through — parsing and re-stringifying here is the
  // most expensive thing this handler could do, and it would buy nothing.
  const text = await env.KV.get(CATALOG_KEY, 'text');
  if (!text) return json({ error: 'catalog_unavailable' }, 503, { 'cache-control': 'no-store' });

  const response = new Response(text, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=1800'
    }
  });
  ctx.waitUntil(cache.put(catalogCacheKey, response.clone()));
  return response;
};

const serveHealth = async (env: Env): Promise<Response> => {
  const text = await env.KV.get(CATALOG_KEY, 'text');
  let fetchedAt: string | null = null;
  let gameCount = 0;
  if (text) {
    try {
      const catalog = JSON.parse(text) as { fetchedAt?: string; games?: Record<string, unknown> };
      fetchedAt = catalog.fetchedAt ?? null;
      gameCount = Object.keys(catalog.games ?? {}).length;
    } catch {
      fetchedAt = null;
    }
  }
  return json(
    {
      hasKey: Boolean(env.ITAD_API_KEY),
      hasCatalog: Boolean(text),
      fetchedAt,
      gameCount,
      ageMinutes: fetchedAt ? Math.round((Date.now() - Date.parse(fetchedAt)) / 60_000) : null
    },
    200,
    { 'cache-control': 'no-store' }
  );
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/catalog') return serveCatalog(request, env, ctx);
    if (url.pathname === '/api/health') return serveHealth(env);
    if (url.pathname.startsWith('/api/')) {
      return json({ error: 'not_found' }, 404, { 'cache-control': 'no-store' });
    }
    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      refreshCatalog(env, event.scheduledTime).then(async (result) => {
        // Otherwise a fresh catalog stays hidden behind the edge copy.
        if (result.ok) await caches.default.delete(catalogCacheKey);
      })
    );
  }
} satisfies ExportedHandler<Env>;
