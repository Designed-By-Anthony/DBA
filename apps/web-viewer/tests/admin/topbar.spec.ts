import { test, expect } from '@playwright/test';
import { gotoPage } from '../helpers/navigation';

/**
 * Notification & TopBar Tests
 * 
 * Tests the notification bell, org context display,
 * and greeting in the top bar.
 */
test.describe('TopBar & Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '/admin');
    await page.waitForTimeout(1500);
  });

  test('top bar renders with greeting', async ({ page }) => {
    // Should show a time-based greeting
    const greeting = page.getByText(/good (morning|afternoon|evening)/i);
    await expect(greeting).toBeVisible({ timeout: 10_000 });
  });

  test('notification bell is present and clickable', async ({ page }) => {
    const bellBtn = page.getByRole('button', { name: 'Notifications' }).first();
    await expect(bellBtn).toBeVisible({ timeout: 10_000 });
    await bellBtn.click();
    await expect(page.getByText('View All Activity')).toBeVisible({ timeout: 10_000 });
  });

  test('mobile menu toggle works', async ({ page, viewport }) => {
    // Only relevant on mobile-sized viewports
    if (viewport && viewport.width < 1024) {
      const menuBtn = page.locator('button:has(svg.lucide-menu)').first();
      if (await menuBtn.isVisible()) {
        await menuBtn.click();
        await page.waitForTimeout(500);
        
        // Sidebar should become visible
        const sidebar = page.locator('aside').first();
        await expect(sidebar).toBeVisible();
      }
    }
  });
});
