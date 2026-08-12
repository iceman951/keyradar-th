# ADR 001 — Elysia 2 beta on Cloudflare Workers (Phase 1 POC)

## Status

Accepted — **Go** for Phase 2, with the caveats in _Known limitations_ and
_Upgrade risk_.

Date: 2026-08-05

## Context

Phase 1 replaces the KeyRadar TH SPA's mock data source with a real
same-origin REST API backed by Cloudflare D1, without changing the UI or the
static-SPA rendering model. The owner specified Elysia 2 beta on Cloudflare
Workers, and asked for a POC verdict on whether that stack is sound enough to
build Phase 2 (real price ingestion) on top of.

The owner's specification named `elysia/adapter/cloudflare-worker` and
`@sinclair/typebox`, both taken from Elysia's published Cloudflare
integration docs. Neither is correct for the 2.x line; see below.

## Decision

Use `elysia@2.0.0-beta.1`, pinned exactly, with a small locally-defined
Cloudflare adapter, Drizzle ORM over D1, and one Worker deployment serving
both static assets and `/api/v1/*`.

### Resolved Elysia version

`2.0.0-beta.1`, pinned exactly (no `^`/`~`) in `package.json`.

The spec's instruction to install `elysia@beta` does not work: **there is no
`beta` dist-tag.** As of implementation, `elysia`'s tags are:

```
latest       1.4.29
next         2.0.0-beta.1
experimental 2.0.0-exp.61
rc           1.2.0-rc.3
```

`2.0.0-beta.1` is the current official v2 prerelease, published under `next`.

Peer dependencies also differ from the spec, which listed the v1 peers.
Installed: `typebox@1.3.10` (**not** `@sinclair/typebox`, which is the v1
peer), `exact-mirror@1.2.2`, `openapi-types@12.1.3`.

### Cloudflare adapter status

**`elysia/adapter/cloudflare-worker` does not exist in Elysia 2.** Verified
against both the published exports map and the package tarball: `2.0.0-beta.1`
ships only `./adapter/bun`, `./adapter/web-standard`, and `./adapter/utils` —
there are zero files matching `cloudflare` in the package. The same is true of
`2.0.0-exp.61`. The adapter exists only on the 1.4.x line, which is what
elysiajs.com currently documents.

`worker/adapter/cloudflare.ts` supplies it locally, in ~15 lines, via
`createAdapter` over `WebStandardAdapter`. This is well-founded rather than
speculative:

- Elysia 1.4.29's `CloudflareAdapter` is literally `WebStandardAdapter` plus a
  `beforeCompile` hook that force-compiles every route at startup, plus a
  no-op `listen()`.
- Elysia 2's `ElysiaAdapterOptions` has no `beforeCompile` slot at all — that
  responsibility moved into `.compile()`, documented as "force all route
  handlers to compile immediately."
- v2's `ElysiaAdapterOptions.runtime` union already reserves the
  `'cloudflare-worker'` literal.

If Elysia ships an official v2 Cloudflare adapter, deleting this file and
re-pointing the import in `worker/app.ts` is the entire migration.

### The startup-compilation constraint (the load-bearing POC finding)

`.compile()` **must** be called at module-evaluation (startup) scope, as
`worker/index.ts` does. This is not stylistic:

- Elysia's route compiler generates handlers with `new Function`. workerd
  permits dynamic code generation **only during startup**. Deferring
  compilation to the first request fails with
  `Code generation from strings disallowed for this context`, and because
  Elysia builds the whole router on first access, **one uncompilable route
  takes down every route** — including `/health`.
- Conversely, anything that constructs a `Response` at startup fails the
  opposite way, with
  `Disallowed operation called within global scope ... generating random
values are not allowed within global scope`. In practice this means **never
  pass an inline literal as a handler** (`.get('/x', 'hello')`); always pass a
  function. This is the v1-documented "you can't define a Response before
  server start" limitation, still present in v2.

