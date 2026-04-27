import { fetchWithTimeout } from "./http";

const MOZ_URL_METRICS_ENDPOINT = "https://lsapi.seomoz.com/v2/url_metrics";

export interface MozMetrics {
	found: boolean;
	domainAuthority: number | null;
	pageAuthority: number | null;
	spamScore: number | null;
	linkingRootDomains: number | null;
	externalBacklinks: number | null;
	pagesCrawled: number | null;
	lastCrawled: string | null;
	/** `moz` when from Moz API; `internal` when from first-party heuristic */
	dataSource?: "moz" | "internal";
	/** Short disclaimer for UI when not Moz */
	authorityLabel?: string;
}

const DEFAULT_MOZ: MozMetrics = {
	found: false,
	domainAuthority: null,
	pageAuthority: null,
	spamScore: null,
	linkingRootDomains: null,
	externalBacklinks: null,
	pagesCrawled: null,
	lastCrawled: null,
};

function getMozCredentials(): string | null {
	return process.env.MOZ_API_TOKEN || process.env.MOZ_API_CREDENTIALS || null;
}

export function isMozConfigured(): boolean {
	return getMozCredentials() !== null;
}

/**
 * Queries the Moz Links API v2 for domain-level backlink metrics.
 * Uses legacy Basic Auth if credentials contain ":", otherwise x-moz-token header.
 */
export async function scanMoz(url: string): Promise<MozMetrics> {
	const credentials = getMozCredentials();
	if (!credentials) return DEFAULT_MOZ;

	try {
		const domain = new URL(url).hostname.replace(/^www\./, "");

		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		const decoded = (() => {
			try {
				return atob(credentials);
			} catch {
				return credentials;
			}
		})();

		if (decoded.includes(":")) {
			headers.Authorization = `Basic ${credentials}`;
		} else {
			headers["x-moz-token"] = credentials;
		}

		const res = await fetchWithTimeout(
			MOZ_URL_METRICS_ENDPOINT,
			{
				method: "POST",
				headers,
				body: JSON.stringify({ targets: [domain] }),
			},
			12000,
		);

		if (!res.ok) {
			const errText = await res.text().catch(() => "");
			console.warn(`Moz API error (${res.status}):`, errText.substring(0, 200));
			return DEFAULT_MOZ;
		}

		const data = (await res.json()) as {
			results?: Array<{
				domain_authority?: number;
				page_authority?: number;
				spam_score?: number;
				root_domains_to_root_domain?: number;
				external_pages_to_root_domain?: number;
				pages_crawled_from_root_domain?: number;
				last_crawled?: string;
			}>;
		};

		const result = data.results?.[0];
		if (!result) return DEFAULT_MOZ;

		return {
			found: true,
			domainAuthority: result.domain_authority ?? null,
			pageAuthority: result.page_authority ?? null,
			spamScore: result.spam_score ?? null,
			linkingRootDomains: result.root_domains_to_root_domain ?? null,
			externalBacklinks: result.external_pages_to_root_domain ?? null,
			pagesCrawled: result.pages_crawled_from_root_domain ?? null,
			lastCrawled: result.last_crawled ?? null,
			dataSource: "moz",
		};
	} catch (err) {
		console.warn("Moz scan failed:", err instanceof Error ? err.message : err);
		return DEFAULT_MOZ;
	}
}
