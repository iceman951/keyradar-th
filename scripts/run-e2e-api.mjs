#!/usr/bin/env node
/**
 * API-mode end-to-end runner (IMPLEMENTATION_SPEC.md §18.5). Builds the SPA
 * with PUBLIC_DATA_SOURCE=api, migrates + seeds a local D1 instance, boots
 * `wrangler dev` serving both static assets and /api/v1/*, then runs
 * e2e/api-mode.spec.ts against it.
 *
 * Mirrors scripts/run-e2e.mjs (mock mode, vite preview on :4180); this one
 * runs on :8788 to avoid colliding with a concurrently running `pnpm dev:api`
 * on :8787. Needs `wrangler`/`workerd`, which needs glibc >= 2.35 — it runs
 * unmodified in GitHub Actions' ubuntu-latest, and in this project's own dev
 * container if the host's glibc is older.
 */
import { spawn, spawnSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const port = 8788;
const baseUrl = `http://127.0.0.1:${port}`;

const run = (command, args, extraEnv = {}) => {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv }
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

console.log('1. Building the SPA with PUBLIC_DATA_SOURCE=api...');
run(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], { PUBLIC_DATA_SOURCE: 'api' });

console.log('2. Applying local D1 migrations...');
run('node_modules/.bin/wrangler', ['d1', 'migrations', 'apply', 'keyradar-th-prod', '--local']);

console.log('3. Seeding local D1...');
run(process.execPath, ['scripts/seed-d1.mjs', '--local']);

console.log(`4. Starting wrangler dev on :${port}...`);
const server = spawn('node_modules/.bin/wrangler', ['dev', '--port', String(port)], {
  cwd: root,
  stdio: 'inherit'
});

const waitUntilReady = async () => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/v1/health`);
      if (response.ok) return;
    } catch {
      // Worker is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`wrangler dev did not become ready at ${baseUrl}`);
};

try {
  await waitUntilReady();
  console.log('5. Running e2e/api-mode.spec.ts...');
  const tests = spawn(
    process.execPath,
    ['node_modules/@playwright/test/cli.js', 'test', 'e2e/api-mode.spec.ts'],
    { cwd: root, stdio: 'inherit', env: { ...process.env, E2E_BASE_URL: baseUrl } }
  );
  const exitCode = await new Promise((resolve) => tests.on('exit', (code) => resolve(code ?? 1)));
  process.exitCode = exitCode;
} finally {
  server.kill('SIGTERM');
}
