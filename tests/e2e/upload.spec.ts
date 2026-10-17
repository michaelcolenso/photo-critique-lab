import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { fixture, expectNoOverflow } from './helpers';
for (const file of ['portrait-1.jpg', 'blocks.png', 'blocks.webp'])
  test(`uploads ${file} and preserves workspace on AI failure`, async ({ page }) => {
    await page.route('**/api/critique', (route) =>
      route.fulfill({ status: 503, json: { error: 'AI critique is not configured yet.' } })
    );
    await page.goto('/');
    await expect(page.getByLabel('Upload photograph', { exact: true })).toBeEnabled();
    await page.getByLabel('Upload photograph', { exact: true }).setInputFiles(fixture(file));
    await expect(page.locator('canvas[aria-label="ORIGINAL photograph"]')).toBeVisible();
    await expect(
      page.getByText('AI critique is not configured yet.', { exact: true })
    ).toBeVisible();
    await expect(page.getByText('Pixel measurements', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Adjust crop', exact: true }).click();
    await page.getByLabel('Width %', { exact: true }).fill('70');
    await page.getByLabel('Width %', { exact: true }).press('Tab');
    await expect(page.getByRole('button', { name: 'Export frame', exact: true })).toBeEnabled();
    await expectNoOverflow(page);
  });
test('renders the original before the critique arrives', async ({ page }) => {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/api/critique', async (route) => {
    await wait;
    await route.fulfill({ status: 502, json: { error: 'AI unavailable' } });
  });
  await page.goto('/');
  await expect(page.getByLabel('Upload photograph', { exact: true })).toBeEnabled();
  await page.getByLabel('Upload photograph', { exact: true }).setInputFiles(fixture());
  await expect(page.locator('canvas[aria-label="ORIGINAL photograph"]')).toBeVisible();
  await expect(page.locator('.workspace-status')).toContainText(
    'Requesting critique and alternative crops…'
  );
  release();
});
test('sends a stripped 1600px proxy, no full original or filename', async ({ page }) => {
  let payload: any;
  await page.route('**/api/critique', (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({ status: 503, json: { error: 'Deferred' } });
  });
  await page.goto('/');
  await expect(page.getByLabel('Upload photograph', { exact: true })).toBeEnabled();
  await page.getByLabel('Upload photograph', { exact: true }).setInputFiles(fixture('large.jpg'));
  await expect.poll(() => !!payload).toBe(true);
  expect(Object.keys(payload).sort()).toEqual(['image', 'mode', 'technical']);
  const metadata = await sharp(Buffer.from(payload.image.split(',')[1], 'base64')).metadata();
  expect(Math.max(metadata.width!, metadata.height!)).toBe(1600);
  expect(metadata.exif).toBeUndefined();
  expect(payload.technical.histogram.luminance).toHaveLength(256);
});
test('normalizes all eight EXIF orientations before coordinates', async ({ page }) => {
  await page.route('**/api/critique', (route) =>
    route.fulfill({ status: 503, json: { error: 'Deferred' } })
  );
  await page.goto('/');
  await expect(page.getByLabel('Upload photograph', { exact: true })).toBeEnabled();
  const topLeft = [
    [255, 0, 0],
    [0, 255, 0],
    [255, 255, 255],
    [0, 0, 255],
    [255, 0, 0],
    [0, 0, 255],
    [255, 255, 255],
    [0, 255, 0]
  ];
  for (let orientation = 1; orientation <= 8; orientation++) {
    const analyzed = page.waitForResponse('**/api/critique');
    await page
      .getByLabel('Upload photograph', { exact: true })
      .setInputFiles(fixture(`orientation-${orientation}.jpg`));
    await analyzed;
    await expect(page.locator('.file-metadata')).toContainText(
      orientation >= 5 ? '80 × 120' : '120 × 80'
    );
    const color = await page
      .locator('canvas[aria-label="ORIGINAL photograph"]')
      .evaluate((el: HTMLCanvasElement) => [
        ...el.getContext('2d')!.getImageData(10, 10, 1, 1).data
      ]);
    topLeft[orientation - 1].forEach((value, channel) =>
      expect(Math.abs(value - color[channel])).toBeLessThan(10)
    );
  }
});
test('rejects unsupported and oversized files clearly', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Upload photograph', { exact: true })).toBeEnabled();
  await page
    .getByLabel('Upload photograph', { exact: true })
    .setInputFiles({ name: 'photo.tiff', mimeType: 'image/tiff', buffer: Buffer.from('invalid') });
  await expect(page.getByRole('alert')).toContainText('supports JPEG, PNG and WebP');
  await page.getByLabel('Upload photograph', { exact: true }).setInputFiles({
    name: 'large.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.alloc(30 * 1024 * 1024 + 1)
  });
  await expect(page.getByRole('alert')).toContainText('smaller than 30 MB');
  await expectNoOverflow(page);
});
