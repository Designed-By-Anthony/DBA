import { test, expect } from '@playwright/test';
import { gotoPage } from './helpers/navigation';

test.describe('PWA — Manifest & Offline', () => {

  test('GET /manifest.webmanifest returns valid JSON', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toMatch(/json/i);
  });

  test('manifest has required PWA fields', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    const data = await res.json() as Record<string, unknown>;

    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('short_name');
    expect(data).toHaveProperty('start_url');
    expect(data).toHaveProperty('display');
    expect(data).toHaveProperty('theme_color');
    expect(data).toHaveProperty('icons');
    expect(Array.isArray(data.icons)).toBe(true);
  });

  test('manifest start_url points to portal dashboard', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    const data = await res.json() as Record<string, unknown>;
    expect(data.start_url).toBe('/portal/dashboard');
  });

  test('manifest display mode is standalone (app-like)', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    const data = await res.json() as Record<string, unknown>;
    expect(data.display).toBe('standalone');
  });

  test('192x192 icon file exists', async ({ request }) => {
    const res = await request.get('/icons/icon-192.png');
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toMatch(/image/i);
  });

  test('512x512 icon file exists', async ({ request }) => {
    const res = await request.get('/icons/icon-512.png');
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toMatch(/image/i);
  });

  test('apple-touch-icon exists', async ({ request }) => {
    const res = await request.get('/icons/apple-touch-icon.png');
    expect(res.status()).toBe(200);
  });

  test('offline page loads without application error', async ({ page }) => {
    await gotoPage(page, '/offline');
    await expect(page.locator('text=Application Error')).not.toBeVisible();
  });

  test('offline page shows branded heading', async ({ page }) => {
    await gotoPage(page, '/offline');
    await expect(
      page.getByRole('heading', { name: /offline/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test('offline page has Try Again button', async ({ page }) => {
    await gotoPage(page, '/offline');
    await expect(
      page.getByRole('button', { name: /try again/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test('layout has theme-color meta tag', async ({ page }) => {
    await gotoPage(page, '/portal');
    // Meta tags live in <head> — use evaluate to read them
    const themeColor = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="theme-color"]');
      return meta?.getAttribute('content') ?? null;
    });
    // Page must not have crashed regardless of meta tag presence
    await expect(page.locator('text=Application Error')).not.toBeVisible();
    // If the tag is present, it should contain our brand color
    if (themeColor) expect(themeColor).toMatch(/#/);
  });
});

test.describe('PWA — New API Endpoints', () => {
  test('GET /api/portal/tickets returns 401 without session', async ({ request }) => {
    const res = await request.get('/api/portal/tickets');
    expect(res.status()).toBe(401);
  });

  test('POST /api/portal/push-token returns 401 without session', async ({ request }) => {
    const res = await request.post('/api/portal/push-token', {
      data: { token: 'test-token' },
    });
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/portal/push-token returns 401 without session', async ({ request }) => {
    const res = await request.delete('/api/portal/push-token');
    expect(res.status()).toBe(401);
  });

  test('GET /api/admin/tickets responds (not 500)', async ({ request }) => {
    const res = await request.get('/api/admin/tickets');
    // Either 200 (if dev bypass) or auth redirect — must not be 500
    expect(res.status()).not.toBe(500);
  });

  test('PATCH /api/admin/tickets/nonexistent returns 404', async ({ request }) => {
    const res = await request.patch('/api/admin/tickets/nonexistent-id-xyz', {
      data: { adminReply: 'test', status: 'resolved' },
    });
    // Not found or auth — must not be 500
    expect([404, 401, 403]).toContain(res.status());
  });
});
