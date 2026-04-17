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

  test('invisible Turnstile widget is attached (no visible box)', async ({ page }) => {
    await page.goto('/free-seo-audit');
    const turnstile = page.locator('[data-lh-turnstile]');
    await expect(turnstile).toHaveCount(1);
    await expect(turnstile).toHaveAttribute('data-size', 'invisible');
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

  test('Turnstile async errors restore the audit submit state', async ({ page }) => {
    await mockTurnstileAsyncError(page);
    await page.goto('/free-seo-audit');

    await page.locator('#lh-url').fill('example.com');
    await page.locator('#lh-name').fill('Anthony');
    await page.locator('#lh-company').fill('Designed by Anthony');
    await page.locator('#lh-email').fill('anthony@example.com');
    await page.locator('#lh-location').fill('Syracuse, NY');
    await page.locator('[data-lh-submit]').click();

    const btn = page.locator('[data-lh-submit]');
    await expect(btn).toBeEnabled();
    await expect(btn).toHaveText('Run Free Audit');
    await expect(page.locator('[data-lh-error]')).toContainText('Security check failed');
  });
});
