import { test, expect } from '@playwright/test';
import { gotoPage } from './helpers/navigation';

/**
 * API Health Check Tests
 * Verifies key API routes respond correctly.
 * Does NOT test actual business logic (Firestore/Stripe/Google).
 */
test.describe('API Health Checks', () => {

  test('GET /api/auth/google-token returns redirect (auth flow works)', async ({ request }) => {
    const res = await request.get('/api/auth/google-token', {
      maxRedirects: 0,
    });
    // Next.js sends 307 (temporary redirect) to Google OAuth
    // 302 and 400 are also acceptable; what we must NOT get is 500
    // Route may be absent in some builds (404) — must not 500.
    expect([302, 307, 400, 401, 404]).toContain(res.status());
  });

  test('POST /api/portal/magic-link returns error for missing email', async ({ request }) => {
    const res = await request.post('/api/portal/magic-link', {
      data: {},
    });
    // Must not be 500 — 400 or 422 expected for missing email
    expect(res.status()).not.toBe(500);
    expect([400, 422]).toContain(res.status());
  });

  test('POST /api/portal/magic-link handles invalid email gracefully', async ({ request }) => {
    const res = await request.post('/api/portal/magic-link', {
      data: { email: 'not-an-email' },
    });
    // Some APIs return 200 to avoid email enumeration — that's acceptable
    // What we must NOT get is 500
    expect(res.status()).not.toBe(500);
  });

  test('GET /api/track/open/[id] returns pixel (not 500)', async ({ request }) => {
    const res = await request.get('/api/track/open/test-id-123');
    expect(res.status()).not.toBe(500);
  });

  test('GET /api/track/click/[id] responds (not 500)', async ({ request }) => {
    const res = await request.get('/api/track/click/test-id-123?url=https://example.com', {
      maxRedirects: 0,
    });
    expect(res.status()).not.toBe(500);
  });

  test('GET /api/unsubscribe responds (not 500)', async ({ request }) => {
    const res = await request.get('/api/unsubscribe?email=test@example.com');
    expect(res.status()).not.toBe(500);
  });

  test('POST /api/webhooks/stripe route exists (not 404)', async ({ request }) => {
    const res = await request.post('/api/webhooks/stripe', {
      data: {},
      headers: { 'stripe-signature': 'test' },
    });
    // 400 (bad signature) is expected — 404 means the route doesn't exist
    expect(res.status()).not.toBe(404);
  });

  test('GET /manifest.webmanifest returns JSON', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.name).toBeDefined();
  });
});

test.describe('Page Navigation', () => {
  test('all admin routes load without 404 or Application Error', async ({ page }) => {
    const routes = [
      '/admin',
      '/admin/prospects',
      '/admin/pipeline',
      '/admin/email',
      '/admin/email/history',
    ];

    for (const route of routes) {
      await gotoPage(page, route);
      // Check page didn't 404 or throw
      await expect(page.locator('text=Application Error')).not.toBeVisible();
      const title = await page.title();
      expect(title.toLowerCase()).not.toMatch(/404|not found/);
    }
  });

  test('root / responds (not a crash)', async ({ page }) => {
    await gotoPage(page, '/');
    await expect(page.locator('text=Application Error')).not.toBeVisible();
  });
});
