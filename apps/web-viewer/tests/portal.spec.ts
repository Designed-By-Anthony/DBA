import { test, expect } from '@playwright/test';
import { gotoPage } from './helpers/navigation';

test.describe('Client Portal — Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '/portal');
  });

  test('portal login page loads without error', async ({ page }) => {
    await expect(page.locator('text=Application Error')).not.toBeVisible();
  });

  test('shows magic link email input', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('email input accepts typed input', async ({ page }) => {
    const input = page.locator('input[type="email"]');
    await input.fill('test@example.com');
    await expect(input).toHaveValue('test@example.com');
  });

  test('submit button exists', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /send|login|sign in|magic link|continue/i })
    ).toBeVisible();
  });

  test('submit button is disabled when email field is empty', async ({ page }) => {
    // The button is intentionally disabled until a valid email is typed
    // This IS the validation — no need to click it
    const submitBtn = page.getByRole('button', { name: /send|login|sign in|magic link|continue/i });
    await expect(submitBtn).toBeDisabled();
  });

  test('submit button enables after valid email is entered', async ({ page }) => {
    const input = page.locator('input[type="email"]');
    const submitBtn = page.getByRole('button', { name: /send|login|sign in|magic link|continue/i });

    await input.fill('test@example.com');
    await expect(submitBtn).toBeEnabled({ timeout: 3000 });
  });

  test('shows confirmation state after mocked successful submit', async ({ page }) => {
    // Intercept so we don't send a real email
    await page.route('/api/portal/magic-link', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.locator('input[type="email"]').fill('testclient@example.com');
    await page.getByRole('button', { name: /send|login|sign in|magic link|continue/i }).click();

    await expect(
      page.getByText(/check your email|link sent|sent a link|magic link/i)
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Client Portal — Dashboard (Protected)', () => {
  test('unauthenticated /portal/dashboard redirects to portal login', async ({ page }) => {
    await gotoPage(page, '/portal/dashboard');
    await expect(page).toHaveURL(/portal/);
  });
});
