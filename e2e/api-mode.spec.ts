import { expect, test } from '@playwright/test';

/**
 * Runs against a `PUBLIC_DATA_SOURCE=api` build served by `wrangler dev`
 * with a migrated + seeded local D1 (see scripts/run-e2e-api.mjs). Covers
 * the five flows IMPLEMENTATION_SPEC.md §18.5 requires for API mode; the
 * full responsive/state-toggle suite stays on mock mode in e2e/app.spec.ts.
 */

test('home page loads seeded data from the API', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /ค้นหาราคาเกม Steam/ })).toBeVisible();
  await expect(page.getByTestId('game-card').first()).toBeVisible();
});

test('search returns seeded games', async ({ page }) => {
  await page.goto('/');
  const search = page.locator('.hero-search').getByRole('textbox', { name: 'ค้นหาเกม' });
  await search.fill('Valheim');
  await expect(page.getByRole('listbox', { name: 'ผลการค้นหาเกม' })).toBeVisible();
  await expect(page.getByRole('option', { name: /Valheim/ })).toBeVisible();
});

test('game detail loads offers from D1', async ({ page }) => {
  await page.goto('/games/valheim');
  await expect(page.getByText(/ราคาสุทธิโดยประมาณ/).first()).toBeVisible();
  await expect(page.locator('main')).toContainText('฿');
});

test('stores page loads', async ({ page }) => {
  await page.goto('/stores');
  await expect(page.getByRole('heading', { name: 'ร้านค้าที่รองรับ' })).toBeVisible();
  await expect(page.locator('.cards article').first()).toBeVisible();
});

test('unknown game shows the existing recovery state', async ({ page }) => {
  await page.goto('/games/this-game-does-not-exist');
  await expect(page.getByRole('heading', { name: /ไม่พบเกมที่ตรงกับ/ })).toBeVisible();
});
