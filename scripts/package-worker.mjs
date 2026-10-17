import { mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
const run = promisify(execFile);
await mkdir('artifacts', { recursive: true });
// The adapter entry references output/server and cloudflare-tmp; ship Wrangler's linked bundle.
await rm('artifacts/worker-bundle', { recursive: true, force: true });
await rm('artifacts/worker-stage', { recursive: true, force: true });
const bundle = await run(process.execPath, [
  'node_modules/wrangler/bin/wrangler.js',
  'deploy',
  '--dry-run',
  '--outdir',
  'artifacts/worker-bundle'
]);
console.log(bundle.stdout);
await cp('.svelte-kit/cloudflare', 'artifacts/worker-stage', { recursive: true });
await cp('artifacts/worker-bundle/_worker.js', 'artifacts/worker-stage/_worker.js');
const { stdout } = await run('git', ['rev-parse', 'HEAD']);
const commit = stdout.trim();
await run('tar', [
  '--sort=name',
  '--mtime=@0',
  '--owner=0',
  '--group=0',
  '--numeric-owner',
  '-czf',
  'artifacts/worker.tar.gz',
  '-C',
  'artifacts/worker-stage',
  '.'
]);
const bytes = await readFile('artifacts/worker.tar.gz');
const sha256 = createHash('sha256').update(bytes).digest('hex');
await writeFile(
  'artifacts/worker-manifest.json',
  JSON.stringify({ commit, sha256, bytes: bytes.length }, null, 2) + '\n'
);
await writeFile('artifacts/SHA256SUMS', `${sha256}  worker.tar.gz\n`);
console.log(`Packaged Worker for ${commit}: ${sha256}`);
