import { test, expect, type Page } from '@playwright/test';
import { gotoPage } from '../helpers/navigation';

/**
 * My Clients Page Tests
 * 
 * Tests the multi-tenant client management page:
 * - Page renders and shows header
 * - Empty state CTA works
 * - Vertical template picker is present in the create modal
 * - Org cards display correctly
 */
/** Header CTA only — empty state uses "Add Your First Client" (different string avoids strict-mode duplicate). */
const headerAddClientButton = (page: Page) =>
  page.getByRole('button', { name: 'Add Client', exact: true });

/** Create-org modal (avoids matching sidebar / duplicate "General" etc.). */
const addClientModalForm = (page: Page) =>
  page.locator('form').filter({ has: page.getByPlaceholder(/sarah/i) });

async function openAddClientModal(page: Page) {
  const headerBtn = page.getByTestId('clients-add-client-header');
  const emptyBtn = page.getByTestId('clients-add-client-empty');
  if (await emptyBtn.isVisible().catch(() => false)) {
    await emptyBtn.click();
  } else {
    await headerBtn.scrollIntoViewIfNeeded();
    await headerBtn.click();
  }
  await expect(page.getByTestId('clients-add-modal')).toBeVisible({ timeout: 15_000 });
}

test.describe('My Clients Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '/admin/clients');
  });

  test('renders the My Clients page with header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'My Clients' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/manage your client organizations/i)).toBeVisible();
  });

  test('has Add Client button', async ({ page }) => {
    await expect(headerAddClientButton(page)).toBeVisible({ timeout: 10_000 });
  });

  test('Add Client modal opens and contains vertical picker', async ({ page }) => {
    await openAddClientModal(page);

    const form = addClientModalForm(page);

    // Business name input should be present
    await expect(page.getByPlaceholder(/sarah/i)).toBeVisible();

    // Vertical template picker should show all 8 verticals
    await expect(form.getByText('What kind of business?')).toBeVisible();
    await expect(form.getByText('Contractor', { exact: true })).toBeVisible();
    await expect(form.getByText('Food & Beverage')).toBeVisible();
    await expect(form.getByText('Beauty & Wellness')).toBeVisible();
    await expect(form.getByText('Health & Fitness')).toBeVisible();
    await expect(form.getByText('Real Estate')).toBeVisible();
    await expect(form.getByText('Creative & Professional')).toBeVisible();
    await expect(form.getByText('Retail', { exact: true })).toBeVisible();
    await expect(form.getByText('General', { exact: true })).toBeVisible();
  });

  test('vertical picker shows description on selection', async ({ page }) => {
    await openAddClientModal(page);

    const form = addClientModalForm(page);

    // Click on Contractor
    await form.getByText('Contractor', { exact: true }).click();
    await expect(form.getByText(/roofing.*plumbing/i)).toBeVisible();

    // Click on Beauty & Wellness
    await form.getByText('Beauty & Wellness').click();
    await expect(form.getByText(/salon.*spa/i)).toBeVisible();
  });

  test('modal can be closed', async ({ page }) => {
    await openAddClientModal(page);

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByTestId('clients-add-modal')).not.toBeVisible();
  });
});
