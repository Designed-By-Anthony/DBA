import { fetchWithTimeout } from "./http";

/** Google `runPagespeed` often exceeds 20s on slow or JS-heavy sites. */
const PSI_FETCH_TIMEOUT_MS = 55_000;
const PSI_RETRY_DELAY_MS = 1_200;
const PSI_MAX_ATTEMPTS = 2;

function buildRunPagespeedUrl(
	targetUrl: string,
	apiKey: string | undefined,
): string {
	const strategy = "mobile";
	let psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=${strategy}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO`;
	if (apiKey) psiUrl += `&key=${apiKey}`;
	return psiUrl;
}

/**
 * Calls PageSpeed Insights `runPagespeed` with a generous timeout and one retry
 * on timeout or 5xx (Google intermittently returns slow or error responses).
 */
export async function fetchPageSpeedRunPagespeed(
	targetUrl: string,
	apiKey: string | undefined,
): Promise<Response> {
	const psiUrl = buildRunPagespeedUrl(targetUrl, apiKey);
	const init: RequestInit = {
		headers: { Accept: "application/json" },
	};

	let lastError: unknown;

	for (let attempt = 0; attempt < PSI_MAX_ATTEMPTS; attempt++) {
		try {
			const response = await fetchWithTimeout(
				psiUrl,
				init,
				PSI_FETCH_TIMEOUT_MS,
			);
			if (response.status >= 500 && attempt < PSI_MAX_ATTEMPTS - 1) {
				await new Promise((r) => setTimeout(r, PSI_RETRY_DELAY_MS));
			} else {
				return response;
			}
		} catch (err) {
			lastError = err;
			if (attempt < PSI_MAX_ATTEMPTS - 1) {
				await new Promise((r) => setTimeout(r, PSI_RETRY_DELAY_MS));
			}
		}
	}

	throw lastError instanceof Error
		? lastError
		: new Error(String(lastError ?? "PageSpeed request failed"));
}
