import { execFileSync } from 'node:child_process';
import { appendFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const repository = process.env.GITHUB_REPOSITORY;
const base = process.env.BASE_SHA,
  head = process.env.HEAD_SHA;
assert.match(repository || '', /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
assert.match(base || '', /^[a-f0-9]{40}$/);
assert.match(head || '', /^[a-f0-9]{40}$/);
let available = true;
try {
  execFileSync('gh', ['api', `repos/${repository}/dependency-graph/compare/${base}...${head}`], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
} catch (error) {
  let status;
  try {
    status = Number(JSON.parse(String(error.stdout)).status);
  } catch {}
  if (![403, 404].includes(status))
    throw new Error(
      'Could not establish dependency review availability. Refusing to silently bypass the check.'
    );
  available = false;
  await appendFile(
    process.env.GITHUB_STEP_SUMMARY,
    'GitHub dependency graph is unavailable. This job runs a blocking npm lockfile audit instead; high/critical findings still fail. Enable Dependency graph in repository security settings to activate native diff review.\n'
  );
}
await appendFile(process.env.GITHUB_OUTPUT, `available=${available}\n`);
