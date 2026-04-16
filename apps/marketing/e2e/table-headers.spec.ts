import { test, expect } from '@playwright/test';

test('competitor table uses column and row headers', async ({ page }) => {
  await page.goto('/free-seo-audit', { waitUntil: 'domcontentloaded' });

  const headerScopes = await page.locator('.competitor-table thead th').evaluateAll((cells) =>
    cells.map((cell) => cell.getAttribute('scope')),
  );
  expect(headerScopes).toEqual(['col', 'col', 'col']);

  const firstBodyCell = page.locator('.competitor-table tbody tr').first().locator(':scope > *').first();
  await expect(firstBodyCell).toHaveJSProperty('tagName', 'TH');
  await expect(firstBodyCell).toHaveAttribute('scope', 'row');
});
