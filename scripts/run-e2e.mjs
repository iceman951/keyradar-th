/**
 * Mock-mode end-to-end runner: builds with PUBLIC_DATA_SOURCE=mock and
 * serves the result with `vite preview`. This suite exercises the full
 * responsive/state-variant matrix using MockGameRepository's deterministic
 * edge states (?state=refreshing, ?state=no-th, ...), which no live API
 * provides. API-mode coverage lives in `pnpm test:e2e:api`
 * (scripts/run-e2e-api.mjs).
 *
 * The build must run here rather than in the package.json script so that
 * PUBLIC_DATA_SOURCE is set for it — without that the build defaults to
 * `api` and every data-dependent test fails against a preview server that
 * has no Worker behind it.
 */
import { spawn, spawnSync } from 'node:child_process'

const root = new URL('../', import.meta.url)
const baseUrl = 'http://127.0.0.1:4180'

const build = spawnSync(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'build'],
  {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, PUBLIC_DATA_SOURCE: 'mock' }
  }
)
if (build.status !== 0) process.exit(build.status ?? 1)

const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4180'
  ],
  {
    cwd: root,
    stdio: 'inherit'
  }
)

const waitUntilReady = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) return
    } catch {
      // The preview server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Preview server did not become ready at ${baseUrl}`)
}

try {
  await waitUntilReady()
  // Defaults to app.spec.ts only, never e2e/api-mode.spec.ts — that suite
  // expects a live Worker/D1 and belongs to `pnpm test:e2e:api`
  // (scripts/run-e2e-api.mjs) instead. Extra CLI args still override this.
  const targets =
    process.argv.slice(2).length > 0
      ? process.argv.slice(2)
      : ['e2e/app.spec.ts']
  const tests = spawn(
    process.execPath,
    ['node_modules/@playwright/test/cli.js', 'test', ...targets],
    {
      cwd: root,
      stdio: 'inherit'
    }
  )
  const exitCode = await new Promise((resolve) =>
    tests.on('exit', (code) => resolve(code ?? 1))
  )
  process.exitCode = exitCode
} finally {
  server.kill('SIGTERM')
}
