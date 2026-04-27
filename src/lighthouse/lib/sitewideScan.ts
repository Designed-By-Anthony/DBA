import { fetchWithTimeout } from "./http";

export interface RobotsTxtResult {
	exists: boolean;
	content: string;
	disallowedPaths: string[];
	allowsCrawlers: boolean;
	sitemapUrls: string[];
}

export interface SitemapResult {
	exists: boolean;
	urlCount: number;
	sampleUrls: string[];
	parseFailed: boolean;
}

export interface RedirectChainResult {
	hops: Array<{ url: string; status: number }>;
	finalUrl: string;
	chainLength: number;
	hasMixedContent: boolean;
	httpToHttps: boolean;
	wwwRedirect: boolean;
	httpRedirectsToHttps: boolean;
	httpRedirectStatus: number | null;
}

export interface SitewideScanResult {
	robotsTxt: RobotsTxtResult;
	sitemap: SitemapResult;
	redirectChain: RedirectChainResult;
}

const DEFAULT_ROBOTS: RobotsTxtResult = {
	exists: false,
	content: "",
	disallowedPaths: [],
	allowsCrawlers: true,
	sitemapUrls: [],
};

const DEFAULT_SITEMAP: SitemapResult = {
	exists: false,
	urlCount: 0,
	sampleUrls: [],
	parseFailed: false,
};

function parseRobotsTxt(
	content: string,
): Pick<RobotsTxtResult, "disallowedPaths" | "allowsCrawlers" | "sitemapUrls"> {
	const lines = content.split("\n").map((l) => l.trim());
	const disallowedPaths: string[] = [];
	const sitemapUrls: string[] = [];
	let inWildcardBlock = false;
	let blocksCrawlers = false;

	for (const line of lines) {
		const lower = line.toLowerCase();

		if (lower.startsWith("user-agent:")) {
			const agent = lower.replace("user-agent:", "").trim();
			inWildcardBlock = agent === "*";
		} else if (lower.startsWith("disallow:") && inWildcardBlock) {
			const path = line.replace(/^disallow:\s*/i, "").trim();
			if (path) {
				disallowedPaths.push(path);
				if (path === "/") blocksCrawlers = true;
			}
		} else if (lower.startsWith("sitemap:")) {
			const sitemapUrl = line.replace(/^sitemap:\s*/i, "").trim();
			if (sitemapUrl) sitemapUrls.push(sitemapUrl);
		}
	}

	return {
		disallowedPaths,
		allowsCrawlers: !blocksCrawlers,
		sitemapUrls,
	};
}

async function scanRobotsTxt(baseUrl: string): Promise<RobotsTxtResult> {
	try {
		const origin = new URL(baseUrl).origin;
		const res = await fetchWithTimeout(
			`${origin}/robots.txt`,
			{
				headers: {
					"User-Agent": "Mozilla/5.0 (compatible; DBA-Audit-Bot/1.0)",
				},
			},
			8000,
		);

		if (!res.ok) return DEFAULT_ROBOTS;

		const contentType = res.headers.get("content-type") || "";
		if (contentType.includes("html"))
			return { ...DEFAULT_ROBOTS, exists: false };

		const content = await res.text();
		if (!content.trim() || content.length > 50000) return DEFAULT_ROBOTS;

		const parsed = parseRobotsTxt(content);
		return {
			exists: true,
			content: content.substring(0, 2000),
			...parsed,
		};
	} catch (err) {
		console.warn(
			"robots.txt scan failed:",
			err instanceof Error ? err.message : err,
		);
		return DEFAULT_ROBOTS;
	}
}

async function fetchSitemapText(sitemapUrl: string): Promise<string | null> {
	try {
		const res = await fetchWithTimeout(
			sitemapUrl,
			{
				headers: {
					"User-Agent": "Mozilla/5.0 (compatible; DBA-Audit-Bot/1.0)",
					Accept: "application/xml, text/xml",
				},
			},
			8000,
		);
		if (!res.ok) return null;
		return await res.text();
	} catch {
		return null;
	}
}

function extractLocs(xml: string): string[] {
	return (xml.match(/<loc>(.*?)<\/loc>/gi) || [])
		.map((m) => m.replace(/<\/?loc>/gi, "").trim())
		.filter(Boolean);
}

