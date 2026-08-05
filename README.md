# KeyRadar TH

Compare the lowest **estimated final price** for Steam games from a Thai
buyer's perspective — advertised price plus every known fee — and show
plainly whether a key can actually be activated in Thailand.

Thai-language, responsive, accessible, dark-themed SPA.

## Architecture

One repository, one Cloudflare Worker deployment, one D1 database, one origin.

```
Browser
├─ /*         → Cloudflare Static Assets → SvelteKit SPA (ssr = false, prerendered)
└─ /api/v1/*  → Cloudflare Worker → Elysia 2 beta → Drizzle ORM → Cloudflare D1
```

`run_worker_first = ["/api/*"]` means the Worker handles API paths and
everything else is served static-assets-first, falling back to the SPA shell.
Because the API is same-origin, there is **no CORS configuration anywhere**.

The SvelteKit app stays a client-rendered static SPA: `ssr = false`,
prerendered, built with `@sveltejs/adapter-static`. The Worker is a separate
runtime layer in the same deployment — it does **not** introduce SvelteKit SSR.

```
shared/          framework-neutral code used by the SPA, the Worker, and scripts
  contracts/     API DTOs (the wire contract)
  domain/        models, pricing rules, store trust order
  seed/          the deterministic catalog (source of truth for mock + D1 seed)
src/             SvelteKit application
  lib/data/      repository.ts (production import point) → api- | mock-repository
worker/          Cloudflare Worker
  adapter/       local Cloudflare adapter for Elysia 2 (see ADR 001)
  routes/        Elysia routes + `t` schemas
  modules/       framework-independent repositories and services
  db/            Drizzle schema, mappers, validation
drizzle/         generated SQL migrations
docs/adr/        architecture decision records
```

**Data flow.** Production UI code imports `gameRepository` from
`$lib/data/repository` — never a concrete implementation. That selector reads
`PUBLIC_DATA_SOURCE` and returns either `ApiGameRepository` (real API) or
`MockGameRepository` (deterministic fixtures). Both satisfy the same
`GameRepository` interface, so no component knows which is in use.

## Prerequisites

- Node.js 22+ (Node 24 recommended — the seed generator is a `.ts` file run
  directly via native type stripping)
- pnpm 10+
- A Cloudflare account (only for remote migrate/seed/deploy)
- `wrangler` needs `workerd`, which requires **glibc ≥ 2.35**. On older hosts
  (e.g. RHEL 8), run wrangler commands inside a container:
  ```bash
  docker run --rm -it -v "$PWD":/app -w /app -p 8787:8787 node:22-bookworm bash
  ```

## Install

```bash
pnpm install
pnpm wrangler types      # generates worker-configuration.d.ts (gitignored)
```

## Cloudflare resources (owner action required)

The D1 database has **not** been created yet. `wrangler.toml` ships a
placeholder `database_id`.

```bash
pnpm wrangler login
pnpm wrangler d1 create keyradar-th-prod --location=apac
```

Paste the returned `database_id` into `wrangler.toml`, replacing
`REPLACE_WITH_REAL_DATABASE_ID`. The `database_id` is configuration, not a
secret, and may be committed. API tokens must never be.

## Local database

```bash
pnpm db:generate         # regenerate migrations after editing worker/db/schema.ts
pnpm db:migrate:local
pnpm db:seed:local
```

The seed is deterministic and **idempotent** — running it repeatedly never
duplicates rows. It regenerates `scripts/.generated/seed.sql` from
`shared/seed/catalog.ts` (the same catalog `MockGameRepository` uses, so the
two can never drift) and validates every invariant — unique ids, HTTPS-only
URLs, integer satang, `finalSatang === advertisedSatang + Σ fees`, known enum
values, resolvable foreign keys — **before** writing any SQL. Validation
failure exits non-zero and writes nothing.

## Development

```bash
pnpm dev        # Vite on :5173 + wrangler dev on :8787, /api proxied
pnpm dev:web    # Vite only
pnpm dev:api    # Worker only
```

The Vite dev proxy forwards `/api` to the Worker so frontend code stays
same-origin in development exactly as it is in production.

## Tests

