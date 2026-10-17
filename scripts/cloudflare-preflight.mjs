import assert from 'node:assert/strict';
for (const key of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'PCL_BASE_URL'])
  assert.ok(process.env[key], `Configure ${key} in the selected GitHub environment`);
const url = new URL(process.env.PCL_BASE_URL);
assert.equal(url.protocol, 'https:', 'A deployed HTTPS URL is required');
assert.ok(
  !url.username && !url.password && !url.search && !url.hash && url.pathname === '/',
  'Use the public origin without credentials, query or path'
);
console.log('Cloudflare credentials and public URL are configured.');
