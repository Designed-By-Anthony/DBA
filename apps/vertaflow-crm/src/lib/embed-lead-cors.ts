import type { NextRequest } from "next/server";

/**
 * CORS for third-party embeds: echo request `Origin` when present so browsers
 * allow `fetch()` from customer sites. Falls back to `*` for non-browser calls.
 */
export function embedLeadCorsHeaders(
	request: NextRequest,
): Record<string, string> {
	const origin = request.headers.get("origin");
	const allow =
		origin &&
		(origin.startsWith("https://") || origin.startsWith("http://localhost"))
			? origin
			: "*";
	return {
		"Access-Control-Allow-Origin": allow,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Max-Age": "86400",
		Vary: "Origin",
	};
}
