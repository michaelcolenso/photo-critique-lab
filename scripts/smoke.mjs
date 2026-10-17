import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const base = process.env.PCL_BASE_URL || 'http://127.0.0.1:8787';
const request = (path, options = {}) =>
  fetch(new URL(path, base), { ...options, signal: AbortSignal.timeout(20_000) });
for (const path of ['/', '/privacy', '/sample.jpg', '/favicon.svg']) {
  const r = await request(path);
  assert.equal(r.status, 200, path);
}
const headers = { 'content-type': 'application/json', origin: new URL(base).origin };
const healthResponse = await request('/api/health');
assert.equal(healthResponse.status, 200, 'Health endpoint');
assert.equal(healthResponse.headers.get('cache-control'), 'no-store');
const health = await healthResponse.json();
assert.equal(health.status, 'ok');
const sample = await readFile(new URL('../tests/fixtures/blocks.png', import.meta.url));
// Use sharp only in this Node smoke script to make a stripped JPEG proxy.
const { default: sharp } = await import('sharp');
const image = `data:image/jpeg;base64,${(await sharp(sample).jpeg().toBuffer()).toString('base64')}`;
const bins = Array(256).fill(0);
bins[128] = 9600;
const technical = {
  luminance: { mean: 128, p05: 128, p50: 128, p95: 128 },
  clipping: { shadowFraction: 0, highlightFraction: 0 },
  sharpness: { global: 0 },
  histogram: { luminance: bins, red: bins, green: bins, blue: bins }
};
// The default smoke never calls a configured model. Live calls require an explicit opt-in.
if (process.env.PCL_EXPECT_AI === 'true' || health.critique === 'unavailable') {
  const response = await request('/api/critique', {
    method: 'POST',
    headers,
    body: JSON.stringify({ image, technical, mode: 'portfolio' })
  });
  if (process.env.PCL_EXPECT_AI === 'true') {
    assert.equal(response.status, 200, 'Live critique');
    const body = await response.json();
    assert.equal(body.critique.crops.length, 3);
  } else {
    assert.equal(response.status, 503, 'Deferred credential behavior');
    assert.match((await response.json()).error, /not configured/);
  }
  assert.equal(response.headers.get('cache-control'), 'no-store');
}
const bad = await request('/api/critique', {
  method: 'POST',
  headers,
  body: JSON.stringify({ image: 'invalid' })
});
assert.equal(bad.status, 400);
const cross = await request('/api/critique', {
  method: 'POST',
  headers: { ...headers, origin: 'https://elsewhere.invalid' },
  body: '{}'
});
assert.equal(cross.status, 403);
const event = {
  sessionId: crypto.randomUUID(),
  photoId: crypto.randomUUID(),
  event: 'crop_viewed',
  timestamp: new Date().toISOString(),
  properties: { version: 'ORIGINAL' }
};
const captured = await request('/api/event', {
  method: 'POST',
  headers,
  body: JSON.stringify(event)
});
assert.ok([200, 202].includes(captured.status));
const rejected = await request('/api/event', {
  method: 'POST',
  headers,
  body: JSON.stringify({ ...event, properties: { ...event.properties, filename: 'private.jpg' } })
});
assert.equal(rejected.status, 400);
console.log(
  `Smoke passed: ${base} — pages/assets, critique availability, no-store, malformed requests, origin guard, and telemetry allowlist.`
);
