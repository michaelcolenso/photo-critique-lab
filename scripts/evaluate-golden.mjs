import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
assert.equal(
  process.env.PCL_CONFIRM_BILLABLE,
  'true',
  'Explicit approval for billable calls is required'
);
const base = process.env.PCL_BASE_URL;
assert.ok(base, 'Configure the evaluation environment URL');
const url = new URL(base);
assert.equal(url.protocol, 'https:');
const count = Number(process.env.PCL_EVAL_COUNT || 1);
assert.ok([1, 5, 20].includes(count), 'Choose 1, 5 or 20 public fixtures');
const health = await (
  await fetch(new URL('/api/health', url), { signal: AbortSignal.timeout(15_000) })
).json();
assert.equal(
  health.critique,
  'configured',
  'The deployed Worker must have its server-side OpenAI key configured'
);
const manifest = JSON.parse(await readFile('tests/golden/manifest.json', 'utf8'));
const browser = await chromium.launch();
const page = await browser.newPage();
// Evaluation must not contaminate the photographer study's behavioral dataset.
await page.route('**/api/event', (route) =>
  route.fulfill({ status: 202, json: { captured: false } })
);
const results = [];
let failed = false;
await mkdir('artifacts/live-evaluation', { recursive: true });
try {
  await page.goto(base);
  for (const image of manifest.images.slice(0, count)) {
    const started = Date.now();
    try {
      const input = page.getByLabel('Upload photograph', { exact: true });
      await expect(input).toBeEnabled();
      const responsePromise = page.waitForResponse(
        (response) => new URL(response.url()).pathname === '/api/critique',
        { timeout: 60_000 }
      );
      await input.setInputFiles(`tests/golden/${image.file}`);
      const response = await responsePromise;
      assert.equal(response.status(), 200, 'Critique request failed');
      const result = await response.json();
      await expect(page.locator('.verdict')).toHaveText(result.critique.verdict);
      assert.equal(result.critique.crops.length, 3);
      await page.screenshot({
        path: `artifacts/live-evaluation/${image.file}.png`,
        fullPage: true
      });
      results.push({
        file: image.file,
        source: image.source,
        durationMs: Date.now() - started,
        result,
        humanSubjectReview: 'required'
      });
      console.log(`Validated structured critique and client geometry for ${image.file}.`);
    } catch (error) {
      failed = true;
      results.push({
        file: image.file,
        durationMs: Date.now() - started,
        error: String(error.message),
        humanSubjectReview: 'not_completed'
      });
    }
  }
} finally {
  await browser.close();
  await writeFile(
    'artifacts/live-evaluation/results.json',
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        scope: 'Public golden fixtures only; human photographic/subject review remains required.',
        results
      },
      null,
      2
    ) + '\n'
  );
}
if (failed) process.exitCode = 1;
