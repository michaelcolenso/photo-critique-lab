import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
const run = promisify(execFile);
await mkdir('artifacts', { recursive: true });
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
  '.svelte-kit/cloudflare',
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
