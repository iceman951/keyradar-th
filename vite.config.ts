import { sveltekit } from '@sveltejs/kit/vite';
import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [UnoCSS(), sveltekit()],
  // Exposes PUBLIC_-prefixed vars (alongside Vite's default VITE_ prefix) on
  // `import.meta.env`. `src/lib/data/repository.ts` reads
  // `PUBLIC_DATA_SOURCE` this way rather than via `$env/dynamic/public` —
  // that module needs SvelteKit's dev/prod request pipeline to populate a
  // runtime value it doesn't have under plain Vitest, and `$env/static/public`
  // fails the whole build if the var isn't defined anywhere, which the
  // documented `.env`-less production default can't tolerate.
  envPrefix: ['VITE_', 'PUBLIC_'],
  server: {
    host: true,
    // Preserves same-origin frontend code during `pnpm dev:web`: the Worker
    // runs separately via `pnpm dev:api` (wrangler dev --port 8787).
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['tests/setup.ts']
  }
});
