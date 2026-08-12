import { defineConfig } from 'vitest/config'

/**
 * Separate from vitest.config.ts: API route tests run the compiled Elysia
 * app's `fetch` handler directly (`app.handle(new Request(...))`), which
 * needs Node built-ins (`node:...`) that the browser-oriented jsdom config
 * excludes, and none of the jsdom/Testing-Library setup those tests use.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/api/**/*.test.ts']
  }
})
