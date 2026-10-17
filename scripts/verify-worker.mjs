import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const manifest = JSON.parse(await readFile('artifacts/worker-manifest.json', 'utf8'));
const bytes = await readFile('artifacts/worker.tar.gz');
assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.sha256, 'Worker digest');
assert.equal(bytes.length, manifest.bytes, 'Worker byte count');
if (process.env.PCL_EXPECTED_SHA)
  assert.equal(manifest.commit, process.env.PCL_EXPECTED_SHA, 'Verified commit');
const files = execFileSync('tar', ['-tzf', 'artifacts/worker.tar.gz'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);
assert.ok(files.includes('./_worker.js'), 'Worker entry point');
assert.ok(
  !files.some(
    (file) =>
      file.startsWith('/') ||
      file.split('/').includes('..') ||
      /(^|\/)\.env|\.dev\.vars|(^|\/)tests\//.test(file)
  ),
  'Only distributable Worker files'
);
console.log(`Verified ${files.length} Worker files for ${manifest.commit}.`);
