/**
 * Cloudflare Worker adapter for Elysia 2 beta.
 *
 * `elysia@2.0.0-beta.1` does not ship `elysia/adapter/cloudflare-worker`
 * (only `./adapter/bun`, `./adapter/web-standard`, and `./adapter/utils` are
 * published — verified against the beta.1 exports map and tarball listing).
 * Elysia 1.x's `CloudflareAdapter` was `WebStandardAdapter` plus a startup
 * pre-compile hook; that hook's job — forcing every route handler to compile
 * immediately instead of lazily on first request — is now performed by
 * calling `.compile()` on the app (see `worker/app.ts`), so no equivalent
 * hook is needed here. `ElysiaAdapterOptions` in v2 has no `beforeCompile`
 * slot at all, which confirms the behavior moved into `.compile()` itself.
 *
 * This file is the one piece of this Worker that depends on an unpublished
 * capability of a beta package. If Elysia ships an official
 * `elysia/adapter/cloudflare-worker` for 2.x, delete this file and the
 * import in `worker/app.ts` can point at the official one instead — no
 * other file in `worker/` needs to change.
 */
import { createAdapter } from 'elysia/adapter'
import { WebStandardAdapter } from 'elysia/adapter/web-standard'

export const CloudflareWorkerAdapter = createAdapter({
  ...WebStandardAdapter,
  name: 'cloudflare-worker',
  runtime: 'cloudflare-worker',
  listen() {
    return () => {
      console.warn(
        'Cloudflare Worker does not support .listen(). Export the compiled Elysia instance as the Worker default export instead.'
      )
    }
  }
})
