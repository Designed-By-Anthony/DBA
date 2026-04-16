import { test, expect } from '@playwright/test';
import { gotoPage } from '../helpers/navigation';

// Big Push Architectural Spec — Verification of the 2026 Agentic CRM Features

test.describe('Agentic CRM: The Big Push Features', () => {
  test('Command Palette (Cmd+K) mounts globally', async ({ page }) => {
    await gotoPage(page, '/admin');
    await page.locator('body').click();

    // Lowercase `k` — Playwright `Meta+K` (uppercase) implies Shift and yields e.key "K", which CommandPalette ignored.
    const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${mod}+k`);

    const cmdInput = page.getByPlaceholder(/Search prospects or type/);
    await expect(cmdInput).toBeVisible();

    await cmdInput.fill('> Compose Email');
    await expect(page.getByText('Compose Email').first()).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(cmdInput).not.toBeVisible();
  });

  test('Notion-Style Visual Automation Hub mounts properly', async ({ page }) => {
    await gotoPage(page, '/admin/automations');

    await expect(page.getByText('Workflow Hub')).toBeVisible();

    await expect(page.getByText(/Zero-friction automation/)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Combine Triggers & Actions/ })
    ).toBeVisible();
  });

  test('Omnichannel Shared Inbox mounts with structural integrity', async ({ page }) => {
    await gotoPage(page, '/admin/inbox');

    await expect(page.getByText('Omnichannel Inbox')).toBeVisible();

    const emptyUI = page.getByText('Select a message stream to begin.');
    await expect(emptyUI).toBeVisible();
  });
});
