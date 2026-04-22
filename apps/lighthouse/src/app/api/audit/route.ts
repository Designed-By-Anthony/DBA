import { after, NextResponse } from "next/server";
import { buildFallbackInsight, generateAiInsight } from "@/lib/ai";
import {
	buildReceiptEmail,
	isGmailConfigured,
	sendViaGmail,
} from "@/lib/gmail";
import { type HtmlScanResult, scanHtml } from "@/lib/htmlScanner";
import {
	buildCorsHeaders,
	checkLocalRateLimit,
	fetchWithTimeout,
	getClientAddress,
} from "@/lib/http";
import { estimateIndexCoverage, type IndexCheckResult } from "@/lib/indexCheck";
import { type MozMetrics, scanMoz } from "@/lib/mozAnalysis";
import {
	type Competitor,
	type PlacesResult,
	scanCompetitors,
	scanPlaces,
} from "@/lib/places";
import { db, REPORTS_COLLECTION, Timestamp } from "@/lib/report-store";
import { buildPrefix, buildReportId, randomSuffix } from "@/lib/reportId";
import { createProjectSheet, pushLeadRow } from "@/lib/sheetsSync";
import { type SitewideScanResult, scanSitewide } from "@/lib/sitewideScan";
import { verifyTurnstileToken } from "@/lib/turnstile";
import {
	normalizeEmail,
	normalizeHttpUrl,
	normalizeText,
} from "@/lib/validation";

export const runtime = "nodejs";

const AUDIT_RATE_LIMIT = 5;
const AUDIT_RATE_WINDOW_MS = 10 * 60_000;
const PSI_TIMEOUT_MS = 20_000;

/** Best-effort parse of PageSpeed Insights JSON error bodies (HTTP 4xx/5xx). */
async function readPageSpeedErrorMessage(
	response: Response,
): Promise<string | undefined> {
	try {
		const data = (await response.json()) as { error?: { message?: string } };
		return typeof data?.error?.message === "string"
			? data.error.message
			: undefined;
	} catch {
		return undefined;
	}
}

/**
 * Writes the report to the in-memory store with collision-safe ID generation.
 * Uses `doc.create()` which fails if the doc already exists, and retries
 * up to 3 times with a fresh random suffix if there's a collision.
 */
async function createReportWithUniqueId(
	prefix: string,
	payload: Record<string, unknown>,
): Promise<string> {
	for (let attempt = 0; attempt < 3; attempt++) {
		const id = `DBA-${prefix}${randomSuffix()}`;
		const ref = db.collection(REPORTS_COLLECTION).doc(id);
		try {
			await ref.create({ ...payload, id });
			return id;
		} catch (err) {
			const code = (err as { code?: number | string })?.code;
			if (code === 6 || code === "already-exists") continue;
			throw err;
		}
	}

	throw new Error("Failed to generate unique report ID after 3 attempts");
}

