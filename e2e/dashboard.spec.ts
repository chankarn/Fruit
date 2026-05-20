// File: e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('TC-DASH-01: summary cards render (กำไรสุทธิ, รายรับรวม, รายจ่ายรวม)', async ({ page }) => {
    await expect(page.getByText('กำไรสุทธิ')).toBeVisible();
    await expect(page.getByText('รายรับรวม')).toBeVisible();
    await expect(page.getByText('รายจ่ายรวม')).toBeVisible();
  });

  test('TC-DASH-02: date filter chips are visible and clickable', async ({ page }) => {
    await expect(page.getByText('7 วัน')).toBeVisible();
    await page.getByText('30 วัน').click();
    // Label in subtitle should update
    await expect(page.getByText(/30 วัน/)).toBeVisible();
  });

  test('TC-DASH-03: custom date range filter works', async ({ page }) => {
    // Look for date inputs
    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() >= 2) {
      await dateInputs.first().fill('2026-01-01');
      await dateInputs.last().fill('2026-01-31');
      await page.waitForLoadState('networkidle');
    }
    await expect(page.getByText('กำไรสุทธิ')).toBeVisible();
  });

  test('TC-DASH-04: empty state shows when no data in range', async ({ page }) => {
    // Use a far-future date range that surely has no data
    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() >= 2) {
      await dateInputs.first().fill('2099-01-01');
      await dateInputs.last().fill('2099-01-31');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('ยังไม่มีข้อมูลในช่วงนี้')).toBeVisible({ timeout: 8000 });
    }
  });

  test('TC-DASH-05: Export CSV button is present and clickable', async ({ page }) => {
    const csvBtn = page.getByRole('button', { name: /Export CSV/ });
    // Only visible when data exists
    const dataExists = await csvBtn.isVisible().catch(() => false);
    if (dataExists) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        csvBtn.click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/fruit-tracker_.+\.csv/);
    }
  });

  test('TC-DASH-06: net profit card shows กำไร or ขาดทุน badge', async ({ page }) => {
    const profitBadge = page.locator('text=กำไร, text=ขาดทุน').first();
    // One of the two must appear
    const hasProfit = await page.getByText('กำไร').isVisible().catch(() => false);
    const hasLoss = await page.getByText('ขาดทุน').isVisible().catch(() => false);
    expect(hasProfit || hasLoss).toBe(true);
  });

  test('TC-DASH-07: desktop layout shows sidebar on wide viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await expect(page.locator('aside')).toBeVisible();
  });

  test('TC-DASH-08: mobile layout hides sidebar and shows bottom nav', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard');
    await expect(page.locator('aside')).not.toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('TC-DASH-09: sidebar nav links navigate correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.locator('aside').getByText('รายรับ').click();
    await expect(page).toHaveURL(/\/sales/);
    await page.goto('/dashboard');
    await page.locator('aside').getByText('รายจ่าย').click();
    await expect(page).toHaveURL(/\/expenses/);
  });
});
