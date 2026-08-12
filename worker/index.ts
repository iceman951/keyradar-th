import { env } from 'cloudflare:workers'
import { createApp } from './app'
import { createDb } from './db/client'
import { createCatalogService } from './modules/catalog/catalog.service'
import { createPricingService } from './modules/pricing/pricing.service'
import type { Bindings } from './bindings'

// Cloudflare Workers do not support `.listen()`; the compiled Elysia
// instance is exported directly as the Worker's default export.
//
// `.compile()` must run here, at module-evaluation (startup) scope — workerd
// only permits the codegen Elysia's route compiler uses (`new Function`)
// during startup, not on the first request. See
// docs/adr/001-elysia-2-cloudflare-poc.md for how this was verified.

// `wrangler types` (the installed 4.118.0) does not populate `Cloudflare.Env`
// — the type behind `cloudflare:workers`'s `env` export — from the
// `[[d1_databases]]` block in wrangler.toml; it stays `{}`. `Bindings` in
// `worker/bindings.ts` is hand-written and authoritative instead, so this
// cast bridges the (empty, but real at runtime) generated type to it.
const db = createDb(env as unknown as Bindings)
const catalog = createCatalogService(db)
const pricing = createPricingService(db, catalog)
const app = createApp({ catalog, pricing })

export default app.compile()
