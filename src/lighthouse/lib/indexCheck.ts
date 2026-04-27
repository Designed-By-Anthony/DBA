import type { MozMetrics } from "./mozAnalysis";
import type { SitemapResult } from "./sitewideScan";

export interface IndexCheckResult {
	found: boolean;
	estimatedIndexedPages: number | null;
	sitemapPageCount: number | null;
	mozPagesCrawled: number | null;
	source: "sitemap+moz" | "sitemap" | "moz" | "none";
}

const DEFAULT_INDEX: IndexCheckResult = {
	found: false,
	estimatedIndexedPages: null,
	sitemapPageCount: null,
	mozPagesCrawled: null,
	source: "none",
};

/**
 * Estimates index coverage by combining sitemap URL count with
 * Moz's crawled-pages metric. No external API call needed — both
 * data sources are already collected during the audit.
 */
export function estimateIndexCoverage(
	sitemap: SitemapResult,
	moz: MozMetrics,
): IndexCheckResult {
	const sitemapCount =
		sitemap.exists && sitemap.urlCount > 0 ? sitemap.urlCount : null;
	const mozCount =
		moz.found && moz.pagesCrawled != null && moz.pagesCrawled > 0
			? moz.pagesCrawled
			: null;

	if (!sitemapCount && !mozCount) return DEFAULT_INDEX;

	let estimate: number;
	let source: IndexCheckResult["source"];

	if (sitemapCount && mozCount) {
		// Use the higher of the two — sitemap declares intent, Moz shows discovery
		estimate = Math.max(sitemapCount, mozCount);
		source = "sitemap+moz";
	} else if (sitemapCount) {
		estimate = sitemapCount;
		source = "sitemap";
	} else {
		estimate = mozCount ?? 0;
		source = "moz";
	}

	return {
		found: true,
		estimatedIndexedPages: estimate,
		sitemapPageCount: sitemapCount,
		mozPagesCrawled: mozCount,
		source,
	};
}
