import { it, expect } from 'vitest';
import { validateDeployment } from '../../scripts/resolve-deployment.mjs';
const sha = 'a'.repeat(40),
  repository = 'michaelcolenso/photo-critique-lab';
const run = {
  id: 123,
  repository: { full_name: repository },
  head_repository: { full_name: repository },
  path: '.github/workflows/ci.yml',
  conclusion: 'success',
  event: 'push',
  head_sha: sha,
  head_branch: 'main'
};
it('allows only a successful verified source for production', () =>
  expect(validateDeployment(run, repository, 'production', 'main', sha)).toEqual({
    sha,
    run_id: '123',
    target: 'production'
  }));
it('allows trusted feature-branch CI only for staging', () =>
  expect(
    validateDeployment(
      { ...run, head_branch: 'work' },
      repository,
      'staging',
      'main',
      'b'.repeat(40)
    ).target
  ).toBe('staging'));
for (const [name, change] of Object.entries({
  fork: { head_repository: { full_name: 'outsider/fork' } },
  'wrong workflow': { path: '.github/workflows/other.yml' },
  failure: { conclusion: 'failure' },
  'PR event': { event: 'pull_request' },
  'non-main production': { head_branch: 'work' },
  'malformed SHA': { head_sha: 'not-a-sha' }
}))
  it(`rejects ${name} deployment input`, () =>
    expect(() =>
      validateDeployment({ ...run, ...change }, repository, 'production', 'main', sha)
    ).toThrow());
it('rejects an obsolete production commit', () =>
  expect(() => validateDeployment(run, repository, 'production', 'main', 'b'.repeat(40))).toThrow(
    'obsolete'
  ));
