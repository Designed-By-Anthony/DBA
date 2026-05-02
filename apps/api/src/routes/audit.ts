import { buildFallbackInsight, generateAiInsight } from "@dba/shared/lighthouse/lib/ai";
import { fireAuditLoggingWebhook } from "@dba/shared/lighthouse/lib/auditLoggingWebhook";
import { resolvePageSpeedLighthouse } from "@dba/shared/lighthouse/lib/auditPsi";
import { buildInternalAuthorityMetrics } from "@dba/shared/lighthouse/lib/authorityEstimate";
import {
	buildReceiptEmail,
	isGmailConfigured,
	sendViaGmail,
} from "@dba/shared/lighthouse/lib/gmail";
import { type HtmlScanResult, scanHtml } from "@dba/shared/lighthouse/lib/htmlScanner";
import { checkLocalRateLimit, getClientAddress } from "@dba/shared/lighthouse/lib/http";
import {
	estimateIndexCoverage,
	type IndexCheckResult,
} from "@dba/shared/lighthouse/lib/indexCheck";
import { type MozMetrics, scanMoz } from "@dba/shared/lighthouse/lib/mozAnalysis";
import {
	type Competitor,
	type PlacesResult,
	scanCompetitors,
	scanPlaces,
} from "@dba/shared/lighthouse/lib/places";
import { db, REPORTS_COLLECTION, Timestamp } from "@dba/shared/lighthouse/lib/report-store";
import { buildPrefix, buildReportId, randomSuffix } from "@dba/shared/lighthouse/lib/reportId";
import { type SitewideScanResult, scanSitewide } from "@dba/shared/lighthouse/lib/sitewideScan";
import {
	isResendConfigured,
	sendTransactionalEmail,
} from "@dba/shared/lighthouse/lib/transactionalResend";
import {
	normalizeEmail,
	normalizeHttpUrl,
	normalizeText,
} from "@dba/shared/lighthouse/lib/validation";
import { Elysia } from "elysia";
import { tryInsertLead } from "@dba/shared/lib/d1Leads";
import { postLeadIngest } from "@dba/shared/lib/leadWebhook";
import {
	resolveEffectiveSecretKey,
	verifyTurnstileToken,
} from "@dba/shared/lib/turnstile";

const AUDIT_RATE_LIMIT = 5;
const AUDIT_RATE_WINDOW_MS = 10 * 60_000;

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

