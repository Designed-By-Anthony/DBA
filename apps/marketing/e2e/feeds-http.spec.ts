import { test, expect } from '@playwright/test';

test.describe('RSS and release feeds', () => {
  test('blog rss.xml is valid RSS with items', async ({ request }) => {
    const response = await request.get('/rss.xml');
    expect(response.ok(), '/rss.xml should return 200').toBeTruthy();
    const type = response.headers()['content-type'] ?? '';
    expect(type).toMatch(/xml|rss/i);

    const body = await response.text();
    expect(body).toContain('<rss');
    expect(body).toContain('<channel>');
    expect(body).toMatch(/<item>/);
    expect(body).toContain('mobile-first-seo');
  });

  test('releases.xml lists portfolio work', async ({ request }) => {
    const response = await request.get('/releases.xml');
    expect(response.ok(), '/releases.xml should return 200').toBeTruthy();
    const body = await response.text();
    expect(body).toContain('<rss');
    expect(body).toContain('<item>');
  });
});

test.describe('HTTP behavior', () => {
  test('legacy central-ny service area redirects to Rome (Firebase Hosting)', async ({ request }) => {
    const response = await request.get('/service-areas/central-ny', { maxRedirects: 0 });
    test.skip(
      response.status() === 404,
      'firebase.json redirects run on Firebase Hosting only; astro preview returns 404 for this path.',
    );
    expect(response.status()).toBe(301);
    const loc = response.headers()['location'] ?? '';
    expect(loc).toMatch(/service-areas\/rome/i);
  });

  test('unknown path shows 404 content', async ({ page }) => {
    const response = await page.goto('/e2e-missing-route-not-real', { waitUntil: 'domcontentloaded' });
    const status = response?.status();
    expect(status === 404 || status === 200, `unexpected status ${status}`).toBeTruthy();
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
  });
});
