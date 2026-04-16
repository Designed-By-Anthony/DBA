import { test, expect } from '@playwright/test';
import { gotoPage } from '../helpers/navigation';

/**
 * Empty State Tests
 * 
 * Verifies that pages with no data show helpful onboarding CTAs
 * instead of blank screens.
 */
test.describe('Empty State CTAs', () => {

  test('inbox shows onboarding CTA when empty', async ({ page }) => {
    await gotoPage(page, '/admin/inbox');
    await page.waitForTimeout(1500);

    await expect(page.getByRole('heading', { name: /omnichannel inbox/i })).toBeVisible({
      timeout: 10_000,
    });

    // If empty, should show the onboarding message
    const emptyState = page.getByText(/no messages yet/i);
    const hasMessages = page.locator('button').filter({ hasText: /@/ }).first();

    const isEmpty = await emptyState.isVisible().catch(() => false);
    const hasData = await hasMessages.isVisible().catch(() => false);

    // Either state is valid — but we should never see a blank page
    expect(isEmpty || hasData).toBeTruthy();

    if (isEmpty) {
      // Verify the CTA link exists
      await expect(page.getByText(/send your first email/i)).toBeVisible();
    }
  });

  test('email history shows onboarding CTA when empty', async ({ page }) => {
    await gotoPage(page, '/admin/email/history');
    await page.waitForTimeout(2000);

    // Should show the email history UI (heading — avoids strict match with nav link)
    await expect(
      page.getByRole('heading', { name: /email history/i })
    ).toBeVisible({ timeout: 10_000 });

    // If empty, check for the rich empty state
    const emptyState = page.getByText(/no emails sent yet/i);
    const isEmpty = await emptyState.isVisible().catch(() => false);

    if (isEmpty) {
      await expect(
        page.getByRole('link', { name: /compose your first email/i })
      ).toBeVisible();
    }
  });

  test('automations page has a CTA to create rules', async ({ page }) => {
    await gotoPage(page, '/admin/automations');
    await page.waitForTimeout(1500);

    // Should show the Workflow Hub heading
    await expect(page.getByText(/workflow hub/i)).toBeVisible({ timeout: 10_000 });

    // The "Combine Triggers & Actions" button should always be present
    await expect(page.getByText(/combine triggers/i)).toBeVisible();
  });
});