export const auditRoute = new Elysia({ aot: false }).post(
	"/api/audit",
	async ({ request, set }) => {
		set.headers["Cache-Control"] = "no-store";

		const retryAfterSeconds = checkLocalRateLimit(
			`audit:${getClientAddress(request)}`,
			AUDIT_RATE_LIMIT,
			AUDIT_RATE_WINDOW_MS,
		);
		if (retryAfterSeconds) {
			set.status = 429;
			set.headers["Retry-After"] = String(retryAfterSeconds);
			return {
				error: `Too many audit requests. Please wait ${retryAfterSeconds} seconds and try again.`,
			};
		}

		let body: Record<string, unknown>;
		try {
			body = await request.json();
		} catch {
			set.status = 400;
			return { error: "Invalid request body." };
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
			set.status = 400;
			return { error: "Valid URL, name, company, and email are required." };
		}

		const turnstileSecret = resolveEffectiveSecretKey(
			process.env.TURNSTILE_SECRET_KEY?.trim(),
		);
		if (turnstileSecret) {
			const cfToken =
				typeof body.cf_turnstile_response === "string"
					? body.cf_turnstile_response.trim()
					: "";
			if (!cfToken) {
				set.status = 403;
				return {
					error:
						"Security check required. Please complete the challenge and try again.",
				};
			}
			const verification = await verifyTurnstileToken(cfToken, turnstileSecret);
			if (!verification.success) {
				set.status = 403;
				return {
					error:
						"Security check failed. Please refresh the page and try again.",
				};
			}
		}

		await tryInsertLead({
			id: crypto.randomUUID(),
			email,
			company_name: company,
			source: "Audit_Form",
			status: "New",
			turnstile_passed: turnstileSecret ? 1 : null,
			metadata: JSON.stringify({
				name,
				url,
				location,
			}),
			created_at: Date.now(),
		});

		try {
			const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY?.trim() || undefined;

			const [
				htmlResponseRaw,
				placesResponseRaw,
				sitewideResponseRaw,
				mozResponseRaw,
			] = await Promise.allSettled([
				scanHtml(url),
				scanPlaces(company, location),
				scanSitewide(url),
				scanMoz(url),
			]);

			const psiResolved = await resolvePageSpeedLighthouse(
				url,
				apiKey,
				readPageSpeedErrorMessage,
			);
			if (!psiResolved.ok) {
				if (psiResolved.retryAfter) {
					set.status = psiResolved.status;
					set.headers["Retry-After"] = psiResolved.retryAfter;
					return { error: psiResolved.error };
				}
				set.status = psiResolved.status;
				return { error: psiResolved.error };
			}

			const { lighthouse, psiDegradedReason, usedPartialFallback } =
				psiResolved.outcome;
			if (usedPartialFallback) {
				console.warn(
					"[audit] PageSpeed partial / degraded:",
					psiDegradedReason || "(no reason)",
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
			const mozFromApi: MozMetrics =
				mozResponseRaw.status === "fulfilled"
					? mozResponseRaw.value
					: defaultMoz;
			const mozData: MozMetrics =
				mozFromApi.found && mozFromApi.dataSource === "moz"
					? mozFromApi
					: buildInternalAuthorityMetrics(url, htmlData);

			const indexData: IndexCheckResult = estimateIndexCoverage(
				sitewideData.sitemap,
				mozFromApi.dataSource === "moz" && mozFromApi.found
					? mozFromApi
					: defaultMoz,
			);

			let competitors: Competitor[] = [];
			try {
				competitors = await scanCompetitors(
					company,
					location,
					placesData.primaryType,
					3,
				);
			} catch {
				/* competitor scan is best-effort — swallow errors silently */
			}

			const categories = lighthouse.categories;
			if (!categories) {
				set.status = 500;
				return { error: "Audit could not load performance categories." };
			}

			const toPct = (s: number | null | undefined): number | null => {
				if (s == null || Number.isNaN(s)) return null;
				return Math.round(s * 100);
			};
			const performanceScore = toPct(categories.performance?.score ?? null);
			const accessibilityScore = toPct(categories.accessibility?.score ?? null);
			const bestPracticesScore = toPct(
				categories["best-practices"]?.score ?? null,
			);
			const seoScore = toPct(categories.seo?.score ?? null);

			const audits = lighthouse.audits || {};
			const fcp = audits["first-contentful-paint"]?.displayValue || "N/A";
			const lcp = audits["largest-contentful-paint"]?.displayValue || "N/A";
			const tbt = audits["total-blocking-time"]?.displayValue || "N/A";
			const cls = audits["cumulative-layout-shift"]?.displayValue || "N/A";
			let failedAuditCount = 0;
			let criticalIssue = "";

			const hasLowScore =
				(performanceScore != null && performanceScore < 90) ||
				(accessibilityScore != null && accessibilityScore < 90) ||
				(bestPracticesScore != null && bestPracticesScore < 90) ||
				(seoScore != null && seoScore < 90);

			if (hasLowScore && audits && Object.keys(audits).length > 0) {
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

			const aiInsightResult =
				(await generateAiInsight({
					name,
					company,
					url,
					performanceScore: performanceScore ?? 0,
					accessibilityScore: accessibilityScore ?? 0,
					bestPracticesScore: bestPracticesScore ?? 0,
					seoScore: seoScore ?? 0,
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
					robotsTxtExists: sitewideData.robotsTxt.exists,
					robotsAllowsCrawlers: sitewideData.robotsTxt.allowsCrawlers,
					robotsDisallowedPaths: sitewideData.robotsTxt.disallowedPaths,
					sitemapExists: sitewideData.sitemap.exists,
					sitemapUrlCount: sitewideData.sitemap.urlCount,
					redirectChainLength: sitewideData.redirectChain.chainLength,
					redirectHttpToHttps: sitewideData.redirectChain.httpToHttps,
					httpRedirectsToHttps: sitewideData.redirectChain.httpRedirectsToHttps,
					domainAuthority: mozData.domainAuthority,
					spamScore: mozData.spamScore,
					linkingRootDomains: mozData.linkingRootDomains,
					externalBacklinks: mozData.externalBacklinks,
					authorityDataSource: mozData.dataSource,
					estimatedIndexedPages: indexData.estimatedIndexedPages,
					competitors,
					businessRating: placesData.rating,
					businessReviewCount: placesData.userRatingCount,
				})) ??
				buildFallbackInsight({
					performanceScore: performanceScore ?? 0,
					accessibilityScore: accessibilityScore ?? 0,
					seoScore: seoScore ?? 0,
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
			let mapsScore = 50;
			if (placesData.found && placesData.rating) {
				const ratingFactor = placesData.rating / 5.0;
				const countFactor = Math.min(placesData.userRatingCount / 50.0, 1.0);
				mapsScore = Math.round((ratingFactor * 0.7 + countFactor * 0.3) * 100);
			}
			const perfN = performanceScore ?? 50;
			const accN = accessibilityScore ?? 50;
			const seoN = seoScore ?? 50;
			const techScore = Math.round(perfN * 0.5 + accN * 0.25 + seoN * 0.25);

			let authorityScore = 50;
			if (mozData.found && mozData.domainAuthority != null) {
				authorityScore = mozData.domainAuthority;
				if (mozData.dataSource === "internal") {
					authorityScore = Math.round(authorityScore * 0.72);
				}
				if (mozData.spamScore != null && mozData.spamScore > 30) {
					const spamPenalty = Math.min((mozData.spamScore - 30) * 0.7, 40);
					authorityScore = Math.max(0, authorityScore - spamPenalty);
				}
			}

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
				psiDegradedReason: psiDegradedReason ?? null,
				lead: { name, email, company, url, location },
				scores: {
					trustScore,
					performance: performanceScore ?? null,
					accessibility: accessibilityScore ?? null,
					bestPractices: bestPracticesScore ?? null,
					seo: seoScore ?? null,
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
						httpRedirectsToHttps:
							sitewideData.redirectChain.httpRedirectsToHttps,
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

			// Fire-and-forget post-response tasks
			Promise.resolve().then(async () => {
				const tasks: Promise<unknown>[] = [];

				if (reportPersisted && (isGmailConfigured() || isResendConfigured())) {
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
							partialReportNote: psiDegradedReason,
						});
						if (isResendConfigured()) {
							tasks.push(
								sendTransactionalEmail({
									to: email,
									subject,
									html: emailHtml,
								}).catch((err) =>
									console.error(
										`Failed to dispatch Resend receipt for ${reportId}:`,
										err,
									),
								),
							);
						} else if (isGmailConfigured()) {
							tasks.push(
								sendViaGmail(email, subject, emailHtml)
									.then(() => {
										if (process.env.NODE_ENV === "development") {
																					}
									})
									.catch((err) =>
										console.error(
											`Failed to dispatch email for ${reportId}:`,
											err,
										),
									),
							);
						}
					} catch (emailErr) {
						console.error(
							"Error building receipt email in audit route:",
							emailErr,
						);
					}
				}

				const leadWebhook = process.env.LEAD_WEBHOOK_URL?.trim();
				const leadWebhookSecret = process.env.LEAD_WEBHOOK_SECRET?.trim();
				const reportPublicBase = (
					process.env.REPORT_PUBLIC_BASE_URL || "https://designedbyanthony.com"
				).replace(/\/$/, "");

				if (leadWebhook) {
					tasks.push(
						postLeadIngest(
							leadWebhook,
							{
								source: "lighthouse_audit",
								name,
								email,
								company,
								websiteUrl: url,
								auditReportUrl: `${reportPublicBase}/report/${reportId}`,
								trustScore,
								performanceScore: performanceScore ?? 0,
								accessibilityScore: accessibilityScore ?? 0,
								bestPracticesScore: bestPracticesScore ?? 0,
								seoScore: seoScore ?? 0,
							},
							{ secret: leadWebhookSecret },
						).catch((formError) => {
							console.error("LEAD_WEBHOOK_URL submission failed:", formError);
						}),
					);
				}

				if (process.env.AUDIT_LOGGING_WEBHOOK_URL?.trim()) {
					tasks.push(
						fireAuditLoggingWebhook({
							company,
							url,
							email,
							reportId,
							reportPublicBase,
							trustScore,
							performanceScore: performanceScore ?? 0,
							seoScore: seoScore ?? 0,
							accessibilityScore: accessibilityScore ?? 0,
							bestPracticesScore: bestPracticesScore ?? 0,
							psiNote: psiDegradedReason,
							failedAuditCount,
							criticalIssue,
							executiveSummary: aiInsightResult.executiveSummary,
							weaknesses: aiInsightResult.weaknesses,
							prioritizedActions: aiInsightResult.prioritizedActions,
							copywritingAnalysis: aiInsightResult.copywritingAnalysis,
						}),
					);
				}

				await Promise.allSettled(tasks);
			});

			return {
				success: true,
				reportId,
				reportPersisted,
				results: {
					url: lighthouse.finalUrl || url,
					trustScore,
					performance: performanceScore,
					accessibility: accessibilityScore,
					bestPractices: bestPracticesScore,
					seo: seoScore,
					conversion: conversionScore,
					metrics: { fcp, lcp, tbt, cls },
					psiDegradedReason: psiDegradedReason ?? null,
					aiInsight: payload.aiInsight,
					diagnostics: { failedAuditCount, criticalIssue },
					htmlSignals: payload.htmlSignals,
					sitewide: payload.sitewide,
					backlinks: mozData,
					indexCoverage: indexData,
					places: placesData,
					competitors,
				},
			};
		} catch (error: unknown) {
			const message =
				error instanceof Error && error.name === "AbortError"
					? "The audit timed out before PageSpeed finished responding. Please try again."
					: error instanceof Error
						? error.message
						: "Failed to process audit.";
			console.error("Audit Error:", error);
			set.status = 500;
			return { error: message };
		}
	},
);
