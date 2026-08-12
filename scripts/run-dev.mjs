#!/usr/bin/env node
/**
 * Runs the Vite dev server and `wrangler dev` side by side for local
 * development. Equivalent to running `pnpm dev:web` and `pnpm dev:api` in
 * two terminals; this just saves opening the second one.
 */
import { spawn } from 'node:child_process'

const children = [
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'dev'], {
    stdio: 'inherit'
  }),
  spawn('node_modules/.bin/wrangler', ['dev', '--port', '8787'], {
    stdio: 'inherit'
  })
]

let shuttingDown = false
const shutdown = () => {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) child.kill('SIGTERM')
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

for (const child of children) {
  child.on('exit', (code) => {
    if (!shuttingDown && code !== 0) {
      console.error(
        `One of the dev processes exited with code ${code}; stopping the other.`
      )
    }
    shutdown()
  })
}
