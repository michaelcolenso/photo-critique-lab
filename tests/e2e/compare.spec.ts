import { test, expect } from '@playwright/test';
import { loadReady, fixture, expectNoOverflow } from './helpers';
test('four-up expands every source version and A/B wipes any two', async ({ page }) => {
  await loadReady(page);
  await page.getByRole('button', { name: 'Four-up comparison', exact: true }).click();
  await expect(page.locator('.compare-tile')).toHaveCount(4);
  await expectNoOverflow(page);
  await page.getByRole('button', { name: 'Expand B · Strongest', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'B Strongest' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await page.getByRole('button', { name: 'A/B comparison', exact: true }).click();
  await page.getByLabel('Left version').selectOption('A');
  await page.getByLabel('Right version').selectOption('C');
  const slider = page.getByRole('slider', { name: 'Comparison wipe' });
  await slider.fill('75');
  await expect(slider).toHaveValue('75');
  await expect(page.locator('.wipe-right')).toHaveCSS('clip-path', 'inset(0px 0px 0px 75%)');
  await expectNoOverflow(page);
});
test('records one preference with geometry and re-engagement without private payloads', async ({
  page
}) => {
  const events: any[] = [];
  await page.route('**/api/event', (route) => {
    events.push(route.request().postDataJSON());
    return route.fulfill({ json: { captured: true } });
  });
  await loadReady(page);
  await page.getByRole('button', { name: 'B', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'B Strongest', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await page.getByLabel('Better composition', { exact: true }).check();
  await page.getByLabel('Yes', { exact: true }).check();
  await page.getByRole('button', { name: 'Record preference', exact: true }).click();
  await expect(page.getByText('Preference recorded: B', { exact: true })).toBeVisible();
  await expect.poll(() => events.filter((e) => e.event === 'preference_selected').length).toBe(1);
  const preference = events.find((e) => e.event === 'preference_selected');
  expect(preference.properties.selection).toBe('B');
  expect(preference.properties.usefulness).toBe('YES');
  expect(preference.properties.recommendedRect).toEqual({
    x: 0.2,
    y: 0.12,
    width: 0.6,
    height: 0.8
  });
  await page
    .getByLabel('Upload photograph', { exact: true })
    .setInputFiles(fixture('landscape-1.jpg'));
  await expect.poll(() => events.filter((e) => e.event === 'another_photo_started').length).toBe(1);
  const all = JSON.stringify(events);
  expect(all).not.toContain('portrait-1');
  expect(all).not.toContain('landscape-1');
  expect(all).not.toContain('data:image');
  expect(all).not.toContain('filename');
  expect(all).not.toContain('exif');
  expect(new Set(events.filter((e) => e.event === 'photo_loaded').map((e) => e.photoId)).size).toBe(
    2
  );
});
test('landing and every overlay control fit 320px', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Upload photograph', { exact: true })).toBeEnabled();
  await expectNoOverflow(page);
  await loadReady(page);
  await page.getByRole('button', { name: 'Overlays', exact: true }).click();
  for (const overlay of [
    'Subject',
    'Visual anchor',
    'Distractions',
    'Highlights',
    'Shadows',
    'Thirds'
  ])
    await page.getByRole('button', { name: overlay, exact: true }).click();
  await expectNoOverflow(page);
});
