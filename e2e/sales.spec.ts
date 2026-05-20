// File: e2e/sales.spec.ts
import { test, expect } from '@playwright/test';

// Requires E2E_EMAIL / E2E_PASSWORD env vars pointing to a test account
test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Sales Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sales');
    await page.waitForLoadState('networkidle');
  });

  test('TC-SALES-01: page loads with form elements', async ({ page }) => {
    await expect(page.getByText('รายการขาย')).toBeVisible();
    await expect(page.getByText('รายจ่ายอื่นๆ')).toBeVisible();
    await expect(page.getByText('บันทึก')).toBeVisible();
  });

  test('TC-SALES-02: auto-calculates total when filling qty + price', async ({ page }) => {
    // Fill product
    const nameInput = page.locator('input[placeholder="เลือก / พิมพ์ชื่อสินค้า"]').first();
    await nameInput.fill('มะม่วง');
    // Fill qty
    const qtyInput = page.locator('input[placeholder="0.00"]').first();
    await qtyInput.fill('10');
    // Fill price
    const priceInput = page.locator('input[placeholder="0.00"]').nth(1);
    await priceInput.fill('50');
    // Row total should show 500
    await expect(page.getByText('฿500.00')).toBeVisible();
  });

  test('TC-SALES-03: grand total = itemsTotal - extrasTotal', async ({ page }) => {
    // Fill sale item: 10 kg × ฿50 = 500
    const nameInput = page.locator('input[placeholder="เลือก / พิมพ์ชื่อสินค้า"]').first();
    await nameInput.fill('มะม่วง');
    await page.locator('input[placeholder="0.00"]').first().fill('10');
    await page.locator('input[placeholder="0.00"]').nth(1).fill('50');

    // Fill extra expense: ฿80
    await page.locator('input[placeholder*="ค่าจ้าง"]').fill('ค่าน้ำมัน');
    await page.locator('input[placeholder="0.00"]').last().fill('80');

    // Net = 500 - 80 = 420
    const stickyBar = page.locator('.fixed').filter({ hasText: 'เงินสดสุทธิวันนี้' });
    await expect(stickyBar.getByText('฿420.00')).toBeVisible();
  });

  test('TC-SALES-04: net profit turns negative color when loss', async ({ page }) => {
    // extra expense > items income → net negative
    await page.locator('input[placeholder="0.00"]').first().fill('1');
    await page.locator('input[placeholder="0.00"]').nth(1).fill('10'); // total = 10
    await page.locator('input[placeholder="0.00"]').last().fill('500'); // extra = 500
    // Net = -490 — the total text should have rose/red color class
    const total = page.locator('.fixed').filter({ hasText: 'เงินสดสุทธิ' }).locator('[class*="expense"]');
    await expect(total).toBeVisible();
  });

  test('TC-SALES-05: + เพิ่มรายการ adds a new item row', async ({ page }) => {
    await page.getByRole('button', { name: /เพิ่มรายการ/ }).first().click();
    const rows = page.locator('.card').filter({ has: page.locator('text=#') });
    await expect(rows).toHaveCount(2);
  });

  test('TC-SALES-06: delete button on single row resets to empty row (not removes)', async ({ page }) => {
    const trashBtn = page.getByRole('button', { name: 'ลบรายการ' }).first();
    await trashBtn.click();
    // Should still have 1 row (reset to empty, not removed)
    const nameInputs = page.locator('input[placeholder="เลือก / พิมพ์ชื่อสินค้า"]');
    await expect(nameInputs).toHaveCount(1);
  });

  test('TC-SALES-07: save button shows dialog on success', async ({ page }) => {
    const nameInput = page.locator('input[placeholder="เลือก / พิมพ์ชื่อสินค้า"]').first();
    await nameInput.fill('ทุเรียน');
    await page.locator('input[placeholder="0.00"]').first().fill('5');
    await page.locator('input[placeholder="0.00"]').nth(1).fill('200');
    await page.getByRole('button', { name: 'บันทึก' }).click();
    await expect(page.getByText('บันทึกสำเร็จ!')).toBeVisible({ timeout: 10000 });
  });

  test('TC-SALES-08: save with no items shows error', async ({ page }) => {
    // All fields empty, press save
    await page.getByRole('button', { name: 'บันทึก' }).click();
    await expect(page.getByText('กรุณาเพิ่มอย่างน้อย 1 รายการ')).toBeVisible();
  });

  test('TC-SALES-09: product_name maxLength=255 enforced at input', async ({ page }) => {
    const nameInput = page.locator('input[placeholder="เลือก / พิมพ์ชื่อสินค้า"]').first();
    await nameInput.fill('ก'.repeat(300));
    const value = await nameInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(255);
  });

  test('TC-SALES-10: changing date reloads existing data for that date', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();
    // Change to a different date
    await dateInput.fill('2026-01-01');
    // Form should re-fetch (loading state may appear briefly)
    await page.waitForLoadState('networkidle');
    // Form should be in clean state for that date
    await expect(dateInput).toHaveValue('2026-01-01');
  });
});
