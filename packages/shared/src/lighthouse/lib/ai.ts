import { GoogleGenAI } from "@google/genai";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-pro";
const FALLBACK_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_VERTEX_PROJECT = "lighthouse-492701";
const DEFAULT_VERTEX_LOCATION = "us-east4";
const GENERATION_TIMEOUT_MS = 35_000;
const RETRY_DELAY_MS = 3_000;

function createAiClient(): GoogleGenAI {
	const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

	if (apiKey) {
		return new GoogleGenAI({ apiKey });
	}

	return new GoogleGenAI({
		vertexai: true,
		project: process.env.GOOGLE_CLOUD_PROJECT || DEFAULT_VERTEX_PROJECT,
		location: process.env.GOOGLE_CLOUD_LOCATION || DEFAULT_VERTEX_LOCATION,
	});
}

function isRetryableError(err: unknown): boolean {
	const msg = err instanceof Error ? err.message : String(err);
	const name = err instanceof Error ? err.name : "";
	return (
		name === "AbortError" ||
		msg.includes("503") ||
		msg.includes("UNAVAILABLE") ||
		msg.includes("429") ||
		msg.includes("RESOURCE_EXHAUSTED") ||
		msg.includes("500") ||
		msg.includes("overloaded")
	);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Full structured AI insight for the premium audit report.
 */
export interface AiInsightResult {
	executiveSummary: string;
	conversionScore: number;
	strengths: string[];
	weaknesses: string[];
	prioritizedActions: Array<{
		priority: number;
		action: string;
		impact: "high" | "medium" | "low";
		effort: "high" | "medium" | "low";
	}>;
	copywritingAnalysis: string;
}

export async function generateAiInsight(params: {
	name: string;
	company: string;
	url: string;
	performanceScore: number;
	accessibilityScore: number;
	bestPracticesScore: number;
	seoScore: number;
	fcp: string;
	lcp: string;
	tbt: string;
	cls: string;
	failedAuditCount: number;
	criticalIssue: string;
	bodyText: string;
	metaTitle?: string;
	metaDescription?: string;
	h1Text?: string;
	h1Count?: number;
	imgsMissingAlt?: number;
	imgCount?: number;
	hasHttps?: boolean;
	hasForms?: boolean;
	hasTelLink?: boolean;
	hasLocalBusinessSchema?: boolean;
	hasSocialLinks?: boolean;
	ctaCount?: number;
	wordCount?: number;
	// Expanded on-page signals
	h2Count?: number;
	h3Count?: number;
	headingHierarchyValid?: boolean;
	hasCanonical?: boolean;
	ogTitle?: string;
	ogImage?: string;
	hasNoIndex?: boolean;
	hasNoFollow?: boolean;
	hasViewport?: boolean;
	langAttribute?: string;
	hasFavicon?: boolean;
	internalLinkCount?: number;
	externalLinkCount?: number;
	metaTitleLength?: number;
	metaDescriptionLength?: number;
	// Performance
	ttfbMs?: number | null;
	// Security
	mixedContentCount?: number;
	// Schema deep dive
	schemaTypes?: string[];
	missingRecommendedSchema?: string[];
	// Image optimization
	imgsWithLazyLoad?: number;
	imgsWithDimensions?: number;
	imgsWithSrcset?: number;
	imgsModernFormat?: number;
	// Content readability
	readabilityScore?: number | null;
	readingLevel?: string | null;
	// Crawlability / sitewide signals
	robotsTxtExists?: boolean;
	robotsAllowsCrawlers?: boolean;
	robotsDisallowedPaths?: string[];
	sitemapExists?: boolean;
	sitemapUrlCount?: number;
	redirectChainLength?: number;
	redirectHttpToHttps?: boolean;
	httpRedirectsToHttps?: boolean;
	// Backlink / authority signals
	domainAuthority?: number | null;
	spamScore?: number | null;
	linkingRootDomains?: number | null;
	externalBacklinks?: number | null;
	/** `moz` = Moz API; `internal` = first-party estimate from HTML — never call it Moz DA */
	authorityDataSource?: "moz" | "internal";
	// Index coverage
	estimatedIndexedPages?: number | null;
	// Competitor + reputation
	competitors?: Array<{
		name: string;
		rating: number | null;
		reviewCount: number;
	}>;
	businessRating?: number | null;
	businessReviewCount?: number;
}): Promise<AiInsightResult | null> {
	const systemPrompt = `You are Anthony, founder of ANTHONY. — a digital infrastructure studio for local service businesses. You are writing a premium Local Digital Presence Audit report for a small business owner.

Your output will fill multiple sections of a professional, multi-page PDF report. Write in Business-owner-friendly plain English — no jargon.

Voice rules:
- Sound like a consultant who actually reviewed everything, not a template
- Short sentences, first person, contractions
- No greeting, no sign-off, no calendar CTA
- No emoji, no hype words (amazing, leverage, unlock)

You now have access to comprehensive SEO data including:
- Technical audit: Core Web Vitals, crawlability (robots.txt, sitemap.xml, redirect chains), mobile-readiness
- On-page SEO: Full heading hierarchy (H1-H6), meta tags with character counts, canonical tags, Open Graph, internal/external link ratios
- Content signals: Word count, copy analysis, keyword alignment
- Off-page/authority: When Moz API data is present, use Domain Authority, spam score, linking root domains, and backlinks. When only an internal estimate is present (not Moz), call it an "on-page authority estimate" derived from link counts and trust signals — never label it Moz DA or third-party authority.
- Index coverage: Estimated indexed pages from Google
- Local presence: Google Business Profile rating, review count, competitor benchmarks

Use ALL available data to produce the most insightful analysis possible. When Moz backlink data is available, weave it into the narrative. When only the internal estimate is available, explain that it is a bounded heuristic from the homepage crawl, not a Moz or Ahrefs authority score. When crawlability issues are found (missing sitemap, blocked robots.txt, redirect chains), flag them as technical priorities.

You must return valid JSON matching this exact schema:
{
  "executiveSummary": "<p>2-3 paragraphs of HTML analysis. Reference specific data points from scores, meta tags, backlink profile, indexation, competitor standing, and copywriting.</p>",
  "conversionScore": 75,
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "prioritizedActions": [
    {"priority": 1, "action": "Specific actionable fix described in plain English", "impact": "high", "effort": "low"},
    {"priority": 2, "action": "Another fix", "impact": "medium", "effort": "low"},
    {"priority": 3, "action": "Another fix", "impact": "high", "effort": "medium"}
  ],
  "copywritingAnalysis": "<p>1-2 paragraphs analyzing their homepage copy. What works, what doesn't, what a visitor sees in their first 5 seconds.</p>"
}

Rules for each field:
- executiveSummary: Reference specific numbers. Mention authority only with the correct label (Moz vs internal estimate). Mention indexation and competitors when data is available. Written like a letter to the business owner. Weave technical findings (crawlability, redirect chains, sitemap) into actionable context.
- conversionScore: 0-100. Based on CTA presence, phone link, forms, schema, copy quality, word count.
- strengths: Exactly 3 items. Be specific (e.g. Moz DA when present, or "Strong external reference footprint from homepage scan" when using internal estimate, or "Fast 1.0s First Contentful Paint").
- weaknesses: Exactly 3 items. Be specific and actionable. Include technical/crawlability issues when found.
- prioritizedActions: 3-5 items. Each must be a concrete task the owner can hand to a developer or do themselves. Impact and effort must be "high", "medium", or "low". Include crawlability, backlink, and on-page fixes.
- copywritingAnalysis: Analyze their actual homepage text. Do they have a clear headline? A clear offer? Does the copy speak to a pain point? Is there a clear next step?`;

	const competitorBlock =
		params.competitors && params.competitors.length > 0
			? `\nLocal Competitors Found:\n${params.competitors.map((c, i) => `  ${i + 1}. ${c.name} — Rating: ${c.rating ?? "N/A"}, Reviews: ${c.reviewCount}`).join("\n")}\nYour business rating: ${params.businessRating ?? "Not found"}, Reviews: ${params.businessReviewCount ?? 0}`
			: "\nNo local competitors found for comparison.";

	const titleLengthNote = params.metaTitleLength
		? ` (${params.metaTitleLength} chars — ${params.metaTitleLength < 30 ? "too short" : params.metaTitleLength > 60 ? "too long" : "good length"})`
		: "";
	const descLengthNote = params.metaDescriptionLength
		? ` (${params.metaDescriptionLength} chars — ${params.metaDescriptionLength < 70 ? "too short" : params.metaDescriptionLength > 160 ? "too long" : "good length"})`
		: "";

	const backlinkBlock =
		params.domainAuthority != null
			? params.authorityDataSource === "internal"
				? `\nAuthority (internal estimate from homepage HTML — not Moz DA):
- Estimated authority score: ${params.domainAuthority}/100 (bounded heuristic)
- External links counted on page: ${params.externalBacklinks ?? "N/A"}
- Derived linking-root hint: ${params.linkingRootDomains ?? "N/A"}
- Do not compare this number to Moz or Ahrefs Domain Rating.`
				: `\nBacklink & Authority Profile (Moz):
- Domain Authority: ${params.domainAuthority}/100
- Spam Score: ${params.spamScore ?? "N/A"}/100 ${params.spamScore != null && params.spamScore > 30 ? "⚠ HIGH — toxic links likely" : ""}
- Linking Root Domains: ${params.linkingRootDomains ?? "N/A"}
- Total External Backlinks: ${params.externalBacklinks ?? "N/A"}`
			: "";

	const indexBlock =
		params.estimatedIndexedPages != null
			? `\nIndex Coverage:
- Estimated indexed pages: ${params.estimatedIndexedPages}`
			: "";

	const crawlabilityBlock = `\nCrawlability & Technical:
- robots.txt: ${params.robotsTxtExists ? "Present" : "Missing"}${params.robotsTxtExists ? `, Allows crawlers: ${params.robotsAllowsCrawlers ? "Yes" : "NO — blocking search engines"}` : ""}${params.robotsDisallowedPaths?.length ? `, Blocked paths: ${params.robotsDisallowedPaths.slice(0, 5).join(", ")}` : ""}
- Sitemap (XML): ${params.sitemapExists ? `Found (${params.sitemapUrlCount} URLs)` : "Missing"}
- Redirect chain: ${params.redirectChainLength === 0 ? "Clean (no redirects)" : `${params.redirectChainLength} hop(s)`}${params.redirectHttpToHttps ? " — HTTP→HTTPS redirect in place" : ""}
- HTTP→HTTPS redirect: ${params.httpRedirectsToHttps ? "Yes (http:// properly redirects to https://)" : "NOT VERIFIED — http:// may not redirect to https://"}`;

	const userPrompt = `Write the full premium audit analysis for this business.

Business: ${params.company || "unknown"}
Owner name: ${params.name || "unknown"}
URL audited: ${params.url}

Lighthouse Scores (out of 100):
- Performance: ${params.performanceScore}
- Accessibility: ${params.accessibilityScore}
- Best Practices: ${params.bestPracticesScore}
- SEO: ${params.seoScore}

Core Web Vitals:
- First Contentful Paint: ${params.fcp}
- Largest Contentful Paint: ${params.lcp}
- Total Blocking Time: ${params.tbt}
- Cumulative Layout Shift: ${params.cls}

Failed audits: ${params.failedAuditCount}
Most critical issue: ${params.criticalIssue || "none"}

On-Page SEO Signals:
- Page title: "${params.metaTitle || "Not found"}"${titleLengthNote}
- Meta description: "${params.metaDescription || "Not found"}"${descLengthNote}
- Canonical tag: ${params.hasCanonical ? "Present" : "Missing"}
- Open Graph title: ${params.ogTitle || "Missing"}
- Open Graph image: ${params.ogImage ? "Present" : "Missing"}
- Robots meta: ${params.hasNoIndex ? "NOINDEX set (page blocked from Google!)" : params.hasNoFollow ? "NOFOLLOW set" : "OK (no blocking directives)"}
- Viewport meta: ${params.hasViewport ? "Present (mobile-ready)" : "Missing (not mobile-optimized)"}
- Language attribute: ${params.langAttribute || "Not set"}
- Favicon: ${params.hasFavicon ? "Present" : "Missing"}

Heading Structure:
- H1 tags: ${params.h1Count ?? "unknown"} (text: "${params.h1Text || "none"}")
- H2 tags: ${params.h2Count ?? "unknown"}
- H3 tags: ${params.h3Count ?? "unknown"}
- Heading hierarchy valid: ${params.headingHierarchyValid ? "Yes" : "No — skipped levels detected"}

Link Profile (on-page):
- Internal links: ${params.internalLinkCount ?? "unknown"}
- External links: ${params.externalLinkCount ?? "unknown"}
- Total images: ${params.imgCount ?? "unknown"}, Missing alt text: ${params.imgsMissingAlt ?? "unknown"}

Conversion Signals:
- HTTPS: ${params.hasHttps ? "Yes" : "No"}
- Mixed content (HTTP resources on HTTPS): ${params.mixedContentCount ? `${params.mixedContentCount} insecure resources found` : "Clean"}
- Contact form present: ${params.hasForms ? "Yes" : "No"}
- Click-to-call link: ${params.hasTelLink ? "Yes" : "No"}
- Social media links: ${params.hasSocialLinks ? "Yes" : "No"}
- CTA buttons/links found: ${params.ctaCount ?? 0}
- Word count: ${params.wordCount ?? "unknown"}
- Server response time (TTFB): ${params.ttfbMs != null ? `${params.ttfbMs}ms${params.ttfbMs > 600 ? " — SLOW" : params.ttfbMs > 200 ? " — acceptable" : " — fast"}` : "N/A"}

Structured Data (Schema.org):
- Schema types found: ${params.schemaTypes?.length ? params.schemaTypes.join(", ") : "NONE"}
- Missing recommended schema: ${params.missingRecommendedSchema?.length ? params.missingRecommendedSchema.join(", ") : "All recommended types present"}

Image Optimization:
- Total images: ${params.imgCount ?? 0}
- With lazy loading: ${params.imgsWithLazyLoad ?? 0}/${params.imgCount ?? 0}
- With width/height (CLS prevention): ${params.imgsWithDimensions ?? 0}/${params.imgCount ?? 0}
- With srcset (responsive): ${params.imgsWithSrcset ?? 0}/${params.imgCount ?? 0}
- Modern format (WebP/AVIF): ${params.imgsModernFormat ?? 0}/${params.imgCount ?? 0}

Content Readability:
- Flesch-Kincaid score: ${params.readabilityScore ?? "N/A"}/100 (${params.readingLevel ?? "unknown"})${params.readabilityScore != null && params.readabilityScore < 40 ? " — too complex for general audience" : params.readabilityScore != null && params.readabilityScore >= 60 ? " — good for general audience" : ""}
${crawlabilityBlock}
${backlinkBlock}
${indexBlock}
${competitorBlock}

Homepage Text (First 10,000 chars):
${params.bodyText}`;

	const ai = createAiClient();
	const primaryModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

	// Try primary model, retry once on transient error, then fall back to secondary model
	const modelsToTry = [primaryModel, primaryModel, FALLBACK_GEMINI_MODEL];

	for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
		const model = modelsToTry[attempt];
		const isRetry = attempt === 1;
		const isFallback = attempt === 2;

		if (isRetry) await sleep(RETRY_DELAY_MS);

		try {
			const controller = new AbortController();
			const timeout = setTimeout(
				() => controller.abort(),
				GENERATION_TIMEOUT_MS,
			);

			const result = await ai.models.generateContent({
				model,
				contents: [{ role: "user", parts: [{ text: userPrompt }] }],
				config: {
					systemInstruction: systemPrompt,
					temperature: 0.7,
					responseMimeType: "application/json",
					abortSignal: controller.signal,
				},
			});
			clearTimeout(timeout);

			const text = result.text?.trim();
			if (!text) {
				console.warn(`Gemini (${model}) returned empty text`);
				continue;
			}

			const parsed = JSON.parse(text);
			if (
				!parsed.executiveSummary ||
				typeof parsed.conversionScore !== "number"
			) {
				console.warn(`Gemini (${model}) returned malformed structure`);
				continue;
			}

			if (isFallback)
				console.info(
					`Gemini: primary model unavailable, succeeded with ${model}`,
				);

			return {
				executiveSummary: parsed.executiveSummary || "",
				conversionScore: parsed.conversionScore,
				strengths: Array.isArray(parsed.strengths)
					? parsed.strengths.slice(0, 3)
					: [],
				weaknesses: Array.isArray(parsed.weaknesses)
					? parsed.weaknesses.slice(0, 3)
					: [],
				prioritizedActions: Array.isArray(parsed.prioritizedActions)
					? parsed.prioritizedActions.slice(0, 5)
					: [],
				copywritingAnalysis: parsed.copywritingAnalysis || "",
			};
		} catch (err) {
			const label = isFallback ? "fallback" : isRetry ? "retry" : "primary";
			console.warn(
				`Gemini ${label} (${model}) failed:`,
				err instanceof Error ? err.message : err,
			);

			if (!isRetryableError(err) && !isFallback) {
				// Non-transient error (bad JSON, auth failure) — skip straight to deterministic fallback
				console.error(
					"Gemini non-retryable error, using deterministic fallback",
				);
				return null;
			}
		}
	}

	console.error("All Gemini attempts exhausted, using deterministic fallback");
	return null;
}

