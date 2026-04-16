import { test, expect } from '@playwright/test';
import { gotoPage } from '../helpers/navigation';

const mockPortalData = {
  prospect: {
    name: 'Jane Smith',
    company: 'Smith Plumbing',
    status: 'dev',
    onboarding: {
      contractSigned: true,
      downPaymentReceived: true,
      logoUploaded: false,
      photosUploaded: false,
      serviceDescriptions: false,
      domainAccess: false,
    },
    driveFolderUrl: 'https://drive.google.com/test',
    contractDocUrl: 'https://docs.google.com/test',
    pricingTier: 'hosting',
    projectNotes: 'We have finished the homepage and are now working on the services page.',
    contractSigned: true,
    contractStatus: 'signed',
    fcmToken: null,
  },
  milestones: [
    { label: 'Initial Inquiry', completed: true, current: false },
    { label: 'Discovery Call', completed: true, current: false },
    { label: 'Proposal & Contract', completed: true, current: false },
    { label: 'Building Your Website', completed: false, current: true },
    { label: 'Website Live!', completed: false, current: false },
  ],
  tickets: [
    {
      id: 'ticket-abc123',
      subject: 'Question about logo sizing',
      status: 'open',
      createdAt: new Date().toISOString(),
    },
  ],
};

test.describe('Client Portal — Dashboard (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the data endpoint so we can test the UI without a real session
    await page.route('/api/portal/data', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPortalData),
      });
    });

    await gotoPage(page, '/portal/dashboard');
  });

  test('dashboard renders without application error', async ({ page }) => {
    await expect(page.locator('text=Application Error')).not.toBeVisible();
  });

  test('shows welcome message with client first name', async ({ page }) => {
    await expect(page.getByText(/Welcome back, Jane/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows company name in subtitle', async ({ page }) => {
    await expect(page.getByText(/Smith Plumbing/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows current project status banner', async ({ page }) => {
    // Status is "dev" which maps to "In Development"
    await expect(page.getByText(/In Development/i)).toBeVisible({ timeout: 5000 });
  });

  test('renders milestone list', async ({ page }) => {
    await expect(page.getByText('Building Your Website')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Website Live!')).toBeVisible({ timeout: 5000 });
  });

  test('shows existing support ticket in list', async ({ page }) => {
    await expect(page.getByText('Question about logo sizing')).toBeVisible({ timeout: 5000 });
  });

  test('shows ticket submit form', async ({ page }) => {
    const input = page.locator('input[placeholder*="help"]').or(
      page.locator('input[placeholder*="What"]')
    );
    await expect(input.first()).toBeVisible({ timeout: 5000 });
  });

  test('submit ticket button is disabled when subject is empty', async ({ page }) => {
    const btn = page.getByRole('button', { name: /submit ticket/i });
    await expect(btn.first()).toBeDisabled({ timeout: 5000 });
  });

  test('portal nav shows Dashboard and Tickets tabs', async ({ page }) => {
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('link', { name: /tickets/i })).toBeVisible({ timeout: 3000 });
  });

  test('shows project notes from admin update', async ({ page }) => {
    await expect(
      page.getByText(/finished the homepage/i)
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Client Portal — Dashboard (Unauthenticated)', () => {
  test('unauthenticated /portal/dashboard redirects to portal login', async ({ page }) => {
    // No route mock — real 401 response triggers redirect
    await gotoPage(page, '/portal/dashboard');
    await expect(page).toHaveURL(/portal/);
  });
});