export async function POST(request: Request) {
	const corsHeaders = buildCorsHeaders(request, "POST, OPTIONS");
	const responseHeaders = { ...corsHeaders, "Cache-Control": "no-store" };

	try {
		const retryAfterSeconds = checkLocalRateLimit(
			`audit:${getClientAddress(request)}`,
			AUDIT_RATE_LIMIT,
			AUDIT_RATE_WINDOW_MS,
		);
		if (retryAfterSeconds) {
			return NextResponse.json(
				{
					error: `Too many audit requests. Please wait ${retryAfterSeconds} seconds and try again.`,
				},
				{
					status: 429,
					headers: {
						...responseHeaders,
						"Retry-After": String(retryAfterSeconds),
					},
				},
			);
		}

		let body: Record<string, unknown>;
		try {
			body = await request.json();
		} catch {
			return NextResponse.json(
				{ error: "Invalid request body." },
				{ status: 400, headers: responseHeaders },
			);
		}

		const turnstileToken =
			typeof body.turnstileToken === "string" ? body.turnstileToken : "";
		const clientIp = getClientAddress(request);
		const turnstile = await verifyTurnstileToken(turnstileToken, clientIp);
		if (!turnstile.success) {
			return NextResponse.json(
				{
					error:
						"Bot verification failed. Please refresh the page and try again.",
				},
				{ status: 403, headers: responseHeaders },
			);
		}

		const url = normalizeHttpUrl(body.url);
		const email = normalizeEmail(body.email);
		const name = normalizeText(body.name, 120);
		const company = normalizeText(body.company, 160);
		const location =
			typeof body.location === "string"
				? normalizeText(body.location, 160)
				: "";

		if (!url || !email || !name || !company) {
			return NextResponse.json(
				{ error: "Valid URL, name, company, and email are required." },
				{ status: 400, headers: responseHeaders },
			);
		}

		const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
		const strategy = "mobile";
		let psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO`;
		if (apiKey) psiUrl += `&key=${apiKey}`;

		const psiPromise = fetchWithTimeout(
			psiUrl,
			{
				cache: "no-store",
				headers: {
					Accept: "application/json",
				},
			},
			PSI_TIMEOUT_MS,
		);

		// Phase 1: Run PSI, HTML scan, Places, sitewide scan, and Moz concurrently
		const [
			psiResponseRaw,
			htmlResponseRaw,
			placesResponseRaw,
			sitewideResponseRaw,
			mozResponseRaw,
		] = await Promise.allSettled([
			psiPromise,
			scanHtml(url),
			scanPlaces(company, location),
			scanSitewide(url),
			scanMoz(url),
		]);

		if (psiResponseRaw.status === "rejected") {
			throw new Error("Google PageSpeed API failed or timed out.");
		}

		const psiResponse = psiResponseRaw.value;
		if (!psiResponse.ok) {
			const apiDetail = await readPageSpeedErrorMessage(psiResponse);
			console.error(
				"PageSpeed Insights HTTP error:",
				psiResponse.status,
				apiDetail || "(no body message)",
			);

			if (psiResponse.status === 429) {
				return NextResponse.json(
					{
						error:
							"Our audit service hit the PageSpeed Insights rate limit. Please try again in a few minutes.",
					},
					{
						status: 503,
						headers: {
							...responseHeaders,
							"Retry-After": "120",
						},
					},
				);
			}

			if (psiResponse.status === 403) {
				return NextResponse.json(
					{
						error:
							"PageSpeed Insights rejected this request (API access). Please contact support if this continues.",
					},
					{ status: 502, headers: responseHeaders },
				);
			}

			const hint =
				psiResponse.status >= 500
					? "The PageSpeed service had a temporary error. Please try again shortly."
					: "PageSpeed Insights could not analyze this URL. Check that it is public and reachable.";

			return NextResponse.json(
				{ error: hint },
				{
					status: psiResponse.status === 400 ? 400 : 502,
					headers: responseHeaders,
				},
			);
		}

		const defaultHtml: HtmlScanResult = {
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
			missingRecommendedSchema: [
				"LocalBusiness",
				"Organization",
				"WebSite",
				"BreadcrumbList",
				"FAQ",
			],
			imgsWithLazyLoad: 0,
			imgsWithDimensions: 0,
			imgsWithSrcset: 0,
			imgsModernFormat: 0,
			readabilityScore: null,
			readingLevel: null,
		};
		const htmlData: HtmlScanResult =
			htmlResponseRaw.status === "fulfilled"
				? htmlResponseRaw.value
				: defaultHtml;
		const placesData: PlacesResult =
			placesResponseRaw.status === "fulfilled"
				? placesResponseRaw.value
				: {
						found: false,
						rating: null,
						userRatingCount: 0,
						businessStatus: null,
						primaryType: null,
					};

		const defaultSitewide: SitewideScanResult = {
			robotsTxt: {
				exists: false,
				content: "",
				disallowedPaths: [],
				allowsCrawlers: true,
				sitemapUrls: [],
			},
			sitemap: {
				exists: false,
				urlCount: 0,
				sampleUrls: [],
				parseFailed: false,
			},
			redirectChain: {
				hops: [],
				finalUrl: url,
				chainLength: 0,
				hasMixedContent: false,
				httpToHttps: false,
				wwwRedirect: false,
				httpRedirectsToHttps: false,
				httpRedirectStatus: null,
			},
		};
		const sitewideData: SitewideScanResult =
			sitewideResponseRaw.status === "fulfilled"
				? sitewideResponseRaw.value
				: defaultSitewide;

		const defaultMoz: MozMetrics = {
			found: false,
			domainAuthority: null,
			pageAuthority: null,
			spamScore: null,
			linkingRootDomains: null,
			externalBacklinks: null,
			pagesCrawled: null,
			lastCrawled: null,
		};
		const mozData: MozMetrics =
			mozResponseRaw.status === "fulfilled" ? mozResponseRaw.value : defaultMoz;

		// Derive index coverage from sitemap + Moz data (no external API call needed)
		const indexData: IndexCheckResult = estimateIndexCoverage(
			sitewideData.sitemap,
			mozData,
		);

		// Phase 2: Run competitor scan (needs primaryType from Places result)
		let competitors: Competitor[] = [];
		try {
			competitors = await scanCompetitors(
				company,
				location,
				placesData.primaryType,
				3,
			);
		} catch (compErr) {
			console.warn("Competitor scan failed:", compErr);
		}

		type PsiCategory = { score?: number | null };
		type LighthousePayload = {
			categories?: {
				performance?: PsiCategory;
				accessibility?: PsiCategory;
				"best-practices"?: PsiCategory;
				seo?: PsiCategory;
			};
			audits?: Record<
				string,
				{
					score?: number | null;
					scoreDisplayMode?: string;
					title?: string;
					id?: string;
					displayValue?: string;
				}
			>;
			finalUrl?: string;
		};

		let psiData: {
			lighthouseResult?: LighthousePayload;
			error?: { message?: string };
		};
		try {
			psiData = await psiResponse.json();
		} catch {
			return NextResponse.json(
				{ error: "Invalid response from PageSpeed Insights." },
				{ status: 502, headers: responseHeaders },
			);
		}

		const lighthouse = psiData.lighthouseResult;
		if (!lighthouse?.categories) {
			const msg = psiData.error?.message;
			console.error(
				"PageSpeed response missing lighthouseResult:",
				msg || psiData,
			);
			return NextResponse.json(
				{
					error:
						msg?.includes("Quota") || msg?.includes("quota")
							? "PageSpeed Insights quota was exceeded. Please try again later."
							: "PageSpeed Insights did not return audit data for this URL.",
				},
				{ status: 503, headers: { ...responseHeaders, "Retry-After": "120" } },
			);
		}

		const categories = lighthouse.categories;
		const performanceScore = Math.round(
			(categories.performance?.score || 0) * 100,
		);
		const accessibilityScore = Math.round(
			(categories.accessibility?.score || 0) * 100,
		);
		const bestPracticesScore = Math.round(
			(categories["best-practices"]?.score || 0) * 100,
		);
		const seoScore = Math.round((categories.seo?.score || 0) * 100);

		const audits = lighthouse.audits || {};
		const fcp = audits["first-contentful-paint"]?.displayValue || "N/A";
		const lcp = audits["largest-contentful-paint"]?.displayValue || "N/A";
		const tbt = audits["total-blocking-time"]?.displayValue || "N/A";
		const cls = audits["cumulative-layout-shift"]?.displayValue || "N/A";
		let failedAuditCount = 0;
		let criticalIssue = "";

		const hasLowScore =
			performanceScore < 90 ||
			accessibilityScore < 90 ||
			bestPracticesScore < 90 ||
			seoScore < 90;

		if (hasLowScore) {
			for (const key in audits) {
				const audit = audits[key];
				if (
					typeof audit.score === "number" &&
					audit.score < 0.5 &&
					audit.scoreDisplayMode !== "informative" &&
					audit.scoreDisplayMode !== "manual"
				) {
					failedAuditCount++;
					if (
						!criticalIssue &&
						audit.title &&
						!audit.id?.includes("contentful-paint")
					) {
						criticalIssue = audit.title.toLowerCase();
					}
				}
			}
		}

		// Phase 3: AI analysis with ALL data
		const aiInsightResult =
			(await generateAiInsight({
				name,
				company,
				url,
				performanceScore,
				accessibilityScore,
				bestPracticesScore,
				seoScore,
				fcp,
				lcp,
				tbt,
				cls,
				failedAuditCount,
				criticalIssue,
				bodyText: htmlData.bodyText,
				metaTitle: htmlData.metaTitle,
				metaDescription: htmlData.metaDescription,
				h1Text: htmlData.h1Text,
				h1Count: htmlData.h1Count,
				imgsMissingAlt: htmlData.imgsMissingAlt,
				imgCount: htmlData.imgCount,
				hasHttps: htmlData.hasHttps,
				hasForms: htmlData.hasForms,
				hasTelLink: htmlData.hasTelLink,
				hasLocalBusinessSchema: htmlData.hasLocalBusinessSchema,
				hasSocialLinks: htmlData.hasSocialLinks,
				ctaCount: htmlData.ctaCount,
				wordCount: htmlData.wordCount,
				// Expanded on-page signals
				h2Count: htmlData.h2Count,
				h3Count: htmlData.h3Count,
				headingHierarchyValid: htmlData.headingHierarchyValid,
				hasCanonical: htmlData.hasCanonical,
				ogTitle: htmlData.ogTitle,
				ogImage: htmlData.ogImage,
				hasNoIndex: htmlData.hasNoIndex,
				hasNoFollow: htmlData.hasNoFollow,
				hasViewport: htmlData.hasViewport,
				langAttribute: htmlData.langAttribute,
				hasFavicon: htmlData.hasFavicon,
				internalLinkCount: htmlData.internalLinkCount,
				externalLinkCount: htmlData.externalLinkCount,
				metaTitleLength: htmlData.metaTitleLength,
				metaDescriptionLength: htmlData.metaDescriptionLength,
				// Performance + security
				ttfbMs: htmlData.ttfbMs,
				mixedContentCount: htmlData.mixedContentCount,
				// Schema deep dive
				schemaTypes: htmlData.schemaTypes,
				missingRecommendedSchema: htmlData.missingRecommendedSchema,
				// Image optimization
				imgsWithLazyLoad: htmlData.imgsWithLazyLoad,
				imgsWithDimensions: htmlData.imgsWithDimensions,
				imgsWithSrcset: htmlData.imgsWithSrcset,
				imgsModernFormat: htmlData.imgsModernFormat,
				// Content readability
				readabilityScore: htmlData.readabilityScore,
				readingLevel: htmlData.readingLevel,
				// Sitewide crawlability signals
				robotsTxtExists: sitewideData.robotsTxt.exists,
				robotsAllowsCrawlers: sitewideData.robotsTxt.allowsCrawlers,
				robotsDisallowedPaths: sitewideData.robotsTxt.disallowedPaths,
				sitemapExists: sitewideData.sitemap.exists,
				sitemapUrlCount: sitewideData.sitemap.urlCount,
				redirectChainLength: sitewideData.redirectChain.chainLength,
				redirectHttpToHttps: sitewideData.redirectChain.httpToHttps,
				httpRedirectsToHttps: sitewideData.redirectChain.httpRedirectsToHttps,
				// Backlink / authority signals
				domainAuthority: mozData.domainAuthority,
				spamScore: mozData.spamScore,
				linkingRootDomains: mozData.linkingRootDomains,
				externalBacklinks: mozData.externalBacklinks,
				// Index coverage
				estimatedIndexedPages: indexData.estimatedIndexedPages,
				// Competitor + reputation data
				competitors,
				businessRating: placesData.rating,
				businessReviewCount: placesData.userRatingCount,
			})) ??
			buildFallbackInsight({
				performanceScore,
				accessibilityScore,
				seoScore,
				lcp,
				domainAuthority: mozData.domainAuthority,
				spamScore: mozData.spamScore,
				linkingRootDomains: mozData.linkingRootDomains,
				sitemapExists: sitewideData.sitemap.exists,
				hasCanonical: htmlData.hasCanonical,
				hasLocalBusinessSchema: htmlData.hasLocalBusinessSchema,
				hasTelLink: htmlData.hasTelLink,
				hasForms: htmlData.hasForms,
				readabilityScore: htmlData.readabilityScore,
				missingRecommendedSchema: htmlData.missingRecommendedSchema,
				wordCount: htmlData.wordCount,
				h1Count: htmlData.h1Count,
				metaTitleLength: htmlData.metaTitleLength,
				metaDescriptionLength: htmlData.metaDescriptionLength,
			});

		// Calculate Local Trust Score
		// 20% Maps, 35% Tech, 15% Conversion, 20% Authority, 10% Crawlability
		let mapsScore = 50;
		if (placesData.found && placesData.rating) {
			const ratingFactor = placesData.rating / 5.0;
			const countFactor = Math.min(placesData.userRatingCount / 50.0, 1.0);
			mapsScore = Math.round((ratingFactor * 0.7 + countFactor * 0.3) * 100);
		}
		const techScore = Math.round(
			performanceScore * 0.5 + accessibilityScore * 0.25 + seoScore * 0.25,
		);

		// Authority score: DA normalized, penalized by spam score
		let authorityScore = 50;
		if (mozData.found && mozData.domainAuthority != null) {
			authorityScore = mozData.domainAuthority;
			if (mozData.spamScore != null && mozData.spamScore > 30) {
				const spamPenalty = Math.min((mozData.spamScore - 30) * 0.7, 40);
				authorityScore = Math.max(0, authorityScore - spamPenalty);
			}
		}

		// Crawlability health: binary checks worth 0-100
		let crawlabilityScore = 0;
		const crawlChecks = [
			sitewideData.sitemap.exists,
			sitewideData.robotsTxt.exists && sitewideData.robotsTxt.allowsCrawlers,
			!htmlData.hasNoIndex,
			htmlData.hasCanonical,
			sitewideData.redirectChain.httpRedirectsToHttps || htmlData.hasHttps,
		];
		crawlabilityScore = Math.round(
			(crawlChecks.filter(Boolean).length / crawlChecks.length) * 100,
		);

		const trustScore = Math.round(
			mapsScore * 0.2 +
				techScore * 0.35 +
				aiInsightResult.conversionScore * 0.15 +
				authorityScore * 0.2 +
				crawlabilityScore * 0.1,
		);

		const conversionScore = aiInsightResult.conversionScore;

		const now = Timestamp.now();
		const payload = {
			createdAt: now,
			lead: {
				name,
				email,
				company,
				url,
				location,
			},
			scores: {
				trustScore,
				performance: performanceScore,
				accessibility: accessibilityScore,
				bestPractices: bestPracticesScore,
				seo: seoScore,
				conversion: conversionScore,
			},
			metrics: { fcp, lcp, tbt, cls },
			diagnostics: { failedAuditCount, criticalIssue },
			aiInsight: {
				executiveSummary: aiInsightResult.executiveSummary,
				conversionScore: aiInsightResult.conversionScore,
				strengths: aiInsightResult.strengths,
				weaknesses: aiInsightResult.weaknesses,
				prioritizedActions: aiInsightResult.prioritizedActions,
				copywritingAnalysis: aiInsightResult.copywritingAnalysis,
			},
			htmlSignals: {
				hasLocalBusinessSchema: htmlData.hasLocalBusinessSchema,
				hasTelLink: htmlData.hasTelLink,
				hasSocialLinks: htmlData.hasSocialLinks,
				metaTitle: htmlData.metaTitle,
				metaDescription: htmlData.metaDescription,
				metaTitleLength: htmlData.metaTitleLength,
				metaDescriptionLength: htmlData.metaDescriptionLength,
				h1Count: htmlData.h1Count,
				h1Text: htmlData.h1Text,
				h2Count: htmlData.h2Count,
				h3Count: htmlData.h3Count,
				h4PlusCount: htmlData.h4PlusCount,
				headingHierarchyValid: htmlData.headingHierarchyValid,
				imgCount: htmlData.imgCount,
				imgsMissingAlt: htmlData.imgsMissingAlt,
				hasHttps: htmlData.hasHttps,
				hasForms: htmlData.hasForms,
				ctaCount: htmlData.ctaCount,
				externalLinkCount: htmlData.externalLinkCount,
				internalLinkCount: htmlData.internalLinkCount,
				wordCount: htmlData.wordCount,
				hasCanonical: htmlData.hasCanonical,
				canonicalUrl: htmlData.canonicalUrl,
				ogTitle: htmlData.ogTitle,
				ogDescription: htmlData.ogDescription,
				ogImage: htmlData.ogImage,
				twitterCard: htmlData.twitterCard,
				robotsMeta: htmlData.robotsMeta,
				hasNoIndex: htmlData.hasNoIndex,
				hasNoFollow: htmlData.hasNoFollow,
				hasViewport: htmlData.hasViewport,
				langAttribute: htmlData.langAttribute,
				hasFavicon: htmlData.hasFavicon,
				ttfbMs: htmlData.ttfbMs,
				mixedContentCount: htmlData.mixedContentCount,
				schemaTypes: htmlData.schemaTypes,
				missingRecommendedSchema: htmlData.missingRecommendedSchema,
				imgsWithLazyLoad: htmlData.imgsWithLazyLoad,
				imgsWithDimensions: htmlData.imgsWithDimensions,
				imgsWithSrcset: htmlData.imgsWithSrcset,
				imgsModernFormat: htmlData.imgsModernFormat,
				readabilityScore: htmlData.readabilityScore,
				readingLevel: htmlData.readingLevel,
			},
			sitewide: {
				robotsTxt: {
					exists: sitewideData.robotsTxt.exists,
					allowsCrawlers: sitewideData.robotsTxt.allowsCrawlers,
					disallowedPaths: sitewideData.robotsTxt.disallowedPaths,
					sitemapUrls: sitewideData.robotsTxt.sitemapUrls,
				},
				sitemap: sitewideData.sitemap,
				redirectChain: {
					chainLength: sitewideData.redirectChain.chainLength,
					finalUrl: sitewideData.redirectChain.finalUrl,
					hasMixedContent: sitewideData.redirectChain.hasMixedContent,
					httpToHttps: sitewideData.redirectChain.httpToHttps,
					wwwRedirect: sitewideData.redirectChain.wwwRedirect,
					httpRedirectsToHttps: sitewideData.redirectChain.httpRedirectsToHttps,
					httpRedirectStatus: sitewideData.redirectChain.httpRedirectStatus,
				},
			},
			backlinks: mozData,
			indexCoverage: indexData,
			places: placesData,
			competitors,
			views: 0,
			lastViewedAt: null,
			emailSentCount: 0,
			emailLastSentAt: null,
			source: "Free Audit App",
			userAgent: request.headers.get("user-agent") || "",
		};

		const prefix = buildPrefix(company, url);
		let reportId: string;
		let reportPersisted = true;
		try {
			reportId = await createReportWithUniqueId(prefix, payload);
		} catch (fsErr) {
			console.error(
				"Report store write failed:",
				fsErr instanceof Error ? fsErr.message : fsErr,
			);
			reportId = buildReportId(company, url);
			reportPersisted = false;
		}

		after(async () => {
			const tasks: Promise<unknown>[] = [
				pushLeadRow({
					reportId,
					name,
					email,
					company,
					location,
					url,
					trustScore,
					performance: performanceScore,
					accessibility: accessibilityScore,
					bestPractices: bestPracticesScore,
					seo: seoScore,
					conversion: conversionScore,
					rating: placesData.rating,
					lcp,
					failedAuditCount,
					criticalIssue,
				}),
			];

			// Automatically trigger email receipt on completion if Gmail is setup
			if (reportPersisted && isGmailConfigured()) {
				try {
					const firstName = (name || "").split(" ")[0];
					const { subject, html: emailHtml } = buildReceiptEmail({
						firstName,
						url,
						reportId,
						trustScore,
						performance: performanceScore,
						accessibility: accessibilityScore,
						bestPractices: bestPracticesScore,
						seo: seoScore,
					});
					const sendPromise = sendViaGmail(email, subject, emailHtml)
						.then(() => {
							if (process.env.NODE_ENV === "development") {
								console.info(`Email receipt dispatched for ${reportId}`);
							}
						})
						.catch((err) =>
							console.error(`Failed to dispatch email for ${reportId}:`, err),
						);
					tasks.push(sendPromise);
				} catch (emailErr) {
					console.error(
						"Error building receipt email in audit route:",
						emailErr,
					);
				}
			}

			// Dispatch to the central Agency OS Webhook (CRM) to capture the Lead fully natively.
			// No-op when the webhook env vars are not configured (e.g. preview deploys or
			// deployments without a CRM target) — do NOT fall back to a hard-coded URL.
			const osWebhook = process.env.AGENCY_OS_WEBHOOK_URL;
			const osSecret = process.env.AGENCY_OS_WEBHOOK_SECRET;
			const reportPublicBase = (
				process.env.REPORT_PUBLIC_BASE_URL || "https://designedbyanthony.com"
			).replace(/\/$/, "");

			if (osWebhook && osSecret) {
				tasks.push(
					fetchWithTimeout(
						osWebhook,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Accept: "application/json",
								"x-lead-secret": osSecret,
							},
							body: JSON.stringify({
								email,
								name,
								company,
								websiteUrl: url,
								source: "audit",
								auditReportUrl: `${reportPublicBase}/report/${reportId}`,
								trustScore,
								performanceScore,
							}),
						},
						10_000,
					).catch((formError) => {
						console.error("Agency OS Webhook submission failed:", formError);
					}),
				);
			}

			// Create project-level Google Sheet for this lead
			await createProjectSheet({
				projectCode: reportId,
				source: "audit",
				name,
				email,
				company,
				url,
				location,
				trustScore,
				performance: performanceScore,
				accessibility: accessibilityScore,
				bestPractices: bestPracticesScore,
				seo: seoScore,
				conversion: conversionScore,
				rating: placesData.rating,
				reviewCount: placesData.userRatingCount,
				fcp,
				lcp,
				tbt,
				cls,
				failedAuditCount,
				criticalIssue,
				executiveSummary: aiInsightResult.executiveSummary,
				strengths: aiInsightResult.strengths,
				weaknesses: aiInsightResult.weaknesses,
				prioritizedActions: aiInsightResult.prioritizedActions,
			}).catch((sheetErr) => {
				console.error("Project sheet creation failed:", sheetErr);
				return null;
			});

			// Send internal lead alert to Anthony relies purely on AgencyOS CRM Pipeline mapping now. (Removed email duplication).

			await Promise.allSettled(tasks);
		});

		const results = {
			url: lighthouse.finalUrl || url,
			trustScore,
			performance: performanceScore,
			accessibility: accessibilityScore,
			bestPractices: bestPracticesScore,
			seo: seoScore,
			conversion: conversionScore,
			metrics: { fcp, lcp, tbt, cls },
			aiInsight: payload.aiInsight,
			diagnostics: { failedAuditCount, criticalIssue },
			htmlSignals: payload.htmlSignals,
			sitewide: payload.sitewide,
			backlinks: mozData,
			indexCoverage: indexData,
			places: placesData,
			competitors,
		};

		return NextResponse.json(
			{ success: true, reportId, reportPersisted, results },
			{ headers: responseHeaders },
		);
	} catch (error: unknown) {
		const message =
			error instanceof Error && error.name === "AbortError"
				? "The audit timed out before PageSpeed finished responding. Please try again."
				: error instanceof Error
					? error.message
					: "Failed to process audit.";

		console.error("Audit Error:", error);
		return NextResponse.json(
			{ error: message },
			{ status: 500, headers: responseHeaders },
		);
	}
}

export async function OPTIONS(request: Request) {
	const corsHeaders = buildCorsHeaders(request, "POST, OPTIONS");
	return new Response(null, {
		status: 204,
		headers: corsHeaders,
	});
}