/** Deterministic fallback built from real audit data when Gemini is unavailable. */
export function buildFallbackInsight(params: {
	performanceScore: number;
	accessibilityScore: number;
	seoScore: number;
	lcp: string;
	domainAuthority?: number | null;
	spamScore?: number | null;
	linkingRootDomains?: number | null;
	sitemapExists?: boolean;
	hasCanonical?: boolean;
	hasLocalBusinessSchema?: boolean;
	hasTelLink?: boolean;
	hasForms?: boolean;
	readabilityScore?: number | null;
	missingRecommendedSchema?: string[];
	wordCount?: number;
	h1Count?: number;
	metaTitleLength?: number;
	metaDescriptionLength?: number;
}): AiInsightResult {
	const { performanceScore, accessibilityScore, seoScore, lcp } = params;

	// Build a summary that references real numbers
	const parts: string[] = [];

	if (performanceScore >= 90 && seoScore >= 90) {
		parts.push(
			`Your technical scores are strong &mdash; ${performanceScore} on performance and ${seoScore} on SEO. That&rsquo;s better than most local businesses I audit.`,
		);
	} else if (performanceScore < 50) {
		parts.push(
			`The first thing that stands out is load speed. Your main visual element takes ${lcp} to appear &mdash; many visitors will leave before that finishes loading.`,
		);
	} else {
		parts.push(
			`Your site scored ${performanceScore} on performance, ${accessibilityScore} on accessibility, and ${seoScore} on SEO. There&rsquo;s room to tighten things up.`,
		);
	}

	if (params.domainAuthority != null && params.domainAuthority < 10) {
		parts.push(
			`Your Domain Authority is ${params.domainAuthority}/100 with ${params.linkingRootDomains ?? "very few"} sites linking to you. Building quality backlinks would be the single biggest lever for organic visibility.`,
		);
	}

	if (params.spamScore != null && params.spamScore > 30) {
		parts.push(
			`Your spam score came back at ${params.spamScore}/100, which is elevated. This typically means low-quality or irrelevant sites are linking to you, and it can quietly suppress your rankings.`,
		);
	}

	if (params.readabilityScore != null && params.readabilityScore < 45) {
		parts.push(
			`The copy reads at a difficulty level that may lose some visitors &mdash; simpler, more direct language tends to convert better for service businesses.`,
		);
	}

	const summary = parts.map((p) => `<p>${p}</p>`).join("");

	// Strengths — pick the best 3 from real data
	const strengths: string[] = [];
	if (performanceScore >= 90)
		strengths.push(`Strong ${performanceScore}/100 performance score`);
	if (seoScore >= 90)
		strengths.push(
			`${seoScore}/100 SEO score — Google can read your site clearly`,
		);
	if (accessibilityScore >= 90)
		strengths.push(
			`${accessibilityScore}/100 accessibility — inclusive and well-built`,
		);
	if (params.hasLocalBusinessSchema)
		strengths.push("LocalBusiness schema markup in place for local search");
	if (params.hasTelLink)
		strengths.push("Click-to-call link present for mobile visitors");
	if (params.sitemapExists)
		strengths.push(
			"XML sitemap found — helps search engines discover all pages",
		);
	if (params.hasCanonical) strengths.push("Canonical tag set correctly");
	if (
		params.metaTitleLength &&
		params.metaTitleLength >= 30 &&
		params.metaTitleLength <= 60
	)
		strengths.push("Page title is well-optimized for search");
	if (strengths.length < 3) strengths.push("Site is live and reachable");
	while (strengths.length > 3) strengths.pop();

	// Weaknesses — pick the most impactful 3
	const weaknesses: string[] = [];
	if (params.domainAuthority != null && params.domainAuthority < 10)
		weaknesses.push(
			`Domain Authority of ${params.domainAuthority}/100 — very low backlink authority`,
		);
	if (params.spamScore != null && params.spamScore > 30)
		weaknesses.push(
			`Spam score of ${params.spamScore}/100 — toxic backlinks may be hurting rankings`,
		);
	if (performanceScore < 90)
		weaknesses.push(
			`Performance score of ${performanceScore} — page loads slower than recommended`,
		);
	if (seoScore < 90)
		weaknesses.push(
			`SEO score of ${seoScore} — missing meta tags or heading structure`,
		);
	if (!params.hasForms && !params.hasTelLink)
		weaknesses.push(
			"No contact form or phone link — visitors have no easy way to reach you",
		);
	if (params.missingRecommendedSchema?.length)
		weaknesses.push(
			`Missing ${params.missingRecommendedSchema.join(" and ")} schema markup`,
		);
	if (params.readabilityScore != null && params.readabilityScore < 45)
		weaknesses.push(
			"Homepage copy is harder to read than ideal for a general audience",
		);
	if (params.wordCount != null && params.wordCount < 200)
		weaknesses.push(
			`Only ${params.wordCount} words on the homepage — too thin for search engines`,
		);
	while (weaknesses.length > 3) weaknesses.pop();
	while (weaknesses.length < 3)
		weaknesses.push("Additional optimization opportunities identified");

	// Actions — concrete and specific
	const actions: AiInsightResult["prioritizedActions"] = [];
	if (params.domainAuthority != null && params.domainAuthority < 15) {
		actions.push({
			priority: 1,
			action:
				"Start building quality backlinks from local directories, industry associations, and partner businesses to grow Domain Authority",
			impact: "high",
			effort: "high",
		});
	}
	if (performanceScore < 90) {
		actions.push({
			priority: actions.length + 1,
			action: `Optimize your largest contentful paint (currently ${lcp}) to under 2.5 seconds — compress images and defer non-critical scripts`,
			impact: "high",
			effort: "medium",
		});
	}
	if (!params.hasForms) {
		actions.push({
			priority: actions.length + 1,
			action:
				"Add a simple contact form to your homepage so visitors can reach you without picking up the phone",
			impact: "high",
			effort: "low",
		});
	}
	if (params.missingRecommendedSchema?.includes("FAQ")) {
		actions.push({
			priority: actions.length + 1,
			action:
				"Add FAQ schema to your service pages — this can earn rich snippets in Google search results",
			impact: "medium",
			effort: "low",
		});
	}
	if (
		params.metaDescriptionLength != null &&
		(params.metaDescriptionLength < 70 || params.metaDescriptionLength > 160)
	) {
		actions.push({
			priority: actions.length + 1,
			action:
				"Rewrite your meta description to 120-155 characters with a clear value proposition and call to action",
			impact: "medium",
			effort: "low",
		});
	}
	if (actions.length === 0) {
		actions.push({
			priority: 1,
			action: "Optimize largest contentful paint to under 2.5 seconds",
			impact: "high",
			effort: "medium",
		});
		actions.push({
			priority: 2,
			action:
				"Review and improve meta description for better click-through from search results",
			impact: "medium",
			effort: "low",
		});
		actions.push({
			priority: 3,
			action:
				"Ensure a clear call-to-action is visible above the fold on every page",
			impact: "high",
			effort: "low",
		});
	}

	// Conversion score — derive from real signals
	let conversionScore = 50;
	if (params.hasTelLink) conversionScore += 10;
	if (params.hasForms) conversionScore += 10;
	if (params.hasLocalBusinessSchema) conversionScore += 5;
	if (params.wordCount != null && params.wordCount > 300) conversionScore += 5;
	if (params.readabilityScore != null && params.readabilityScore >= 60)
		conversionScore += 5;
	conversionScore = Math.min(100, conversionScore);

	return {
		executiveSummary: summary,
		conversionScore,
		strengths,
		weaknesses,
		prioritizedActions: actions,
		copywritingAnalysis:
			"<p>The detailed copywriting analysis requires our AI reviewer, which was temporarily unavailable during this audit run. The scores and technical findings above are fully accurate. For a deep dive into your homepage messaging, request a re-run or reply to schedule a walkthrough.</p>",
	};
}
