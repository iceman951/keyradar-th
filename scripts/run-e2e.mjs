import { spawn } from 'node:child_process';

const root = new URL('../', import.meta.url);
const baseUrl = 'http://127.0.0.1:4180';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4180'], {
  cwd: root,
  stdio: 'inherit'
});

const waitUntilReady = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The preview server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Preview server did not become ready at ${baseUrl}`);
};

try {
  await waitUntilReady();
  const tests = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], {
    cwd: root,
    stdio: 'inherit'
  });
  const exitCode = await new Promise((resolve) => tests.on('exit', (code) => resolve(code ?? 1)));
  process.exitCode = exitCode;
} finally {
  server.kill('SIGTERM');
}
