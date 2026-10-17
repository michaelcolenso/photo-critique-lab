import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
test('crop engine exports only the correct source pixels at original dimensions', async ({
  page
}) => {
  await page.goto('/');
  const input = (await readFile(path.resolve('tests/fixtures/blocks.png'))).toString('base64');
  const result = await page.evaluate(async (base64) => {
    const { exportCrop } = await import('/src/lib/image/export.ts' as string);
    const source = await createImageBitmap(
      await (await fetch(`data:image/png;base64,${base64}`)).blob()
    );
    const blob = await exportCrop(source, { x: 0.5, y: 0, width: 0.5, height: 0.5 });
    const output = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = output.width;
    canvas.height = output.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(output, 0, 0);
    return {
      width: output.width,
      height: output.height,
      color: [...ctx.getImageData(30, 20, 1, 1).data]
    };
  }, input);
  expect(result.width).toBe(60);
  expect(result.height).toBe(40);
  expect(result.color[0]).toBeLessThan(5);
  expect(result.color[1]).toBeGreaterThan(250);
  expect(result.color[2]).toBeLessThan(5);
});
