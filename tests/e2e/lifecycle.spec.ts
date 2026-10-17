import { test, expect } from '@playwright/test';
import { fixture, loadReady, mockCritique } from './helpers';

test('runs pixel analysis in a dedicated worker', async ({ page }) => {
  await mockCritique(page);
  await page.goto('/');
  await expect(page.getByLabel('Upload photograph', { exact: true })).toBeEnabled();
  const workerStarted = page.waitForEvent('worker');
  await page.getByLabel('Upload photograph', { exact: true }).setInputFiles(fixture());
  const worker = await workerStarted;
  expect(worker.url()).toContain('analysis.worker');
  await expect(page.getByText('Pixel measurements', { exact: true })).toBeVisible();
});

test('local analysis retry preserves manual geometry and does not count as another photo', async ({
  page
}) => {
  await page.addInitScript(() => {
    let fail = true;
    window.Worker = new Proxy(window.Worker, {
      construct(target, args) {
        if (fail) {
          fail = false;
          throw new Error('Analysis worker unavailable');
        }
        return Reflect.construct(target, args);
      }
    });
  });
  const events: any[] = [];
  await page.route('**/api/event', (route) => {
    events.push(route.request().postDataJSON());
    return route.fulfill({ json: { captured: true } });
  });
  await mockCritique(page);
  await page.goto('/');
  await expect(page.getByLabel('Upload photograph', { exact: true })).toBeEnabled();
  await page.getByLabel('Upload photograph', { exact: true }).setInputFiles(fixture());
  await expect(page.getByRole('alert')).toContainText('Analysis worker unavailable');
  await page.getByRole('button', { name: 'Adjust crop', exact: true }).click();
  await page.getByLabel('Width %', { exact: true }).fill('70');
  await page.getByLabel('Width %', { exact: true }).press('Tab');
  await page.getByRole('button', { name: 'Retry critique', exact: true }).first().click();
  await expect(page.getByText('Pixel measurements', { exact: true })).toBeVisible();
  await expect(page.locator('.verdict')).toHaveText('MAYBE');
  await expect(page.getByLabel('Width %', { exact: true })).toHaveValue('70');
  expect(events.filter((e) => e.event === 'photo_loaded')).toHaveLength(1);
  expect(events.filter((e) => e.event === 'another_photo_started')).toHaveLength(0);
});

test('crop tabs support arrow keys, Home and End', async ({ page }) => {
  await loadReady(page);
  const original = page.getByRole('tab', { name: 'Original photograph', exact: true });
  await original.focus();
  await original.press('ArrowRight');
  const a = page.getByRole('tab', { name: 'A Conservative', exact: true });
  await expect(a).toBeFocused();
  await expect(a).toHaveAttribute('aria-selected', 'true');
  await a.press('End');
  const c = page.getByRole('tab', { name: 'C Wildcard', exact: true });
  await expect(c).toBeFocused();
  await expect(c).toHaveAttribute('aria-selected', 'true');
  await c.press('Home');
  await expect(original).toBeFocused();
});
