import type { GameRepository } from './game-repository'
import { ApiGameRepository } from './api-repository'
import { MockGameRepository } from './mock-repository'

/**
 * The production import point. Every route/component imports from here —
 * never `./mock-repository` or `./api-repository` directly — so switching
 * data sources is one env var, not a code change.
 *
 * `PUBLIC_DATA_SOURCE` is `api` | `mock` (see `.env.example`), read via
 * `import.meta.env` (see the `envPrefix` note in `vite.config.ts`) rather
 * than SvelteKit's `$env/*` modules: `$env/static/public` fails the whole
 * build if the variable isn't defined anywhere, and `$env/dynamic/public`
 * needs SvelteKit's dev/prod request pipeline to populate a value, which
 * plain Vitest unit tests don't provide. The documented production default
 * (`api`) must work in both, with no `.env` file present at all. Anything
 * other than `mock` — including unset — resolves to `api`.
 */
const dataSource: string | undefined = import.meta.env.PUBLIC_DATA_SOURCE

export const gameRepository: GameRepository =
  dataSource === 'mock'
    ? new MockGameRepository()
    : new ApiGameRepository('/api/v1')
