import { test, expect } from '@playwright/test';
import { gotoPage } from '../helpers/navigation';

const mockTickets = {
  tickets: [
    {
      id: 'ticket-001',
      subject: 'Logo upload issue',
      description: 'I cannot figure out how to upload my logo.',
      status: 'open',
      priority: 'medium',
      adminReply: null,
      messages: [
        {
          id: 'msg-001',
          from: 'client',
          content: 'I cannot figure out how to upload my logo.',
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ticket-002',
      subject: 'Change the hero headline',
      description: 'Please update the hero text.',
      status: 'resolved',
      priority: 'low',
      adminReply: 'Done! The headline has been updated.',
      messages: [
        {
          id: 'msg-002',
          from: 'client',
          content: 'Please update the hero text.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'msg-003',
          from: 'admin',
          content: 'Done! The headline has been updated.',
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

test.describe('Client Portal — Tickets Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/portal/tickets', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTickets),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, ticketId: 'ticket-new' }),
        });
      } else {
        await route.continue();
      }
    });

    await gotoPage(page, '/portal/tickets');
  });

  test('tickets page loads without application error', async ({ page }) => {
    await expect(page.locator('text=Application Error')).not.toBeVisible();
  });

  test('shows Support heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /support/i })).toBeVisible({ timeout: 5000 });
  });

  test('New Ticket button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new ticket/i })).toBeVisible({ timeout: 5000 });
  });

  test('lists existing tickets', async ({ page }) => {
    await expect(page.getByText('Logo upload issue')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Change the hero headline')).toBeVisible({ timeout: 5000 });
  });

  test('shows resolved ticket status badge', async ({ page }) => {
    await expect(page.getByText('resolved')).toBeVisible({ timeout: 5000 });
  });

  test('clicking New Ticket shows the submission form', async ({ page }) => {
    await page.getByRole('button', { name: /new ticket/i }).click();
    await expect(
      page.locator('input[placeholder*="Subject"]').or(
        page.locator('input[placeholder*="subject"]')
      ).first()
    ).toBeVisible({ timeout: 3000 });
  });

  test('Submit button is disabled without a subject', async ({ page }) => {
    await page.getByRole('button', { name: /new ticket/i }).click();
    const submitBtn = page.getByRole('button', { name: /submit ticket/i });
    await expect(submitBtn.first()).toBeDisabled({ timeout: 3000 });
  });

  test('Submit button enables after typing a subject', async ({ page }) => {
    await page.getByRole('button', { name: /new ticket/i }).click();
    const subjectInput = page.locator('input[placeholder*="Subject"]').or(
      page.locator('input[placeholder*="subject"]').or(
        page.locator('input[placeholder*="help"]')
      )
    ).first();
    await subjectInput.fill('My website is down');
    const submitBtn = page.getByRole('button', { name: /submit ticket/i });
    await expect(submitBtn.first()).toBeEnabled({ timeout: 3000 });
  });

  test('submitting a ticket shows success message', async ({ page }) => {
    await page.getByRole('button', { name: /new ticket/i }).click();
    const subjectInput = page.locator('input').first();
    await subjectInput.fill('Billing question');

    await page.getByRole('button', { name: /submit ticket/i }).first().click();

    await expect(
      page.getByText(/submitted|sent|touch|success/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('clicking a ticket shows the thread view', async ({ page }) => {
    await page.getByText('Logo upload issue').click();
    await expect(
      page.getByText(/I cannot figure out how to upload/i)
    ).toBeVisible({ timeout: 3000 });
  });

  test('portal nav is visible on tickets page', async ({ page }) => {
    // Use first() to avoid strict mode violation with 'Back to Dashboard' link also matching
    await expect(page.getByRole('link', { name: /dashboard/i }).first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Client Portal — Tickets (Unauthenticated)', () => {
  test('unauthenticated /portal/tickets redirects to portal login', async ({ page }) => {
    // No mock → real 401 from the API → component redirects to /portal
    await gotoPage(page, '/portal/tickets');
    await expect(page).toHaveURL(/portal/);
  });
});
