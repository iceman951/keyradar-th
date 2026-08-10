import { expect, test, type Page } from '@playwright/test';

const waitForPrices = async (page: Page) => {
  await expect(page.getByText(/ราคาสุทธิโดยประมาณ/).first()).toBeVisible();
};

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message));
});

test('home discovery, keyboard search, and deal tabs work', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /ค้นหาราคาเกม Steam/ })).toBeVisible();
  await expect(page.getByTestId('game-card').first()).toBeVisible();

  const search = page.locator('.hero-search').getByRole('textbox', { name: 'ค้นหาเกม' });
  await search.fill('Valheim');
  await expect(page.getByRole('listbox', { name: 'ผลการค้นหาเกม' })).toBeVisible();
  await expect(page.getByRole('option', { name: /Valheim/ })).toBeVisible();
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page).toHaveURL(/\/games\/valheim/);

  await page.goto('/deals');
  await expect(page.getByRole('heading', { name: 'เกมลดราคา' })).toBeVisible();
  await page.getByRole('button', { name: /ต่ำสุดเป็นประวัติการณ์/ }).click();
  await expect(page.getByTestId('game-card').first()).toBeVisible();
  await page.getByRole('button', { name: /ต่ำกว่า ฿200/ }).click();
  await expect(page.locator('main')).toContainText(/฿/);

  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'เมนู' }).click();
    await page.getByRole('link', { name: 'ร้านค้า', exact: true }).first().click();
    await expect(page).toHaveURL(/\/stores/);
  }
});

test('search filters apply before offer selection and sorting remains functional', async ({ page }, testInfo) => {
  await page.goto('/search?q=Forest');
  await expect(page.getByRole('heading', { name: /ผลการค้นหา/ })).toBeVisible();
  await expect(page.getByText('The Forest', { exact: true }).first()).toBeVisible();

  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: /ตัวกรอง/ }).click();
    const sheet = page.getByRole('dialog', { name: 'ตัวกรอง' });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('checkbox', { name: /ไม่มีค่าธรรมเนียมเพิ่มเติม/ }).check();
    await sheet.getByRole('button', { name: 'Standard', exact: true }).click();
    await sheet.getByRole('button', { name: /ดูผลลัพธ์/ }).click();
    await expect(page.getByText('ไม่มีค่าธรรมเนียมเพิ่ม', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /ราคาต่ำสุด/ }).click();
    await page.getByRole('dialog', { name: 'เรียงตาม' }).getByRole('button', { name: /อัปเดตล่าสุด/ }).click();
  } else {
    const panel = page.getByLabel('ตัวกรองราคาเกม').first();
    await panel.getByRole('checkbox', { name: /ไม่มีค่าธรรมเนียมเพิ่มเติม/ }).check();
    await panel.getByRole('button', { name: 'Standard', exact: true }).click();
    await page.getByLabel('เรียงตาม').selectOption('updated');
  }

  await expect(page.getByText(/Edition: Standard/)).toBeVisible();
  await expect(page.getByText('The Forest', { exact: true }).first()).toBeVisible();
  await page.getByText('The Forest', { exact: true }).first().click();
  await expect(page).toHaveURL(/\/games\/the-forest/);
});

test('game editions, retained refresh data, and stale warnings are represented', async ({ page }) => {
  await page.goto('/games/elden-ring');
  await waitForPrices(page);
  const deluxe = page.getByRole('button', { name: /Deluxe Edition/ });
  await deluxe.click();
  await expect(deluxe).toHaveClass(/active/);

  await page.goto('/games/elden-ring?state=refreshing');
  await waitForPrices(page);
  await expect(page.getByText('กำลังดึงราคาล่าสุดจากร้านค้า')).toBeVisible();
  await expect(page.getByText(/ถูกที่สุดที่ใช้งานในไทยได้/).first()).toBeVisible();

  await page.goto('/games/elden-ring?state=store-down');
  await waitForPrices(page);
  await expect(page.getByText('ร้านค้าบางแห่งไม่ตอบสนองชั่วคราว')).toBeVisible();
});

// No store in the catalogue blanket-blocks Thailand — region locks are per-title,
// so a store-level "blocked" mapping would be invented data. The reachable
// warning state is "uncertain", which is what this now asserts.
test('uncertain-region, no-Thai, no-price, and out-of-stock states have recovery UI', async ({ page }) => {
  await page.goto('/games/helldivers-2');
  await waitForPrices(page);
  await page.getByRole('checkbox', { name: /เฉพาะที่ใช้งานในไทยได้/ }).uncheck();
  // Asserts the status, not a specific region label: which regions exist is
  // editorial data that moves, but "uncertain needs a warning" is the invariant.
  await expect(page.getByText('ตรวจสอบภูมิภาค', { exact: true }).filter({ visible: true }).first()).toBeVisible();

  await page.goto('/games/helldivers-2?state=no-th');
  await expect(page.getByRole('heading', { name: /ยังไม่พบข้อเสนอที่ยืนยัน/ })).toBeVisible();
  await page.getByRole('button', { name: 'ดูข้อเสนอทั้งหมดพร้อมคำเตือน' }).click();
  await expect(page.getByText('ตรวจสอบภูมิภาค', { exact: true }).filter({ visible: true }).first()).toBeVisible();

  await page.goto('/games/elden-ring?state=no-price');
  await expect(page.getByRole('heading', { name: 'ยังไม่มีข้อมูลราคาสำหรับเกมนี้' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ลองดึงราคาอีกครั้ง' })).toBeVisible();

  await page.goto('/games/elden-ring?state=oos');
  await waitForPrices(page);
  await expect(page.getByText('สินค้าหมด', { exact: true }).filter({ visible: true }).first()).toBeVisible();
});

test('outbound confirmation is accessible and the mobile CTA remains viewport-fixed', async ({ page }, testInfo) => {
  await page.goto('/games/elden-ring');
  await waitForPrices(page);

  if (testInfo.project.name === 'mobile') {
    const sticky = page.locator('.sticky-buy');
    await expect(sticky).toBeVisible();
    await expect(sticky.getByText(/฿/).first()).toBeVisible();
    await expect(sticky.locator('s')).toBeVisible();
    await sticky.getByRole('button', { name: /ไปยังร้านค้า/ }).click();
  } else {
    await page.locator('.best-foot').getByRole('button', { name: /ไปยังร้านค้า/ }).click();
  }

  const dialog = page.getByRole('dialog', { name: 'คุณกำลังออกจาก KeyRadar TH' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('ราคาที่โฆษณา');
  await expect(dialog).toContainText('ค่าธรรมเนียมที่ทราบ');
  await expect(dialog).toContainText('ภูมิภาค / DRM');
  const external = dialog.getByRole('link', { name: /ไปยัง/ });
  await expect(external).toHaveAttribute('href', /^https:\/\//);
  await expect(external).toHaveAttribute('target', '_blank');
  if (testInfo.project.name === 'mobile') await expect(page.locator('.sticky-buy')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  if (testInfo.project.name === 'mobile') await expect(page.locator('.sticky-buy')).toBeVisible();
});

test('reference-aligned Svelte screen baseline', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByTestId('game-card').first()).toBeVisible();
  await expect(page.locator('.hero')).toHaveScreenshot(`home-hero-${testInfo.project.name}.png`, {
    animations: 'disabled'
  });
});
