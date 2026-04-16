import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test('form renders all required fields', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('[data-audit-form]')).toBeVisible();
    await expect(page.locator('input[name="first_name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="website"]')).toBeVisible();
    await expect(page.locator('textarea[name="biggest_issue"]')).toBeVisible();
  });

  test('Turnstile widget iframe loads', async ({ page }) => {
    await page.goto('/contact');
    // Turnstile renders as an iframe inside .cf-turnstile
    const turnstile = page.locator('.cf-turnstile');
    await expect(turnstile).toBeVisible();
  });

  test('submit button is present and enabled', async ({ page }) => {
    await page.goto('/contact');
    const btn = page.locator('[data-form-submit]');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });
});

test.describe('Contact Page Calendly', () => {
  test('Calendly modal opens and injects iframe', async ({ page }) => {
    await page.goto('/contact');
    await page.locator('#calendlyOpenBtn').click();
    const modal = page.locator('#calendlyModal');
    await expect(modal).toBeVisible();

    const calendlyFrame = page.locator('#calendlyModalBody iframe');
    await expect(calendlyFrame).toBeVisible();
    await expect(calendlyFrame).toHaveAttribute('src', /calendly\.com/);
  });
});
