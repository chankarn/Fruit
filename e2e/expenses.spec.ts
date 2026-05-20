// File: e2e/expenses.spec.ts
import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Expenses Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/expenses');
    await page.waitForLoadState('networkidle');
  });

  test('TC-EXP-01: page loads with correct section labels', async ({ page }) => {
    await expect(page.getByText('ซื้อสินค้าเข้าร้าน')).toBeVisible();
    await expect(page.getByText('รายจ่ายอื่นๆ')).toBeVisible();
  });

  test('TC-EXP-02: grand total = itemsTotal + extrasTotal (not minus)', async ({ page }) => {
    // Fill purchase item: 10 kg × ฿100 = 1000
    const nameInput = page.locator('input[placeholder="เลือก / พิมพ์ชื่อสินค้า"]').first();
    await nameInput.fill('ทุเรียน');
    await page.locator('input[placeholder="0.00"]').first().fill('10');
    await page.locator('input[placeholder="0.00"]').nth(1).fill('100');

    // Fill extra: ฿200
    await page.locator('input[placeholder="0.00"]').last().fill('200');

    // Total = 1000 + 200 = 1200 (not 800)
    const stickyBar = page.locator('.fixed').filter({ hasText: 'รวมรายจ่ายวันนี้' });
    await expect(stickyBar.getByText('฿1,200.00')).toBeVisible();
  });

  test('TC-EXP-03: total label shows รวมรายจ่ายวันนี้ (not รายรับ)', async ({ page }) => {
    await expect(page.getByText('รวมรายจ่ายวันนี้')).toBeVisible();
    await expect(page.getByText('เงินสดสุทธิวันนี้')).not.toBeVisible();
  });

  test('TC-EXP-04: save success shows dialog with total', async ({ page }) => {
    const nameInput = page.locator('input[placeholder="เลือก / พิมพ์ชื่อสินค้า"]').first();
    await nameInput.fill('มะม่วงดิบ');
    await page.locator('input[placeholder="0.00"]').first().fill('3');
    await page.locator('input[placeholder="0.00"]').nth(1).fill('30');
    await page.getByRole('button', { name: 'บันทึก' }).click();
    await expect(page.getByText('บันทึกสำเร็จ!')).toBeVisible({ timeout: 10000 });
    // Should show the total amount in the dialog
    await expect(page.getByText('รวมรายจ่ายวันนี้')).toBeVisible();
  });

  test('TC-EXP-05: success dialog closes on ตกลง click', async ({ page }) => {
    const nameInput = page.locator('input[placeholder="เลือก / พิมพ์ชื่อสินค้า"]').first();
    await nameInput.fill('แตงโม');
    await page.locator('input[placeholder="0.00"]').first().fill('2');
    await page.locator('input[placeholder="0.00"]').nth(1).fill('20');
    await page.getByRole('button', { name: 'บันทึก' }).click();
    await page.getByRole('button', { name: 'ตกลง' }).click();
    await expect(page.getByText('บันทึกสำเร็จ!')).not.toBeVisible();
  });

  test('TC-EXP-06: success dialog closes on backdrop click', async ({ page }) => {
    const nameInput = page.locator('input[placeholder="เลือก / พิมพ์ชื่อสินค้า"]').first();
    await nameInput.fill('สตรอเบอรี่');
    await page.locator('input[placeholder="0.00"]').first().fill('1');
    await page.locator('input[placeholder="0.00"]').nth(1).fill('150');
    await page.getByRole('button', { name: 'บันทึก' }).click();
    await expect(page.getByText('บันทึกสำเร็จ!')).toBeVisible({ timeout: 10000 });
    // Click outside the dialog card
    await page.locator('.fixed.inset-0').first().click({ position: { x: 10, y: 10 } });
    await expect(page.getByText('บันทึกสำเร็จ!')).not.toBeVisible();
  });

  test('TC-EXP-07: description maxLength=500 enforced at input', async ({ page }) => {
    const descInput = page.locator('input[placeholder*="ค่าเช่า"]');
    await descInput.fill('ก'.repeat(600));
    const value = await descInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(500);
  });
});
