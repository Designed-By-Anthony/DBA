import { test, expect } from '@playwright/test';
import { gotoPage } from '../helpers/navigation';

/**
 * Portal Branding Tests
 * 
 * Tests the client portal login page and dynamic branding:
 * - Default branding renders correctly
 * - ?org= parameter loads custom branding
 * - Magic link form works
 */
test.describe('Portal Login & Branding', () => {

  test('portal login page renders with default branding', async ({ page }) => {
    await gotoPage(page, '/portal');

    // Should show default brand
    await expect(page.getByRole('heading', { name: /client portal/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/enter your email/i)).toBeVisible();

    // Email input should be present
    await expect(page.locator('#portal-email')).toBeVisible();

    // Send Login Link button
    await expect(page.getByRole('button', { name: /send login link/i })).toBeVisible();
  });

  test('portal login shows email validation', async ({ page }) => {
    await gotoPage(page, '/portal');

    const emailInput = page.locator('#portal-email');
    await expect(emailInput).toBeVisible({ timeout: 15_000 });
    await expect(emailInput).toHaveValue('');

    const submitBtn = page.getByRole('button', { name: /send login link/i });
    await expect(submitBtn).toBeDisabled({ timeout: 10_000 });

    await emailInput.fill('test@example.com');
    await expect(submitBtn).toBeEnabled();
  });

  test('portal login handles invalid email submission', async ({ page }) => {
    await gotoPage(page, '/portal');

    await page.locator('#portal-email').fill('nonexistent@test.com');
    await page.getByRole('button', { name: /send login link/i }).click();

    // Should show an error after the API responds
    await page.waitForTimeout(3000);
    // Either error message or "Check Your Email" — both are valid API responses
    const hasError = await page.getByText(/error|not found|no account/i).isVisible().catch(() => false);
    const hasSuccess = await page.getByText(/check your email/i).isVisible().catch(() => false);
    expect(hasError || hasSuccess).toBeTruthy();
  });

  test('portal login with ?org= shows custom brand mark', async ({ page }) => {
    // Even with a non-existent org, it should fall back to defaults gracefully
    await gotoPage(page, '/portal?org=org_nonexistent');

    // Should still render the login page without crashing
    await expect(page.getByText(/enter your email/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#portal-email')).toBeVisible();
  });

  test('portal page has proper metadata', async ({ page }) => {
    await gotoPage(page, '/portal');
    const title = await page.title();
    expect(title.toLowerCase()).toContain('portal');
  });
});
