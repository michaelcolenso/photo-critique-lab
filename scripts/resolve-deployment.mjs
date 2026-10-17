import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/**
 * @param {{id:number, repository:{full_name:string}, head_repository:{full_name:string}, path:string, conclusion:string, event:string, head_sha:string, head_branch:string}} run
 * @param {string} repository
 * @param {string} target
 * @param {string} defaultBranch
 * @param {string} latestSha
 */
export function validateDeployment(run, repository, target, defaultBranch, latestSha) {
  assert.ok(['staging', 'production'].includes(target), 'Unknown environment');
  assert.equal(run.repository.full_name, repository, 'Run repository');
  assert.equal(run.head_repository.full_name, repository, 'Fork artifacts cannot be deployed');
  assert.equal(run.path, '.github/workflows/ci.yml', 'Only CI artifacts can be deployed');
  assert.equal(run.conclusion, 'success', 'CI must have passed');
  assert.ok(
    ['push', 'workflow_dispatch'].includes(run.event),
    'Only trusted branch runs can deploy'
  );
  assert.match(run.head_sha, /^[a-f0-9]{40}$/, 'Invalid source SHA');
  assert.ok(Number.isSafeInteger(run.id) && run.id > 0, 'Invalid CI run id');
  if (target === 'production') {
    assert.equal(run.head_branch, defaultBranch, 'Production requires the default branch');
    assert.equal(run.head_sha, latestSha, 'An obsolete CI run cannot overwrite production');
  }
  return { sha: run.head_sha, run_id: String(run.id), target };
}

async function main() {
  const repository = process.env.GITHUB_REPOSITORY;
  assert.ok(repository, 'Repository context is required');
  assert.match(repository || '', /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
  const runId = process.env.PCL_CI_RUN_ID;
  assert.match(runId || '', /^\d+$/, 'Provide a successful CI run id');
  /** @param {string} path */
  const api = (path) => JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8' }));
  const run = api(`repos/${repository}/actions/runs/${runId}`);
  const repo = api(`repos/${repository}`);
  const latest = api(`repos/${repository}/commits/${encodeURIComponent(repo.default_branch)}`);
  const target = process.env.PCL_TARGET;
  assert.ok(target, 'Deployment target is required');
  const output = process.env.GITHUB_OUTPUT;
  assert.ok(output, 'GitHub output file is required');
  const result = validateDeployment(run, repository, target, repo.default_branch, latest.sha);
  for (const [key, value] of Object.entries(result)) await appendFile(output, `${key}=${value}\n`);
  console.log(`Verified ${result.sha} from CI run ${result.run_id} for ${result.target}.`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) await main();
