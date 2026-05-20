// File: e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'Test1234!';
const TEST_NAME = 'ร้านทดสอบ';

test.describe('Authentication', () => {
  test('TC-AUTH-01: redirect to /login when not authenticated', async ({ page }) => {
    await page.goto('/sales');
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-AUTH-02: open redirect blocked — ?next= external URL falls back to /sales', async ({ page }) => {
    await page.goto('/login?next=https://evil.com');
    await page.fill('input[type="email"]', process.env.E2E_EMAIL ?? TEST_EMAIL);
    await page.fill('input[type="password"]', process.env.E2E_PASSWORD ?? TEST_PASSWORD);
    // After login, should land on /sales not evil.com
    // (verify by checking URL stays on localhost)
    await page.click('button[type="submit"]');
    await page.waitForURL(/localhost|127\.0\.0\.1/);
    expect(page.url()).not.toContain('evil.com');
  });

  test('TC-AUTH-03: wrong credentials shows Thai error message', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible();
  });

  test('TC-AUTH-04: empty form submission is prevented by HTML5 validation', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    // Browser validation prevents submission — URL should not change
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-AUTH-05: register page renders and shows all fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="text"]')).toBeVisible();   // displayName
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('TC-AUTH-06: register password minLength=8 enforced by HTML5', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[type="text"]', TEST_NAME);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', '123'); // too short
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/register/);
  });

  test('TC-AUTH-07: displayName maxLength=100 enforced', async ({ page }) => {
    await page.goto('/register');
    const longName = 'ก'.repeat(200);
    await page.fill('input[type="text"]', longName);
    const actual = await page.locator('input[type="text"]').inputValue();
    expect(actual.length).toBeLessThanOrEqual(100);
  });
});
