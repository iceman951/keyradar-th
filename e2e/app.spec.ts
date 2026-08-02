import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message));
});

test('home exposes the primary discovery journey', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /ค้นหาราคาเกม Steam/ })).toBeVisible();
  await expect(page.getByTestId('game-card').first()).toBeVisible();
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'เมนู' }).click();
  await page.getByRole('link', { name: 'เกมลดราคา', exact: true }).first().click();
  await expect(page).toHaveURL(/\/deals/);
  await expect(page.getByRole('heading', { name: 'เกมลดราคา' })).toBeVisible();
});

test('search, filters, and game comparison are interactive', async ({ page }) => {
  await page.goto('/search?q=Forest');
  await expect(page.getByRole('heading', { name: /ผลการค้นหา/ })).toBeVisible();
  await expect(page.getByText('The Forest', { exact: true }).first()).toBeVisible();
  await page.getByText('The Forest', { exact: true }).first().click();
  await expect(page).toHaveURL(/\/games\/the-forest/);
  await expect(page.getByRole('heading', { name: 'The Forest' })).toBeVisible();
  await expect(page.getByText(/ถูกที่สุดที่ใช้งานในไทยได้/).first()).toBeVisible();
  await page.getByRole('button', { name: /รายละเอียด/ }).first().click();
  await expect(page.getByText('รายละเอียดราคา').first()).toBeVisible();
});

test('mobile layout uses filter sheet and offer cards', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-specific assertion');
  await page.goto('/popular');
  await page.getByRole('button', { name: /ตัวกรอง/ }).click();
  await expect(page.getByRole('heading', { name: 'ตัวกรอง' })).toBeVisible();
  await page.getByRole('button', { name: /ดูผลลัพธ์/ }).click();
  await page.goto('/games/elden-ring');
  await expect(page.getByText(/ราคาสุทธิโดยประมาณ/).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /ไปยังร้านค้า/ }).last()).toBeVisible();
});
