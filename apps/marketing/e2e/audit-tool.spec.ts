import { test, expect } from '@playwright/test';

test.describe('Audit Tool', () => {
  test('audit form renders all fields', async ({ page }) => {
    await page.goto('/free-seo-audit');
    const form = page.locator('[data-lh-form]');
    await expect(form).toBeVisible();
    await expect(page.locator('#lh-url')).toBeVisible();
    await expect(page.locator('#lh-name')).toBeVisible();
    await expect(page.locator('#lh-company')).toBeVisible();
    await expect(page.locator('#lh-email')).toBeVisible();
    await expect(page.locator('#lh-location')).toBeVisible();
  });

  test('Turnstile widget is present', async ({ page }) => {
    await page.goto('/free-seo-audit');
    await expect(page.locator('[data-lh-turnstile]')).toBeVisible();
  });

  test('submit button text says "Run Free Audit"', async ({ page }) => {
    await page.goto('/free-seo-audit');
    const btn = page.locator('[data-lh-submit]');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText(/Run Free Audit/);
  });

  test('URL input normalizes input', async ({ page }) => {
    await page.goto('/free-seo-audit');
    const urlInput = page.locator('#lh-url');
    await urlInput.fill('example.com');
    expect(await urlInput.inputValue()).toBe('example.com');
  });
});
