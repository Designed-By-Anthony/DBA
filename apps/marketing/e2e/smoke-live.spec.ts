import { test, expect, type APIRequestContext } from '@playwright/test';

async function getHtml(request: APIRequestContext, path: string): Promise<string> {
  const response = await request.get(path);
  expect(response.ok(), `${path} should be reachable`).toBeTruthy();
  return response.text();
}

test.describe('Launch Smoke Live', () => {
  test('homepage exposes launch CTAs in live HTML', async ({ request }) => {
    const html = await getHtml(request, '/');

    expect(html).toMatch(/\d+ launch pilot spots/i);
    expect(html).toContain('id="hero-founder-btn"');
    expect(html).toContain('https://calendly.com/anthony-designedbyanthony/web-design-consult');
    expect(html).toContain('id="hero-run-audit-btn"');
    expect(html).toContain('href="/free-seo-audit"');
  });

  test('critical money pages return 200', async ({ request }) => {
    for (const path of ['/', '/services', '/services/custom-web-design', '/free-seo-audit', '/contact']) {
      const response = await request.get(path);
      expect(response.status(), `${path} should return 200`).toBe(200);
    }
  });

  test('contact page exposes form and calendar trigger', async ({ request }) => {
    const html = await getHtml(request, '/contact');

    expect(html).toContain('data-audit-form');
    expect(html).toContain('id="calendlyOpenBtn"');
    expect(html).toContain('id="calendlyModalBody"');
  });

  test('audit page exposes intake form', async ({ request }) => {
    const html = await getHtml(request, '/free-seo-audit');

    expect(html).toContain('data-lh-form');
    expect(html).toContain('id="lh-url"');
    expect(html).toContain('data-lh-submit');
  });

  test('crawl files are reachable', async ({ request }) => {
    for (const path of ['/robots.txt', '/llms.txt', '/sitemap-index.xml']) {
      const response = await request.get(path);
      expect(response.ok(), `${path} should be reachable`).toBeTruthy();
    }
  });
});