Both failure modes were reproduced and then eliminated during the POC.

### Route signature change (v1 → v2)

Elysia 2 **reorders `.get()`'s arguments**: it is now
`.get(path, hook, handler)`, where v1 was `.get(path, handler, hook)`. Passing
v1 order does not raise a type or runtime error — Elysia silently treats the
schema object as an inline static-value handler and serves the schema itself
as the response body. On Workers this additionally triggers the
global-scope-`Response` crash above, which is how it was found.

`.onError()` was also renamed to `.error()`; calling `.onError()` throws
`TypeError: (intermediate value).onError is not a function` at startup.

## D1 integration result

Works. `drizzle-orm@0.45.2` + `drizzle-kit@0.31.10` (stable `latest`; the
1.0.0 line is still beta/rc) against the D1 binding, with migrations generated
as plain SQL and applied through `wrangler d1 migrations apply`.

Verified by `pnpm test:d1` against a real local D1 instance: migrations apply,
all five tables populate (12 games / 20 editions / 10 stores / 200 offers /
876 price points), offers join to editions and stores with zero orphans, price
history is chronological per `(game, edition)`, every seeded offer satisfies
`finalSatang === advertisedSatang + Σ fees`, and a second seed run adds zero
rows.

Two seeding bugs were found and fixed during this verification:

1. `wrangler d1 migrations apply` treats **every** `.sql` file in
   `migrations_dir` as a migration. A generated `drizzle/seed.sql` was
   therefore executed once as a "migration" and again by the seed script,
   silently doubling every row. The generated seed now lives outside
   `drizzle/`, at `scripts/.generated/seed.sql`.
2. Price-history rows are keyed by `(game_slug, edition_id, observed_at)` and
   the whole series shifts with its time anchor, so anchoring to raw
   `Date.now()` made every reseed mint a fresh ~876-row set from millisecond
   drift. The anchor is now truncated to the UTC day.

## Local development result

Works, via `pnpm dev` (Vite on :5173 with `/api` proxied to `wrangler dev` on
:8787). A production-shaped local run — `pnpm build && wrangler dev` — serves
the SPA and the API from one origin with `run_worker_first = ["/api/*"]`:
`/api/v1/*` returns JSON, everything else falls back to the SPA shell, and no
CORS configuration exists anywhere.

Two pre-existing static-hosting bugs surfaced only once the app was served the
way Cloudflare actually serves it (`vite preview` had masked both):

1. `static/_redirects` contained a Cloudflare Pages-era `/* /200.html 200`
   rule that fights the Worker's `not_found_handling =
