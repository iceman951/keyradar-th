import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ fallback: '200.html' }),
    // Default relative asset paths break the shared 200.html SPA fallback
    // for any unknown route nested more than one segment deep (e.g.
    // /games/some-typo'd-slug): the browser resolves `_app/...` against the
    // request URL, not the fallback file's real location, producing
    // /games/_app/... under Cloudflare's strict static-asset serving (no
    // such file). Prerendered pages are unaffected — SvelteKit computes each
    // one's own correct relative depth — only the single shared fallback is.
    // `vite preview` masked this during development; it wasn't caught until
    // testing against `wrangler dev`, which serves assets the way Cloudflare
    // actually does.
    paths: { relative: false }
  }
}

export default config
