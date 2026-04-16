import { test, expect } from '@playwright/test';

test('competitor table includes an accessible caption', async ({ page }) => {
  await page.goto('/free-seo-audit', { waitUntil: 'domcontentloaded' });

  const caption = page.locator('.competitor-table caption');
  await expect(caption).toHaveCount(1);
  await expect(caption).toHaveText(/local competitor comparison/i);
});
