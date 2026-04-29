import * as cheerio from "cheerio";
import { fetchWithTimeout } from "./http";

export interface HtmlScanResult {
	hasLocalBusinessSchema: boolean;
	hasTelLink: boolean;
	hasSocialLinks: boolean;
	bodyText: string;
	metaTitle: string;
	metaDescription: string;
	h1Count: number;
	h1Text: string;
	imgCount: number;
	imgsMissingAlt: number;
	hasHttps: boolean;
	hasForms: boolean;
	ctaCount: number;
	externalLinkCount: number;
	wordCount: number;
	h2Count: number;
	h3Count: number;
	h4PlusCount: number;
	headingHierarchyValid: boolean;
	canonicalUrl: string;
	hasCanonical: boolean;
	ogTitle: string;
	ogDescription: string;
	ogImage: string;
	twitterCard: string;
	robotsMeta: string;
	hasNoIndex: boolean;
	hasNoFollow: boolean;
	viewportMeta: string;
	hasViewport: boolean;
	langAttribute: string;
	hasFavicon: boolean;
	internalLinkCount: number;
	metaTitleLength: number;
	metaDescriptionLength: number;
	// Performance
	ttfbMs: number | null;
	// Security
	mixedContentCount: number;
	// Schema deep dive
	schemaTypes: string[];
	missingRecommendedSchema: string[];
	// Image optimization
	imgsWithLazyLoad: number;
	imgsWithDimensions: number;
	imgsWithSrcset: number;
	imgsModernFormat: number;
	// Content readability
	readabilityScore: number | null;
	readingLevel: "easy" | "moderate" | "difficult" | null;
}

const RECOMMENDED_LOCAL_SCHEMA = [
	"LocalBusiness",
	"Organization",
	"WebSite",
	"BreadcrumbList",
	"FAQ",
];

function countSyllables(word: string): number {
	const w = word.toLowerCase().replace(/[^a-z]/g, "");
	if (w.length <= 3) return 1;
	let count = (w.match(/[aeiouy]+/g) || []).length;
	if (w.endsWith("e") && !w.endsWith("le")) count--;
	if (w.endsWith("ed") && !w.endsWith("ted") && !w.endsWith("ded")) count--;
	return Math.max(1, count);
}

function computeReadability(text: string): {
	score: number | null;
	level: "easy" | "moderate" | "difficult" | null;
} {
	const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 2);
	const words = text.split(/\s+/).filter(Boolean);
	if (sentences.length < 3 || words.length < 30)
		return { score: null, level: null };

	const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
	const score =
		206.835 -
		1.015 * (words.length / sentences.length) -
		84.6 * (totalSyllables / words.length);
	const clamped = Math.max(0, Math.min(100, Math.round(score)));

	let level: "easy" | "moderate" | "difficult";
	if (clamped >= 60) level = "easy";
	else if (clamped >= 30) level = "moderate";
	else level = "difficult";

	return { score: clamped, level };
}

function extractSchemaTypes($: cheerio.CheerioAPI): string[] {
	const types = new Set<string>();

	$('script[type="application/ld+json"]').each((_: unknown, el: unknown) => {
		try {
			const content = $(el as never).html();
			if (!content) return;
			const parsed = JSON.parse(content);
			collectTypes(parsed, types);
		} catch {
			/* ignore malformed JSON-LD */
		}
	});

	return [...types];
}

function collectTypes(obj: unknown, types: Set<string>): void {
	if (!obj || typeof obj !== "object") return;

	if (Array.isArray(obj)) {
		for (const item of obj) collectTypes(item, types);
		return;
	}

	const record = obj as Record<string, unknown>;
	if (typeof record["@type"] === "string") {
		types.add(record["@type"]);
	} else if (Array.isArray(record["@type"])) {
		for (const t of record["@type"]) {
			if (typeof t === "string") types.add(t);
		}
	}

	if (Array.isArray(record["@graph"])) {
		for (const item of record["@graph"]) collectTypes(item, types);
	}
}

/**
 * Fetches the URL and extracts critical local business flags + deep HTML signals for AI
 */
