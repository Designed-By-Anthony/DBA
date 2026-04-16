import { test, expect } from '@playwright/test';
import { dismissCookieConsentIfPresent } from './helpers';

test.describe('Mobile UX', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('sticky CTA bar is visible on mobile', async ({ page }) => {
    await page.goto('/');
    await dismissCookieConsentIfPresent(page);
    const stickyBar = page.locator('#reachOutSticky');
    await expect(stickyBar).toBeVisible();
  });

  test('sticky bar opens reach-out modal with contact, call, email, and Calendly', async ({ page }) => {
    await page.goto('/');
    await dismissCookieConsentIfPresent(page);
    const stickyBar = page.locator('#reachOutSticky');
    await expect(stickyBar.locator('#reachOutOpenBtn')).toBeVisible();
    await stickyBar.locator('#reachOutOpenBtn').click();
    const dialog = page.locator('#reachOutModal');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('a[href="/contact"]')).toBeVisible();
    await expect(dialog.locator('a[href="tel:+13159225592"]')).toBeVisible();
    await expect(dialog.locator('a[href*="mailto:anthony@designedbyanthony.com"]')).toBeVisible();
    await expect(dialog.locator('#reachOutCalendlyBtn')).toBeVisible();

    await dialog.locator('#reachOutCalendlyBtn').click();
    const calModal = page.locator('#layoutCalendlyModal');
    await expect(calModal).toBeVisible();
    await expect(calModal.locator('iframe[src*="calendly.com"]')).toBeVisible({ timeout: 20_000 });
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/');
    await dismissCookieConsentIfPresent(page);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
});

test.describe('Desktop UX', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('reach-out sticky bar is visible on desktop', async ({ page }) => {
    await page.goto('/');
    await dismissCookieConsentIfPresent(page);
    const stickyBar = page.locator('#reachOutSticky');
    await expect(stickyBar).toBeVisible();
  });
});
