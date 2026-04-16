import { test, expect } from '@playwright/test';

const SERVICE_PAGES = [
  { path: '/services/custom-web-design', h1: /Custom Website/i },
  { path: '/services/local-seo', h1: /Local SEO|Search/i },
  { path: '/services/managed-hosting', h1: /Hosting|Fast|Safe/i },
  { path: '/services/website-rescue', h1: /Rescue|Fix|Rebuild/i },
  { path: '/services/ai-automation', h1: /Capture|Lead|Automat/i },
  { path: '/services/workspace-setup', h1: /Legitimate|Workspace/i },
];

test.describe('Service Pages', () => {
  for (const { path, h1 } of SERVICE_PAGES) {
    test(`${path} loads and has correct hero`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveText(h1);
    });
  }

  test('FAQ accordion works on custom-web-design', async ({ page }) => {
    await page.goto('/services/custom-web-design');
    const trigger = page.locator('.faq-trigger').first();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const panel = page.locator('.faq-panel.is-open').first();
    await expect(panel).toBeVisible();
  });

  test('AI automation page has pricing section', async ({ page }) => {
    await page.goto('/services/ai-automation');
    await expect(page.locator('.service-pricing-card').first()).toBeVisible();
  });

  test('Workspace setup page has pricing section', async ({ page }) => {
    await page.goto('/services/workspace-setup');
    await expect(page.locator('.service-pricing-card').first()).toBeVisible();
  });
});
