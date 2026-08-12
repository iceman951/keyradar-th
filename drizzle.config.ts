import { defineConfig } from 'drizzle-kit'

// `driver: 'd1-http'` is deliberately omitted: that driver is only for
// `drizzle-kit push`/`studio` talking to a live D1 database over Cloudflare's
// HTTP API, which needs account/database credentials we don't want required
// just to run `db:generate`. Migrations are generated as plain SQL here and
// applied locally/remotely through `wrangler d1 migrations apply`.
export default defineConfig({
  dialect: 'sqlite',
  schema: './worker/db/schema.ts',
  out: './drizzle'
})
