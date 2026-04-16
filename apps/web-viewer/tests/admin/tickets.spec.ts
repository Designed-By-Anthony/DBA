import { test, expect } from '@playwright/test';
import { gotoPage } from '../helpers/navigation';

const mockAdminTickets = [
  {
    id: 'ticket-001',
    prospectId: 'prospect-abc',
    prospectName: 'Jane Smith',
    subject: 'Logo upload question',
    description: 'How do I upload my logo?',
    status: 'open',
    priority: 'medium',
    adminReply: null,
    messages: [
      {
        id: 'msg-1',
        from: 'client',
        content: 'How do I upload my logo?',
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ticket-002',
    prospectId: 'prospect-abc',
    prospectName: 'Jane Smith',
    subject: 'Change homepage headline',
    description: 'Please update the heading text.',
    status: 'resolved',
    priority: 'low',
    adminReply: 'Updated — please check the latest version.',
    messages: [
      { id: 'msg-2', from: 'client', content: 'Please update the heading text.', createdAt: new Date().toISOString() },
      { id: 'msg-3', from: 'admin', content: 'Updated — please check the latest version.', createdAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

test.describe('Admin — Tickets', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/admin/tickets', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAdminTickets),
      });
    });

    await page.route('/api/admin/tickets/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await gotoPage(page, '/admin/tickets');
  });

  test('admin tickets page loads without application error', async ({ page }) => {
    await expect(page.locator('text=Application Error')).not.toBeVisible();
  });

  test('shows Support Tickets heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /support tickets/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows total tickets count', async ({ page }) => {
    await expect(page.getByText(/total/i)).toBeVisible({ timeout: 5000 });
  });

  test('lists both tickets in the sidebar', async ({ page }) => {
    await expect(page.getByText('Logo upload question')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Change homepage headline')).toBeVisible({ timeout: 5000 });
  });

  test('shows open status badge', async ({ page }) => {
    await expect(page.getByText('open').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows resolved status badge', async ({ page }) => {
    await expect(page.getByText('resolved').first()).toBeVisible({ timeout: 5000 });
  });

  test('filter buttons are visible', async ({ page }) => {
    // Labels come from filter keys + CSS capitalize (all | open | in_progress | resolved).
    await expect(page.getByRole('button', { name: /^all$/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /^open$/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /in progress/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /^resolved$/i })).toBeVisible({ timeout: 5000 });
  });

  test('clicking a ticket shows the detail panel', async ({ page }) => {
    await page.getByText('Logo upload question').click();

    // Thread + reply form should appear
    await expect(
      page.getByPlaceholder(/reply|type your reply/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('reply textarea accepts input', async ({ page }) => {
    await page.getByText('Logo upload question').click();
    const textarea = page.getByPlaceholder(/reply|type your reply/i);
    await textarea.fill('You can upload via the Google Drive link we sent you.');
    await expect(textarea).toHaveValue(/Google Drive/i);
  });

  test('Send Reply button is disabled without text', async ({ page }) => {
    await page.getByText('Logo upload question').click();
    const sendBtn = page.getByRole('button', { name: /send reply/i });
    await expect(sendBtn).toBeDisabled({ timeout: 5000 });
  });

  test('Send Reply button enables after typing', async ({ page }) => {
    await page.getByText('Logo upload question').click();
    const textarea = page.getByPlaceholder(/reply|type your reply/i);
    await textarea.fill('Here is how you can upload your logo...');
    const sendBtn = page.getByRole('button', { name: /send reply/i });
    await expect(sendBtn).toBeEnabled({ timeout: 3000 });
  });

  test('status dropdown is visible in detail panel', async ({ page }) => {
    await page.getByText('Logo upload question').click();
    await expect(page.getByRole('combobox')).toBeVisible({ timeout: 5000 });
  });

  test('filter by open hides resolved tickets', async ({ page }) => {
    await page.getByRole('button', { name: 'Open' }).click();
    await expect(page.getByText('Logo upload question')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Change homepage headline')).not.toBeVisible();
  });

  test('filter by resolved hides open tickets', async ({ page }) => {
    await page.getByRole('button', { name: 'Resolved' }).click();
    await expect(page.getByText('Change homepage headline')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Logo upload question')).not.toBeVisible();
  });
});
