import { test, expect } from '@playwright/test';

const CONSENT_KEY = 'dba_cookie_consent';

test.describe('Cookie consent banner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate((key) => localStorage.removeItem(key), CONSENT_KEY);
    await page.reload({ waitUntil: 'domcontentloaded' });
  });

  test('appears on first visit', async ({ page }) => {
    const banner = page.locator('#cookie-consent-root');
    await expect(banner).toBeVisible();
  });

  test('dismisses on accept and stays dismissed on reload', async ({ page }) => {
    const banner = page.locator('#cookie-consent-root');
    await expect(banner).toBeVisible();

    await page.locator('#cookie-consent-accept').click();
    await page.waitForTimeout(400);
    await expect(banner).toBeHidden();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    await expect(banner).toBeHidden();
  });
});