async function scanSitemap(
	baseUrl: string,
	robotsSitemapUrls: string[],
): Promise<SitemapResult> {
	const urlsToTry = [
		...robotsSitemapUrls,
		`${new URL(baseUrl).origin}/sitemap.xml`,
		`${new URL(baseUrl).origin}/sitemap_index.xml`,
	];

	const tried = new Set<string>();

	for (const sitemapUrl of urlsToTry) {
		if (tried.has(sitemapUrl)) continue;
		tried.add(sitemapUrl);

		const text = await fetchSitemapText(sitemapUrl);
		if (!text) continue;
		if (!text.includes("<urlset") && !text.includes("<sitemapindex")) continue;

		// If it's a sitemap index, follow child sitemaps to count actual page URLs
		if (text.includes("<sitemapindex")) {
			const childUrls = extractLocs(text);
			let totalPageUrls = 0;
			const allSampleUrls: string[] = [];

			const childFetches = childUrls.slice(0, 10).map(async (childUrl) => {
				const childText = await fetchSitemapText(childUrl);
				if (!childText?.includes("<urlset")) return [];
				return extractLocs(childText);
			});

			const childResults = await Promise.allSettled(childFetches);
			for (const r of childResults) {
				if (r.status === "fulfilled") {
					totalPageUrls += r.value.length;
					if (allSampleUrls.length < 5) {
						allSampleUrls.push(...r.value.slice(0, 5 - allSampleUrls.length));
					}
				}
			}

			return {
				exists: true,
				urlCount: totalPageUrls,
				sampleUrls: allSampleUrls,
				parseFailed: totalPageUrls === 0 && childUrls.length > 0,
			};
		}

		// Regular urlset sitemap
		const urls = extractLocs(text);
		return {
			exists: true,
			urlCount: urls.length,
			sampleUrls: urls.slice(0, 5),
			parseFailed: false,
		};
	}

	return DEFAULT_SITEMAP;
}

async function scanRedirectChain(url: string): Promise<RedirectChainResult> {
	const hops: Array<{ url: string; status: number }> = [];
	let currentUrl = url;
	const maxHops = 10;

	try {
		for (let i = 0; i < maxHops; i++) {
			const res = await fetchWithTimeout(
				currentUrl,
				{
					redirect: "manual",
					headers: {
						"User-Agent": "Mozilla/5.0 (compatible; DBA-Audit-Bot/1.0)",
					},
				},
				5000,
			);

			hops.push({ url: currentUrl, status: res.status });

			if (res.status >= 300 && res.status < 400) {
				const location = res.headers.get("location");
				if (!location) break;
				currentUrl = location.startsWith("http")
					? location
					: new URL(location, currentUrl).href;
			} else {
				break;
			}
		}
	} catch (err) {
		console.warn(
			"Redirect chain scan failed:",
			err instanceof Error ? err.message : err,
		);
	}

	const finalUrl = hops.length > 0 ? hops[hops.length - 1].url : url;

	const hasMixedContent = hops.some(
		(h, i) =>
			i > 0 &&
			h.url.startsWith("http://") &&
			hops[i - 1].url.startsWith("https://"),
	);
	const httpToHttps =
		hops.length >= 2 &&
		hops[0].url.startsWith("http://") &&
		hops.some((h) => h.url.startsWith("https://"));

	const firstHost = (() => {
		try {
			return new URL(hops[0]?.url || url).hostname;
		} catch {
			return "";
		}
	})();
	const lastHost = (() => {
		try {
			return new URL(finalUrl).hostname;
		} catch {
			return "";
		}
	})();
	const wwwRedirect =
		(firstHost.startsWith("www.") && !lastHost.startsWith("www.")) ||
		(!firstHost.startsWith("www.") && lastHost.startsWith("www."));

	// Also test whether http:// properly redirects to https://
	let httpRedirectsToHttps = false;
	let httpRedirectStatus: number | null = null;

	try {
		const parsed = new URL(url);
		if (parsed.protocol === "https:") {
			const httpVariant = url.replace(/^https:\/\//, "http://");
			const httpRes = await fetchWithTimeout(
				httpVariant,
				{
					redirect: "manual",
					headers: {
						"User-Agent": "Mozilla/5.0 (compatible; DBA-Audit-Bot/1.0)",
					},
				},
				5000,
			);
			httpRedirectStatus = httpRes.status;
			if (httpRes.status >= 300 && httpRes.status < 400) {
				const loc = httpRes.headers.get("location") || "";
				httpRedirectsToHttps = loc.startsWith("https://");
			}
		}
	} catch {
		// Non-critical — just leave defaults
	}

	return {
		hops,
		finalUrl,
		chainLength: Math.max(0, hops.length - 1),
		hasMixedContent,
		httpToHttps,
		wwwRedirect,
		httpRedirectsToHttps,
		httpRedirectStatus,
	};
}

export async function scanSitewide(url: string): Promise<SitewideScanResult> {
	const [robotsTxt, redirectChain] = await Promise.all([
		scanRobotsTxt(url),
		scanRedirectChain(url),
	]);

	const sitemap = await scanSitemap(url, robotsTxt.sitemapUrls);

	return { robotsTxt, sitemap, redirectChain };
}