export async function scanHtml(
	url: string,
	timeoutMs = 10000,
): Promise<HtmlScanResult> {
	const result: HtmlScanResult = {
		hasLocalBusinessSchema: false,
		hasTelLink: false,
		hasSocialLinks: false,
		bodyText: "",
		metaTitle: "",
		metaDescription: "",
		h1Count: 0,
		h1Text: "",
		imgCount: 0,
		imgsMissingAlt: 0,
		hasHttps: false,
		hasForms: false,
		ctaCount: 0,
		externalLinkCount: 0,
		wordCount: 0,
		h2Count: 0,
		h3Count: 0,
		h4PlusCount: 0,
		headingHierarchyValid: true,
		canonicalUrl: "",
		hasCanonical: false,
		ogTitle: "",
		ogDescription: "",
		ogImage: "",
		twitterCard: "",
		robotsMeta: "",
		hasNoIndex: false,
		hasNoFollow: false,
		viewportMeta: "",
		hasViewport: false,
		langAttribute: "",
		hasFavicon: false,
		internalLinkCount: 0,
		metaTitleLength: 0,
		metaDescriptionLength: 0,
		ttfbMs: null,
		mixedContentCount: 0,
		schemaTypes: [],
		missingRecommendedSchema: [...RECOMMENDED_LOCAL_SCHEMA],
		imgsWithLazyLoad: 0,
		imgsWithDimensions: 0,
		imgsWithSrcset: 0,
		imgsModernFormat: 0,
		readabilityScore: null,
		readingLevel: null,
	};

	try {
		const fetchStart = performance.now();
		const res = await fetchWithTimeout(
			url,
			{
				headers: {
					"User-Agent": "Mozilla/5.0 (compatible; DBA-Audit-Bot/1.0)",
					Accept: "text/html,application/xhtml+xml",
				},
			},
			timeoutMs,
		);
		result.ttfbMs = Math.round(performance.now() - fetchStart);

		if (!res.ok) {
			console.warn(`HTML Fetch failed with status: ${res.status}`);
			return result;
		}

		// Check HTTPS from the final (possibly redirected) URL
		result.hasHttps = res.url.startsWith("https://");

		const html = await res.text();
		const $ = cheerio.load(html);

		// ── Meta Tags ──
		result.metaTitle = $("title").first().text().trim().substring(0, 200);
		result.metaDescription = (
			$('meta[name="description"]').attr("content") || ""
		)
			.trim()
			.substring(0, 300);

		// ── Meta tag lengths for SEO scoring ──
		result.metaTitleLength = result.metaTitle.length;
		result.metaDescriptionLength = result.metaDescription.length;

		// ── Canonical ──
		const canonical = $('link[rel="canonical"]').attr("href") || "";
		result.canonicalUrl = canonical.trim().substring(0, 500);
		result.hasCanonical = canonical.trim().length > 0;

		// ── Open Graph ──
		result.ogTitle = ($('meta[property="og:title"]').attr("content") || "")
			.trim()
			.substring(0, 200);
		result.ogDescription = (
			$('meta[property="og:description"]').attr("content") || ""
		)
			.trim()
			.substring(0, 300);
		result.ogImage = ($('meta[property="og:image"]').attr("content") || "")
			.trim()
			.substring(0, 500);
		result.twitterCard = (
			$('meta[name="twitter:card"]').attr("content") || ""
		).trim();

		// ── Robots meta ──
		const robotsContent = ($('meta[name="robots"]').attr("content") || "")
			.trim()
			.toLowerCase();
		result.robotsMeta = robotsContent;
		result.hasNoIndex = robotsContent.includes("noindex");
		result.hasNoFollow = robotsContent.includes("nofollow");

		// ── Viewport ──
		const viewport = ($('meta[name="viewport"]').attr("content") || "").trim();
		result.viewportMeta = viewport.substring(0, 200);
		result.hasViewport = viewport.length > 0;

		// ── Lang attribute ──
		result.langAttribute = ($("html").attr("lang") || "")
			.trim()
			.substring(0, 10);

		// ── Favicon ──
		result.hasFavicon =
			$(
				'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]',
			).length > 0;

		// ── Heading Structure (full hierarchy) ──
		const h1s = $("h1");
		result.h1Count = h1s.length;
		result.h1Text = h1s.first().text().trim().substring(0, 200);
		result.h2Count = $("h2").length;
		result.h3Count = $("h3").length;
		result.h4PlusCount = $("h4, h5, h6").length;

		// Check heading hierarchy: H1 should exist, and headings shouldn't skip levels
		const headingLevels: number[] = [];
		$("h1, h2, h3, h4, h5, h6").each((_: unknown, el: unknown) => {
			const tag = ($(el as never).prop("tagName") || "").toLowerCase();
			const level = parseInt(tag.replace("h", ""), 10);
			if (!Number.isNaN(level)) headingLevels.push(level);
		});
		if (headingLevels.length > 0) {
			result.headingHierarchyValid = headingLevels[0] === 1;
			for (let i = 1; i < headingLevels.length; i++) {
				if (headingLevels[i] - headingLevels[i - 1] > 1) {
					result.headingHierarchyValid = false;
					break;
				}
			}
		}

		// ── Images + optimization audit ──
		const images = $("img");
		result.imgCount = images.length;
		let missingAlt = 0;
		let lazyCount = 0;
		let dimCount = 0;
		let srcsetCount = 0;
		let modernCount = 0;
		images.each((_: unknown, el: unknown) => {
			const $el = $(el as never);
			const alt = $el.attr("alt");
			if (!alt || alt.trim() === "") missingAlt++;
			if ($el.attr("loading") === "lazy") lazyCount++;
			if ($el.attr("width") && $el.attr("height")) dimCount++;
			if ($el.attr("srcset")) srcsetCount++;
			const src = ($el.attr("src") || "").toLowerCase();
			if (src.includes(".webp") || src.includes(".avif")) modernCount++;
		});
		result.imgsMissingAlt = missingAlt;
		result.imgsWithLazyLoad = lazyCount;
		result.imgsWithDimensions = dimCount;
		result.imgsWithSrcset = srcsetCount;
		result.imgsModernFormat = modernCount;

		// ── Mixed content detection ──
		if (result.hasHttps) {
			let mixedCount = 0;
			$(
				'img[src^="http://"], script[src^="http://"], link[href^="http://"]',
			).each(() => {
				mixedCount++;
			});
			result.mixedContentCount = mixedCount;
		}

		// ── Forms ──
		result.hasForms = $("form").length > 0;

		// ── Click-to-call ──
		result.hasTelLink = $('a[href^="tel:"]').length > 0;

		// ── Social profiles ──
		result.hasSocialLinks =
			$(
				'a[href*="facebook.com"], a[href*="instagram.com"], a[href*="linkedin.com/company/"]',
			).length > 0;

		// ── Deep schema analysis ──
		result.schemaTypes = extractSchemaTypes($);
		result.hasLocalBusinessSchema = result.schemaTypes.some(
			(t) =>
				t === "LocalBusiness" ||
				t.endsWith("LocalBusiness") ||
				t.includes("LocalBusiness"),
		);
		result.missingRecommendedSchema = RECOMMENDED_LOCAL_SCHEMA.filter(
			(rec) => !result.schemaTypes.some((found) => found.includes(rec)),
		);

		// ── CTA detection — buttons/links with action-oriented language ──
		const ctaPatterns =
			/\b(call|quote|book|contact|schedule|get started|free estimate|request|consult|talk to|reach out|let'?s talk)\b/i;
		let ctaCount = 0;
		$("a, button").each((_: unknown, el: unknown) => {
			const text = $(el as never)
				.text()
				.trim();
			if (ctaPatterns.test(text)) ctaCount++;
		});
		result.ctaCount = ctaCount;

		// ── Link analysis (internal + external) ──
		let externalCount = 0;
		let internalCount = 0;
		try {
			const domain = new URL(url).hostname.replace("www.", "");
			$("a[href]").each((_: unknown, el: unknown) => {
				const href = $(el as never).attr("href") || "";
				if (
					href.startsWith("#") ||
					href.startsWith("mailto:") ||
					href.startsWith("tel:")
				)
					return;
				try {
					if (href.startsWith("http")) {
						const linkDomain = new URL(href).hostname.replace("www.", "");
						if (linkDomain === domain) internalCount++;
						else externalCount++;
					} else if (href.startsWith("/") || !href.includes("://")) {
						internalCount++;
					}
				} catch {
					/* skip malformed */
				}
			});
		} catch {
			/* skip if base URL fails */
		}
		result.externalLinkCount = externalCount;
		result.internalLinkCount = internalCount;

		// ── Body text extraction ──
		$("script, style, noscript, iframe, svg, img").remove();
		let text = $("body").text();
		text = text.replace(/\s+/g, " ").trim();
		result.wordCount = text.split(/\s+/).filter(Boolean).length;
		result.bodyText = text.substring(0, 10000);

		// ── Content readability (Flesch-Kincaid) ──
		const { score, level } = computeReadability(text);
		result.readabilityScore = score;
		result.readingLevel = level;

		return result;
	} catch (err) {
		console.warn("HTML scan failed:", err instanceof Error ? err.message : err);
		return result;
	}
}
