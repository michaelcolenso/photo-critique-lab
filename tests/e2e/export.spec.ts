import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { loadReady } from './helpers';
test('exports B at full available resolution without overlays', async ({ page }) => {
  await loadReady(page);
  await page.getByRole('tab', { name: 'B Strongest' }).click();
  await page.getByRole('button', { name: 'Overlays', exact: true }).click();
  await page.getByRole('button', { name: 'Thirds', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export frame', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('portrait-1-pcl-strongest.jpg');
  const output = await sharp((await download.path())!).metadata();
  expect(output.width).toBe(480);
  expect(output.height).toBe(960);
  expect(output.exif).toBeUndefined();
  await expect(
    page.getByText('Exported 480 × 960 px. Overlays are excluded.', { exact: true })
  ).toBeVisible();
});
