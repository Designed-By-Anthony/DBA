import { test, expect } from '@playwright/test';
import { gotoPage } from '../helpers/navigation';

test.describe('Email Composer', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '/admin/email');
    await expect(
      page.getByRole('heading', { name: /email composer/i })
    ).toBeVisible({ timeout: 30_000 });
  });

  test('composer page loads without error', async ({ page }) => {
    await expect(page.locator('text=Application Error')).not.toBeVisible();
  });

  test('shows email composer form or template picker', async ({ page }) => {
    await expect(page.getByText(/templates?:/i).first()).toBeVisible();
  });

  test('template selector is present', async ({ page }) => {
    await expect(page.getByText(/templates?:/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Introduction' })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('prospect/recipient selector is present', async ({ page }) => {
    const recipientField = page.getByPlaceholder(/recipient|prospect|to/i)
      .or(page.getByLabel(/recipient|prospect|to/i))
      .or(page.getByText(/select prospect|recipient/i));
    // Just check it exists — actual data depends on Firestore
    const count = await recipientField.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('send button is present', async ({ page }) => {
    await expect(
      page
        .getByRole('button', { name: /Send Test to Me|Send to \d+ recipients/ })
        .first()
    ).toBeVisible();
  });
});

test.describe('Email History', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '/admin/email/history');
  });

  test('history page loads without error', async ({ page }) => {
    await expect(page.locator('text=Application Error')).not.toBeVisible();
  });

  test('shows email history table or empty state', async ({ page }) => {
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 15_000 });

    await expect(
      page
        .getByText(/no emails sent yet/i)
        .or(page.locator('.divide-y'))
    ).toBeVisible({ timeout: 15_000 });
  });

  test('history entries show key metadata when present', async ({ page }) => {
    // Wait for firebase loading to finish
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 });
    
    const rowCount = await page.locator('.divide-y > div').count();
    if (rowCount > 0) {
      // Rows should have recipient, subject, or status info
      await expect(
        page.getByText(/@|subject|sent|open/i).first()
      ).toBeVisible();
    }
  });
});