```bash
pnpm check          # svelte-check (app)
pnpm check:worker   # tsc (worker/, shared/, scripts/)
pnpm test           # unit + component (jsdom, mock data)
pnpm test:api       # Elysia route tests — real app, stub services, no D1
pnpm test:d1        # local D1: migrate, seed, joins, chronology, idempotency
pnpm test:e2e       # Playwright, mock mode, vite preview
pnpm test:e2e:api   # Playwright, API mode, wrangler dev + seeded local D1
```

`pnpm check` does not cover `worker/` (svelte-check only sees `src/` and
`tests/`), which is why `check:worker` exists — run both.

## Build

```bash
pnpm build                          # defaults to PUBLIC_DATA_SOURCE=api
PUBLIC_DATA_SOURCE=mock pnpm build  # fixture-backed build
```

Production-shaped local check — serves the SPA and the API together, the way
Cloudflare will:

```bash
pnpm build && pnpm preview          # wrangler dev
curl -i http://localhost:8787/api/v1/health   # 200 JSON, Cache-Control: no-store
curl -i http://localhost:8787/api/v1/nope     # 404 JSON, not the SPA shell
curl -i http://localhost:8787/games/valheim   # SPA shell
```

## Deployment

```bash
pnpm db:migrate:remote
pnpm db:seed:remote     # Phase 1 only; a deliberate command, never automatic
pnpm deploy
```

Remote seeding is intentionally manual. Once Phase 2 ingestion is live, do
**not** reseed production on deploy — it would overwrite real observed prices.

GitHub Actions deployment (not yet enabled) would need repository secrets
`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`, using a scoped token —
never the Global API Key, and never committed to `wrangler.toml` or
`.env.example`.

## Environment variables

| Variable | Values | Default | Purpose |
| --- | --- | --- | --- |
| `PUBLIC_DATA_SOURCE` | `api` \| `mock` | `api` | Selects the repository implementation. Anything other than `mock` resolves to `api`. |

See `.env.example`. Only `PUBLIC_`-prefixed variables reach the browser; there
are no server-side secrets in Phase 1.

## API

Base path `/api/v1`. All endpoints are GET. Money is **integer satang**
throughout; timestamps cross JSON as ISO 8601 strings.

| Endpoint | Notes |
| --- | --- |
| `GET /health` | `no-store`; does not query D1 |
| `GET /games` | `?limit=1..100&sort=popular\|release\|title` |
| `GET /search` | `?q=` (1–100 chars, required) `&limit=` |
| `GET /games/:slug` | 404 `GAME_NOT_FOUND` |
| `GET /stores` | Steam → official → reseller → marketplace |
| `GET /games/:slug/offers` | `?editionKey=`; defaults to the first edition |
| `GET /games/:slug/editions` | edition availability |
| `GET /games/:slug/price-history` | `?days=2..365`, default 30, ascending |

Errors use one envelope, and are never cached:

```json
{ "error": { "code": "GAME_NOT_FOUND", "message": "...", "details": { } } }
```

Codes: `VALIDATION_ERROR` (400), `GAME_NOT_FOUND` / `EDITION_NOT_FOUND` /
`NOT_FOUND` (404), `DATABASE_ERROR` / `INTERNAL_ERROR` (500). Internal error
text, SQL, and stack traces are never sent to the client.

## Phase 1 limitations

- No live store scraping — prices are the deterministic mock catalog seeded
  into D1. **They are not real observed prices.**
- No scheduled ingestion, accounts, authentication, favorites, price alerts,
  or notifications.
- `failedStores` is always `[]` and `stale` always `false`; the UI's stale and
  store-down states are exercised through `MockGameRepository`.
- Price history is synthetic, and a reseed on a later calendar day shifts the
  series. Real accumulating history is Phase 3.
- The API has never been deployed and remote D1 has never been created — see
  ADR 001.

## Further reading

- `docs/adr/001-elysia-2-cloudflare-poc.md` — Elysia 2 beta POC findings, the
  Cloudflare adapter situation, and the Phase 2 Go/No-Go
- `AGENTS.md` — working rules and the protected design bundle
- `IMPLEMENTATION_SPEC.md` — required product behavior
