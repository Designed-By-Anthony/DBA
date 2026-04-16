import { test, expect } from '@playwright/test';
import { gotoPage } from './helpers/navigation';

test.describe('📋 Kanban Board Tests', () => {

  test('Admin: Moving Kanban column updates prospect status in DB', async ({ request, page }) => {
    // 1. Create temporary prospect
    const mockEmail = `kanban-1-${Date.now()}@example.com`;
    const res = await request.post('/api/webhooks/lead', {
      data: { name: 'Kanban Move Test', email: mockEmail, secret: 'dba-lead-hook-2026' }
    });
    const body = await res.json();
    const prospectId = body.prospectId;

    // 2. Auth as Admin to pipeline
    await gotoPage(page, '/admin/pipeline');
    // Wait for the skeleton loaders to disappear
    await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 10000 });

    // 3. Locate card in "New Lead" column
    const card = page.locator('div.p-4.rounded-lg.border', { hasText: 'Kanban Move Test' }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    
    // Select "In Development" (value 'dev')
    await card.locator('select').selectOption('dev');

    // 4. React moves the card to the next column. 
    // We check that the new column's representation has the correct select state
    await page.waitForTimeout(1000); // let React swap the DOM nodes

    // Verify it moved on the server
    await gotoPage(page, `/admin/prospects/${prospectId}`);
    await expect(page.locator('select').first()).toHaveValue('dev');
  });

  test('Admin: Adding quick note saves to prospect timeline', async ({ request, page }) => {
    // 1. Create temporary prospect
    const mockEmail = `kanban-2-${Date.now()}@example.com`;
    const res = await request.post('/api/webhooks/lead', {
      data: { name: 'Kanban Note Test', email: mockEmail, secret: 'dba-lead-hook-2026' }
    });
    const body = await res.json();
    const prospectId = body.prospectId;

    // 2. Auth as Admin, open Prospect detail page
    await gotoPage(page, `/admin/prospects/${prospectId}`);
    await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 10000 });

    // 3. Enter "Quick Note" text and submit
    await page.fill('textarea[placeholder="Add a note about this prospect..."]', 'This is a test E2E note.');
    await page.getByRole('button', { name: 'Add Note' }).click();

    // 4. Verify it populates the timeline UI correctly
    await expect(page.getByText('This is a test E2E note.')).toBeVisible({ timeout: 15000 });
  });

  test('Admin: Deleting prospect removes them from the board completely', async ({ request, page }) => {
    // 1. Create temporary prospect
    const mockEmail = `kanban-3-${Date.now()}@example.com`;
    await request.post('/api/webhooks/lead', {
      data: { name: 'Delete Me Prospect', email: mockEmail, secret: 'dba-lead-hook-2026' }
    });

    // 2. Auth as Admin to pipeline
    await gotoPage(page, '/admin/pipeline');
    await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 10000 });

    // 3. Locate card and click delete icon
    const card = page.locator('div.p-4.rounded-lg.border', { hasText: mockEmail }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    
    // Handle native confirm() dialog explicitly here
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Click the delete button icon inside the card (it's the X button: '×')
    // Dispatch it carefully in case of UI overlays
    await card.getByText('×', { exact: true }).click();
    
    // Wait to ensure dialog logic executed and the data refetched
    await expect(page.locator('div.p-4.rounded-lg.border', { hasText: mockEmail })).toHaveCount(0, { timeout: 10000 });
  });

});
