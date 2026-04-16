import { test, expect } from '@playwright/test';
import { gotoPage } from '../helpers/navigation';

/**
 * Sidebar & Vertical Template Tests
 * 
 * Tests that the sidebar renders correctly and adapts
 * to the current org's vertical template.
 */
test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '/admin');
    await page.waitForTimeout(1500);
  });

  test('sidebar renders with all core navigation items', async ({ page }) => {
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    // Core items that appear in ALL verticals
    await expect(sidebar.getByText('Dashboard')).toBeVisible();
    await expect(sidebar.getByText('My Clients')).toBeVisible();
    await expect(sidebar.getByText('Billing')).toBeVisible();
    await expect(sidebar.getByText('Automations')).toBeVisible();
    await expect(sidebar.getByText('Inbox')).toBeVisible();
    await expect(sidebar.getByText('Settings')).toBeVisible();
  });

  test('sidebar has the org brand mark', async ({ page }) => {
    const sidebar = page.locator('aside').first();

    // Logo image (dba-mark) or collapsed brand — not .brand-mark class
    const brandImg = sidebar.locator('img[src*="dba-mark"]').first();
    await expect(brandImg).toBeVisible({ timeout: 10_000 });
  });

  test('sidebar links navigate correctly', async ({ page }) => {
    const sidebar = page.locator('aside').first();

    // Click on My Clients
    await sidebar.getByText('My Clients').click();
    await expect(page).toHaveURL(/clients/);
  });

  test('sidebar collapse toggle works', async ({ page }) => {
    const sidebar = page.locator('aside').first();

    // Sidebar should be expanded by default (width > 200px)
    const initialWidth = await sidebar.evaluate(
      (el) => (el as HTMLElement).offsetWidth,
    );
    expect(initialWidth).toBeGreaterThan(200);

    // Click the collapse button (in the footer)
    const collapseBtn = page.locator('aside button:has(svg)').filter({ hasText: /collapse/i }).first();
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();
      await page.waitForTimeout(400); // transition
      const newWidth = await sidebar.evaluate(
        (el) => (el as HTMLElement).offsetWidth,
      );
      expect(newWidth).toBeLessThan(100);
    }
  });

  test('sign out button is present', async ({ page }) => {
    const sidebar = page.locator('aside').first();
    await expect(sidebar.getByText('Sign Out')).toBeVisible({ timeout: 10_000 });
  });
});