"single-page-application"`, producing an infinite `307 → /200` redirect
   loop. Removed; the Worker config is the single SPA-fallback mechanism now.
2. SvelteKit's default relative asset paths break the shared `200.html`
   fallback for any unknown route nested deeper than one segment
   (`/games/typo` made the browser request `/games/_app/...`, which 404s under
   strict asset serving, leaving a blank page). Fixed with
   `paths: { relative: false }`.

## Deployment result

**Not executed.** No Cloudflare account action was taken: no
`wrangler d1 create`, no remote migration, no remote seed, no deploy.
`wrangler.toml` carries `database_id = "REPLACE_WITH_REAL_DATABASE_ID"`. The
remote commands are documented in `README.md` and remain the owner's to run.

Everything above was verified against **local** D1 and `wrangler dev` only.

## Bundle size

Measured via `wrangler deploy --dry-run --outdir`:

```
Total Upload: 1166.00 KiB / gzip: 216.05 KiB
```

That figure is the whole upload (Worker script plus the 68-file static asset
directory). Elysia's compiled Worker script alone is the 1.19 MB
`index.js` in the dry-run output directory. Comfortably inside the 3 MB
free-tier / 10 MB paid Worker limit, but large for what the API does — Elysia
2 beta is not tree-shaking well, which is worth revisiting before Phase 2 adds
ingestion code.

Cold-start timing was **not** measured — doing so meaningfully requires a real
deployment, which was out of scope.

## Validation / type-inference findings

- Elysia `t` schemas validate path params, query params, and responses as
  expected, and reject out-of-range input (`days=999`, empty `q`) at the
  framework boundary before any handler or D1 query runs.
- Validation failures surface as `ValidationError` with status **422**; the
  spec mandates **400**, so `worker/middleware/error-handler.ts` remaps them.
- `HTTPHeaders` is `Record<string, string | number | string[]>`, not
  `Record<string, string>` — helpers touching `set.headers` must type against
  the former.
- `wrangler types` does **not** populate `Cloudflare.Env` from the
  `[[d1_databases]]` block; it emits an empty `interface Env`. The
  hand-written `worker/bindings.ts` is authoritative, with one documented cast
  in `worker/index.ts`.
- `pnpm check` (svelte-check) does not cover `worker/`, so `check:worker`
  (`tsc -p tsconfig.worker.json`) was added. Both pass with zero errors, no
  `any`, and no suppressions.

## Known limitations

- No official v2 Cloudflare adapter; we maintain a local shim.
- Elysia's own Cloudflare documentation describes the 1.4.x API and is
  actively misleading for 2.x (adapter path, peer deps, and the `.get()`
  argument order all differ).
- No `aot: false` escape hatch in v2 — v1 had one. v2 always codegens, so the
  startup-scope compilation constraint is unavoidable, not opt-out.
- Static-file serving and OpenAPI type generation remain unavailable on
  Workers (no `fs`); neither is used here.
- `@cloudflare/vitest-pool-workers` now requires `vitest@^4`, while this repo
  is on 3.2.4. D1 is covered through `wrangler d1 execute --local` plus a live
  `wrangler dev` HTTP suite instead of in-process `env.DB` tests.
- Phase 1 seeds a synthetic 365-day history whose series shifts if reseeded on
  a later calendar day. Real accumulating history is Phase 3.
- `workerd` requires glibc ≥ 2.35, so `wrangler` cannot run directly on hosts
  older than that (this project's dev host is RHEL 8 / glibc 2.28); local
  verification used a `node:22-bookworm` container. GitHub Actions'
  `ubuntu-latest` is unaffected.

## Upgrade risk

Moderate, and concentrated rather than diffuse.

`2.0.0-beta.1` is prerelease and the v1→v2 migration already broke two APIs
silently (`.get()` argument order, `.onError()`). Further beta releases may do
the same. Mitigations in place:

- the version is pinned exactly and `pnpm-lock.yaml` is committed;
- Elysia-specific code is confined to `worker/app.ts`, `worker/index.ts`,
  `worker/adapter/`, `worker/routes/`, `worker/schemas/`, and
  `worker/middleware/` — SQL, mappers, and domain rules are
  framework-independent, so replacing the framework would not touch the data
  or domain layers;
- 14 route tests exercise the real app through `app.handle()`, so a
  signature-level regression fails CI rather than reaching production.

The single largest risk is that the local adapter shim diverges from whatever
official v2 adapter eventually ships. That is one file.

## Go / No-Go for Phase 2

**Go.**

Every Phase 1 acceptance path that does not require a Cloudflare account was
verified end to end: 54 unit tests, 14 API route tests, 7 D1 integration
checks, 18 mock-mode e2e tests, and 15 API-mode e2e tests against a real
`wrangler dev` + local D1, plus clean `check` and `check:worker`.

Conditions attached to the Go:

1. Re-verify against the pinned version before upgrading Elysia; treat every
   beta bump as potentially source-breaking and re-run `pnpm test:api`.
2. Deploy and confirm remote D1 before building Phase 2 ingestion on top — the
   remote path is the one thing this POC did not exercise.
3. Revisit Worker bundle size once ingestion code lands.
