import { fetchPageSpeedRunPagespeed } from "./pageSpeedInsights";

export type LighthouseCategoryBlock = { score?: number | null };
export type LighthouseAuditEntry = {
	score?: number | null;
	scoreDisplayMode?: string;
	title?: string;
	id?: string;
	displayValue?: string;
};

export type LighthousePayload = {
	categories?: {
		performance?: LighthouseCategoryBlock;
		accessibility?: LighthouseCategoryBlock;
		"best-practices"?: LighthouseCategoryBlock;
		seo?: LighthouseCategoryBlock;
	};
	audits?: Record<string, LighthouseAuditEntry>;
	finalUrl?: string;
};

export const PSI_PARTIAL_REASON =
	"PageSpeed Insights did not return usable lab scores (timeout, rate limit, or incomplete response). Your report still includes on-page SEO, crawl signals, and the AI summary where available.";

function emptyLighthouse(finalUrl: string): LighthousePayload {
	return {
		categories: {
			performance: { score: null },
			accessibility: { score: null },
			"best-practices": { score: null },
			seo: { score: null },
		},
		audits: {},
		finalUrl,
	};
}

async function readJsonBody(
	response: Response,
): Promise<{ data: unknown; parseOk: boolean }> {
	try {
		return { data: await response.json(), parseOk: true };
	} catch {
		return { data: null, parseOk: false };
	}
}

export type ResolvePsiOutcome = {
	lighthouse: LighthousePayload;
	psiDegradedReason: string | null;
	/** When true, skip strict HTTP error returns (caller still handles 429 specially before this). */
	usedPartialFallback: boolean;
};

/**
 * Best-effort PageSpeed fetch: on failure, returns empty categories so the audit
 * pipeline can continue (HTML, sitewide, AI, etc.).
 */
export async function resolvePageSpeedLighthouse(
	targetUrl: string,
	apiKey: string | undefined,
	readPageSpeedErrorMessage: (r: Response) => Promise<string | undefined>,
): Promise<
	| { ok: true; outcome: ResolvePsiOutcome }
	| {
			ok: false;
			status: number;
			error: string;
			retryAfter?: string;
	  }
> {
	const settled = await Promise.allSettled([
		fetchPageSpeedRunPagespeed(targetUrl, apiKey),
	]);

	if (settled[0].status === "rejected") {
		return {
			ok: true,
			outcome: {
				lighthouse: emptyLighthouse(targetUrl),
				psiDegradedReason: PSI_PARTIAL_REASON,
				usedPartialFallback: true,
			},
		};
	}

	const psiResponse = settled[0].value;

	if (psiResponse.status === 429) {
		return {
			ok: false,
			status: 503,
			error:
				"Our audit service hit the PageSpeed Insights rate limit. Please try again in a few minutes.",
			retryAfter: "120",
		};
	}

	if (!psiResponse.ok) {
		if (psiResponse.status === 403) {
			return {
				ok: true,
				outcome: {
					lighthouse: emptyLighthouse(targetUrl),
					psiDegradedReason: PSI_PARTIAL_REASON,
					usedPartialFallback: true,
				},
			};
		}
		const apiDetail = await readPageSpeedErrorMessage(psiResponse);
		const hint =
			psiResponse.status >= 500
				? "The PageSpeed service had a temporary error. Please try again shortly."
				: "PageSpeed Insights could not analyze this URL. Check that it is public and reachable.";
		return {
			ok: false,
			status: psiResponse.status === 400 ? 400 : 502,
			error: apiDetail || hint,
		};
	}

	const { data, parseOk } = await readJsonBody(psiResponse);
	if (!parseOk) {
		return {
			ok: true,
			outcome: {
				lighthouse: emptyLighthouse(targetUrl),
				psiDegradedReason: PSI_PARTIAL_REASON,
				usedPartialFallback: true,
			},
		};
	}

	const psiData = data as {
		lighthouseResult?: LighthousePayload;
		error?: { message?: string };
	};
	const lighthouse = psiData.lighthouseResult;
	if (!lighthouse?.categories) {
		const msg = psiData.error?.message;
		const quota = msg?.includes("Quota") || msg?.includes("quota") || false;
		if (quota) {
			return {
				ok: false,
				status: 503,
				error: "PageSpeed Insights quota was exceeded. Please try again later.",
				retryAfter: "120",
			};
		}
		return {
			ok: true,
			outcome: {
				lighthouse: emptyLighthouse(targetUrl),
				psiDegradedReason: PSI_PARTIAL_REASON,
				usedPartialFallback: true,
			},
		};
	}

	return {
		ok: true,
		outcome: {
			lighthouse,
			psiDegradedReason: null,
			usedPartialFallback: false,
		},
	};
}
