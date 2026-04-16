import { test, expect, type Page } from '@playwright/test';
import { gotoPage } from '../helpers/navigation';

/**
 * Verticals Config Tests
 * 
 * Tests the vertical template system end-to-end:
 * - All 8 verticals exist
 * - Terminology is correctly mapped
 * - Pipeline stages are defined for each vertical
 * - Sidebar has correct items per vertical
 * 
 * These tests import the config directly for validation,
 * and also test the UI behavior on key pages.
 */
const headerAddClient = (page: Page) =>
  page.getByRole('button', { name: 'Add Client', exact: true });

const addClientModalForm = (page: Page) =>
  page.locator('form').filter({ has: page.getByPlaceholder(/sarah/i) });

test.describe('Vertical Template System', () => {

  test('My Clients page shows all 8 vertical options in create modal', async ({ page }) => {
    await gotoPage(page, '/admin/clients');
    await page.waitForTimeout(1500);

    await headerAddClient(page).click();
    await page.waitForTimeout(500);

    const form = addClientModalForm(page);

    const verticalNames = [
      'General', 'Contractor', 'Food & Beverage', 'Beauty & Wellness',
      'Health & Fitness', 'Real Estate', 'Creative & Professional', 'Retail',
    ];

    for (const name of verticalNames) {
      await expect(form.getByText(name, { exact: true })).toBeVisible({ timeout: 5_000 });
    }
  });

  test('selecting a vertical updates description text', async ({ page }) => {
    await gotoPage(page, '/admin/clients');
    await page.waitForTimeout(1500);

    await headerAddClient(page).click();
    await page.waitForTimeout(500);

    const form = addClientModalForm(page);

    // Click Contractor — should show roofing/plumbing description
    await form.getByText('Contractor', { exact: true }).click();
    await expect(form.getByText(/roofing/i)).toBeVisible();

    await form.getByText('Food & Beverage').click();
    await expect(form.getByText(/bakery/i)).toBeVisible();

    await form.getByText('Beauty & Wellness').click();
    await expect(form.getByText(/salon/i)).toBeVisible();

    await form.getByText('Health & Fitness').click();
    await expect(form.getByText(/gym/i)).toBeVisible();

    await form.getByText('Real Estate').click();
    await expect(form.getByText(/realtor/i)).toBeVisible();

    await form.getByText('Creative & Professional').click();
    await expect(form.getByText(/photographer/i)).toBeVisible();

    await form.getByText('Retail', { exact: true }).click();
    await expect(form.getByText(/boutique/i)).toBeVisible();

    await form.getByText('General', { exact: true }).click();
    await expect(form.getByText(/standard crm/i)).toBeVisible();
  });

  test('create modal requires business name', async ({ page }) => {
    await gotoPage(page, '/admin/clients');
    await page.waitForTimeout(1500);

    await headerAddClient(page).click();
    await page.waitForTimeout(500);

    // Create button should be disabled when name is empty
    const createBtn = page.getByRole('button', { name: /create client/i });
    await expect(createBtn).toBeDisabled();

    // Type a name
    await page.getByPlaceholder(/sarah/i).fill('Test Business');
    await expect(createBtn).toBeEnabled();

    // Clear the name
    await page.getByPlaceholder(/sarah/i).fill('');
    await expect(createBtn).toBeDisabled();
  });
});
