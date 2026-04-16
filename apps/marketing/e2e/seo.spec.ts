import { test, expect } from '@playwright/test';

const ALL_PAGES = [
  { path: '/', title: /Designed by Anthony/ },
  { path: '/contact', title: /Contact/ },
  { path: '/about', title: /About/ },
  { path: '/services', title: /Web Design|SEO|Business Tools/ },
  { path: '/portfolio', title: /Portfolio/ },
  { path: '/faq', title: /FAQ/ },
  { path: '/blog', title: /Blog/ },
  { path: '/ouredge', title: /Edge/ },
  { path: '/free-seo-audit', title: /Audit/ },
  { path: '/services/custom-web-design', title: /Custom Web Design/ },
  { path: '/services/local-seo', title: /Local SEO/ },
  { path: '/services/managed-hosting', title: /Hosting/ },
  { path: '/services/website-rescue', title: /Website Rescue|Rescue/ },
  { path: '/services/ai-automation', title: /AI|Chatbot/ },
  { path: '/services/workspace-setup', title: /Workspace/ },
];

test.describe('SEO - Meta Tags', () => {
  for (const { path, title } of ALL_PAGES) {
    test(`${path} has title, description, canonical, OG, and JSON-LD`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      // Title
      await expect(page).toHaveTitle(title);

      // Meta description
      const description = page.locator('meta[name="description"]');
      await expect(description).toHaveAttribute('content', /.{20,}/);

      // Canonical
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href', /designedbyanthony\.com/);

      // OG tags
      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogTitle).toHaveAttribute('content', /.+/);

      const ogDesc = page.locator('meta[property="og:description"]');
      await expect(ogDesc).toHaveAttribute('content', /.+/);

      // JSON-LD structured data
      const schemas = page.locator('script[type="application/ld+json"]');
      expect(await schemas.count()).toBeGreaterThan(0);

      // Public marketing pages must stay indexable (regression: no accidental noindex)
      const robots = page.locator('meta[name="robots"]');
      await expect(robots).toHaveAttribute('content', /index/);
      await expect(robots).not.toHaveAttribute('content', /noindex/);
    });
  }
});

test.describe('SEO - Crawl Files', () => {
  test('sitemap excludes known noindex and utility pages', async ({ request }) => {
    const sitemapIndexResponse = await request.get('/sitemap-index.xml');
    expect(sitemapIndexResponse.ok()).toBeTruthy();

    const sitemapIndex = await sitemapIndexResponse.text();
    const sitemapPath = sitemapIndex.match(/<loc>https:\/\/designedbyanthony\.com(\/sitemap-\d+\.xml)<\/loc>/)?.[1];
    expect(sitemapPath).toBeTruthy();

    const sitemapResponse = await request.get(sitemapPath!);
    expect(sitemapResponse.ok()).toBeTruthy();

    const sitemap = await sitemapResponse.text();

    expect(sitemap).toContain('https://designedbyanthony.com/services/custom-web-design');
    expect(sitemap).toContain('https://designedbyanthony.com/blog');
    expect(sitemap).not.toContain('https://designedbyanthony.com/thank-you');
    expect(sitemap).not.toContain('https://designedbyanthony.com/report');
    expect(sitemap).not.toContain('https://designedbyanthony.com/facebook-offer');
    expect(sitemap).not.toContain('https://designedbyanthony.com/404');
  });

  test('llms.txt exposes canonical business facts for AI crawlers', async ({ request }) => {
    const response = await request.get('/llms.txt');
    expect(response.ok()).toBeTruthy();

    const llms = await response.text();

    expect(llms).toContain('Business name: Designed by Anthony');
    expect(llms).toContain('Canonical domain: https://designedbyanthony.com');
    expect(llms).toContain('Founder: Anthony Jones');
    expect(llms).toContain('Email: anthony@designedbyanthony.com');
    expect(llms).toContain('Phone: +1-315-922-5592');
    expect(llms).toContain('https://designedbyanthony.com/sitemap-index.xml');
  });
});
