import { expect, type Page } from '@playwright/test';
import path from 'node:path';
import { critique } from '../fixtures/critique';
export const fixture = (file = 'portrait-1.jpg') => path.resolve('tests/fixtures', file);
export async function mockCritique(page: Page) {
  await page.route('**/api/critique', (route) =>
    route.fulfill({ json: { critique, meta: { correctionAttempted: false, fallbackRoles: [] } } })
  );
}
export async function loadReady(page: Page, file?: string) {
  await mockCritique(page);
  await page.goto('/');
  await expect(page.getByLabel('Upload photograph', { exact: true })).toBeEnabled();
  await page.getByLabel('Upload photograph', { exact: true }).setInputFiles(fixture(file));
  await expect(page.getByText(critique.thesis, { exact: true })).toBeVisible();
}
export async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
}
