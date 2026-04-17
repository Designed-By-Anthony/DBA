import { test, expect, type Page } from '@playwright/test';

async function mockTurnstileAsyncError(page: Page): Promise<void> {
  await page.route('**/turnstile/v0/api.js*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: '',
    });
  });

  await page.addInitScript(() => {
    type BrowserWindow = Window &
      Record<string, unknown> & {
        turnstile?: {
          execute: (el: Element) => void;
          reset: () => void;
        };
      };

    const win = window as BrowserWindow;

    try {
      win.localStorage.setItem('dba_cookie_consent', 'rejected');
    } catch {
      /* ignore */
    }

    win.turnstile = {
      execute(el) {
        window.setTimeout(() => {
          const callbackName = el.getAttribute('data-error-callback');
          const callback = callbackName ? win[callbackName] : undefined;
          if (typeof callback === 'function') {
            callback('mock-async-error');
          }
        }, 0);
      },
      reset() {},
    };
  });
}

test.describe('Contact Form', () => {
  test('form renders all required fields', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('[data-audit-form]')).toBeVisible();
    await expect(page.locator('input[name="first_name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="website"]')).toBeVisible();
    await expect(page.locator('textarea[name="biggest_issue"]')).toBeVisible();
  });

  test('invisible Turnstile widget is attached (no visible box)', async ({ page }) => {
    await page.goto('/contact');
    // Turnstile is configured as data-size="invisible": the container is
    // in the DOM but occupies no vertical space. It runs on submit via
    // turnstile.execute(). This test just asserts it's present.
    const turnstile = page.locator('.cf-turnstile');
    await expect(turnstile).toHaveAttribute('data-size', 'invisible');
    await expect(turnstile).toHaveCount(1);
  });

  test('submit button is present and enabled', async ({ page }) => {
    await page.goto('/contact');
    const btn = page.locator('[data-form-submit]');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('Turnstile async errors restore the submit state', async ({ page }) => {
    await mockTurnstileAsyncError(page);
    await page.goto('/contact');

    await page.locator('input[name="first_name"]').fill('Anthony');
    await page.locator('input[name="email"]').fill('anthony@example.com');
    await page.locator('[data-form-submit]').click();

    const btn = page.locator('[data-form-submit]');
    await expect(btn).toBeEnabled();
    await expect(btn).toHaveText('Send Message');
    await expect(page.locator('[data-form-error]')).toContainText('Security check failed');
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
