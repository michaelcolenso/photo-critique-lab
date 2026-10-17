import { spawn } from 'node:child_process';
import { mkdir, open } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
await mkdir('artifacts', { recursive: true });
const log = await open('artifacts/worker.log', 'w');
const base = 'http://127.0.0.1:8787';
const worker = spawn(
  process.execPath,
  [
    'node_modules/wrangler/bin/wrangler.js',
    'dev',
    '--ip',
    '127.0.0.1',
    '--port',
    '8787',
    '--log-level',
    'warn'
  ],
  { stdio: ['ignore', log.fd, log.fd], detached: true }
);
function stop() {
  try {
    process.kill(-worker.pid, 'SIGTERM');
  } catch {}
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
const environment = {
  ...process.env,
  PCL_BASE_URL: base,
  PCL_RUNTIME: 'worker',
  PCL_EXPECT_AI: 'auto'
};
function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: 'inherit', env: environment });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`Check failed (${code}): ${args[0]}`))
    );
  });
}
try {
  const deadline = Date.now() + 60_000;
  while (true) {
    if (worker.exitCode !== null)
      throw new Error('Worker exited before readiness; inspect artifacts/worker.log.');
    try {
      const response = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1500) });
      if (response.ok) break;
    } catch {}
    if (Date.now() > deadline)
      throw new Error('Worker readiness timed out; inspect artifacts/worker.log.');
    await pause(300);
  }
  await run(['scripts/smoke.mjs']);
  await run([
    'node_modules/@playwright/test/cli.js',
    'test',
    '--project=desktop',
    '--project=mobile'
  ]);
} finally {
  stop();
  await log.close();
}
