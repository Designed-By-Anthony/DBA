import { type APIRequestContext, expect, test } from "@playwright/test";

const ALL_PAGES = [
	{ path: "/", title: /Designed by Anthony/ },
	{ path: "/contact", title: /Contact/ },
	{ path: "/about", title: /About/ },
	{ path: "/services", title: /Web Design|SEO|Business Tools/ },
	{ path: "/pricing", title: /Pricing/ },
	{ path: "/portfolio", title: /Portfolio/ },
	{ path: "/faq", title: /FAQ/ },
	{ path: "/blog", title: /Blog/ },
	{ path: "/ouredge", title: /Edge/ },
	{ path: "/free-seo-audit", title: /Audit/ },
	{ path: "/services/custom-web-design", title: /Custom Web Design/ },
	{ path: "/services/local-seo", title: /Local SEO/ },
	{ path: "/services/managed-hosting", title: /Hosting/ },
	{ path: "/services/website-rescue", title: /Website Rescue|Rescue/ },
	{ path: "/services/ai-automation", title: /AI|Chatbot/ },
	{ path: "/services/workspace-setup", title: /Workspace/ },
];

async function getHtml(
	request: APIRequestContext,
	path: string,
): Promise<string> {
	const response = await request.get(path);
	expect(response.ok(), `${path} should be reachable`).toBeTruthy();
	return response.text();
}

test.describe("SEO Live - Meta Tags", () => {
	for (const { path, title } of ALL_PAGES) {
		test(`${path} has title, description, canonical, OG, and JSON-LD`, async ({
			request,
		}) => {
			const html = await getHtml(request, path);

			expect(html).toMatch(/<title>.*<\/title>/i);
			expect(html).toMatch(title);
			expect(html).toMatch(/<meta name="description" content=".{20,}"/i);
			expect(html).toMatch(
				/<link rel="canonical" href="https:\/\/designedbyanthony\.com[^"]*"/i,
			);
			expect(html).toMatch(/<meta property="og:title" content=".+?"/i);
			expect(html).toMatch(/<meta property="og:description" content=".+?"/i);
			expect(html).toMatch(/<script type="application\/ld\+json">/i);
		});
	}
});

test.describe("SEO Live - Crawl Files", () => {
	test("sitemap excludes known noindex and utility pages", async ({
		request,
	}) => {
		const sitemapIndex = await getHtml(request, "/sitemap-index.xml");
		const sitemapPath = sitemapIndex.match(
			/<loc>https:\/\/designedbyanthony\.com(\/sitemap-\d+\.xml)<\/loc>/,
		)?.[1];
		expect(sitemapPath).toBeTruthy();

		const sitemap = await getHtml(request, sitemapPath!);

		expect(sitemap).toContain(
			"https://designedbyanthony.com/services/custom-web-design",
		);
		expect(sitemap).toContain("https://designedbyanthony.com/blog");
		expect(sitemap).not.toContain("https://designedbyanthony.com/thank-you");
		expect(sitemap).not.toContain("https://designedbyanthony.com/report");
		expect(sitemap).not.toContain(
			"https://designedbyanthony.com/facebook-offer",
		);
		expect(sitemap).not.toContain("https://designedbyanthony.com/404");
	});

	test("llms.txt exposes canonical business facts for AI crawlers", async ({
		request,
	}) => {
		const llms = await getHtml(request, "/llms.txt");

		expect(llms).toContain("Business name: Designed by Anthony");
		expect(llms).toContain("Canonical domain: https://designedbyanthony.com");
		expect(llms).toContain("Founder: Anthony Jones");
		expect(llms).toContain("Email: anthony@designedbyanthony.com");
		expect(llms).toContain("Phone: +1-315-922-5592");
		expect(llms).toContain("https://designedbyanthony.com/sitemap-index.xml");
	});
});
