import { mergeConfig } from 'vite';
import viteConfig from './vite.config';
import { defineConfig } from 'vitest/config';

export default mergeConfig(viteConfig, defineConfig({
  resolve: { conditions: ['browser'] },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    // Components (e.g. SearchBox, Autocomplete) import `gameRepository` from
    // `$lib/data/repository`, which defaults to `ApiGameRepository` absent
    // this var. Unit/component tests have no live Worker to call, so they
    // need the deterministic mock repository, matching this suite's
    // existing behavior before the API repository selector existed.
    env: { PUBLIC_DATA_SOURCE: 'mock' }
  }
}));
