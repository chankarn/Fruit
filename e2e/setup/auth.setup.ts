// File: e2e/setup/auth.setup.ts
// Run once before E2E suite to save authenticated session
// Usage: npx playwright test e2e/setup/auth.setup.ts
import { test as setup } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error('Set E2E_EMAIL and E2E_PASSWORD environment variables before running E2E tests.');
  }

  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(sales|dashboard)/);

  await page.context().storageState({ path: AUTH_FILE });
});
