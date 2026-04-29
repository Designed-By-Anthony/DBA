import type { HtmlScanResult } from "./htmlScanner";
import type { MozMetrics } from "./mozAnalysis";

/**
 * First-party authority snapshot when Moz (or similar) is not configured.
 * Not comparable to Moz DA — a bounded heuristic from the same HTML fetch
 * we already perform (external link graph, content depth, HTTPS, schema).
 */
export function buildInternalAuthorityMetrics(
	url: string,
	html: HtmlScanResult,
): MozMetrics {
	let host = "";
	try {
		host = new URL(url).hostname.replace(/^www\./, "");
	} catch {
		host = "";
	}

	const ext = Math.max(0, html.externalLinkCount);
	const internal = Math.max(0, html.internalLinkCount);
	const linkMass = ext + Math.floor(internal * 0.15);
	// Log-scaled contribution from link counts (no third-party index).
	const linkScore = Math.min(26, Math.round(Math.log10(linkMass + 10) * 9));

	let da = 20 + linkScore;
	if (html.hasHttps) da += 4;
	if (html.hasCanonical) da += 3;
	if (html.wordCount >= 400) da += 4;
	if (html.hasLocalBusinessSchema) da += 7;
	if (html.schemaTypes.length >= 2) da += 2;
	da = Math.min(62, Math.max(18, da));

	const linkingRoots = Math.min(5000, Math.round(ext * 0.35 + internal * 0.04));

	return {
		found: true,
		domainAuthority: da,
		pageAuthority: Math.round(da * 0.92),
		spamScore: null,
		linkingRootDomains: linkingRoots > 0 ? linkingRoots : null,
		externalBacklinks: ext > 0 ? ext : null,
		pagesCrawled: null,
		lastCrawled: null,
		dataSource: "internal",
		authorityLabel: host
			? `Estimated for ${host}`
			: "Estimated from on-page signals",
	};
}
