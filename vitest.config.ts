import { mergeConfig } from 'vite';
import viteConfig from './vite.config';
import { defineConfig } from 'vitest/config';

export default mergeConfig(viteConfig, defineConfig({
  test: { environment: 'jsdom', include: ['tests/unit/**/*.test.ts'], setupFiles: ['tests/setup.ts'] }
}));
