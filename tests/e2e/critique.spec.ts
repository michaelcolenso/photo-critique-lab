import { test, expect } from '@playwright/test';
import { loadReady, fixture, expectNoOverflow } from './helpers';
import { critique } from '../fixtures/critique';
test('shows critique, three crop roles and six explained scores', async ({ page }) => {
  await loadReady(page);
  await expect(page.getByText('MAYBE', { exact: true })).toBeVisible();
  for (const label of ['Conservative', 'Strongest', 'Wildcard'])
    await expect(page.getByRole('tab').filter({ hasText: label })).toBeAttached();
  await page.getByRole('button', { name: 'Six dimensions', exact: true }).click();
  for (const label of [
    'Composition',
    'Light',
    'Moment',
    'Originality',
    'Technical execution',
    'Print potential'
  ])
    await expect(page.locator('.score-card summary').filter({ hasText: label })).toBeVisible();
  await page.locator('.score-card summary').filter({ hasText: 'Composition' }).click();
  await expect(page.getByText(critique.scores.composition.reason, { exact: true })).toBeVisible();
  await expectNoOverflow(page);
});
test('weakness highlights its image-specific region', async ({ page }) => {
  await loadReady(page);
  await page.getByRole('button', { name: 'The bright corner competes' }).click();
  await expect(page.getByTestId('analysis-region')).toBeVisible();
  await expect(page.getByTestId('analysis-region')).toContainText('Bright upper corner');
  await expect(page.getByRole('tab', { name: /Original/ })).toHaveAttribute(
    'aria-selected',
    'true'
  );
});
test('edits, resets, drags and locks a crop without altering recommendation', async ({ page }) => {
  await loadReady(page);
  await page.getByRole('tab', { name: 'B Strongest' }).click();
  await page.getByRole('button', { name: 'Adjust crop', exact: true }).click();
  const width = page.getByLabel('Width %', { exact: true });
  await expect(width).toHaveValue('60');
  await width.fill('70');
  await width.press('Tab');
  await expect(width).toHaveValue('70');
  await page.getByRole('button', { name: 'Reset recommendation' }).click();
  await expect(width).toHaveValue('60');
  await page.getByRole('button', { name: '1:1', exact: true }).click();
  const normalizedWidth = Number(await width.inputValue()) / 100,
    normalizedHeight =
      Number(await page.getByLabel('Height %', { exact: true }).inputValue()) / 100;
  expect((normalizedWidth * (800 / 1200)) / normalizedHeight).toBeCloseTo(1, 2);
  await page.getByRole('button', { name: 'Reset recommendation' }).click();
  const move = page.getByRole('button', { name: /Move crop using pointer/ });
  const box = (await move.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 8, box.y + box.height / 2 + 8, { steps: 3 });
  await page.mouse.up();
  expect(Number(await page.getByLabel('Left %', { exact: true }).inputValue())).toBeGreaterThan(20);
  await page.getByRole('button', { name: 'Reset recommendation' }).click();
  await expect(page.getByLabel('Left %', { exact: true })).toHaveValue('20');
  await expectNoOverflow(page);
});
test('AI failure offers retry while retaining source and local analysis', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/critique', (route) => {
    attempts++;
    return attempts === 1
      ? route.fulfill({ status: 502, json: { error: 'Critique timed out.' } })
      : route.fulfill({ json: { critique, meta: { fallbackRoles: [] } } });
  });
  await page.goto('/');
  await expect(page.getByLabel('Upload photograph', { exact: true })).toBeEnabled();
  await page.getByLabel('Upload photograph', { exact: true }).setInputFiles(fixture());
  await expect(page.getByRole('alert')).toContainText('Critique timed out.');
  await page.getByRole('button', { name: 'Retry critique', exact: true }).first().click();
  await expect(page.getByText(critique.thesis, { exact: true })).toBeVisible();
  expect(attempts).toBe(2);
});
