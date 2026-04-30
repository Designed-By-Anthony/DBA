import { isTrustedHostedPreviewHostname } from "../../lib/marketingBrowserOrigins";

const LOCAL_ALLOWED_ORIGINS = new Set([
	"https://designedbyanthony.com",
	"https://www.designedbyanthony.com",
	"http://localhost:3000",
	"http://127.0.0.1:3000",
]);

const localRateLimitBuckets = new Map<string, number[]>();

const PRIVATE_IPV4_SEGMENTS = [
	/^10\./,
	/^127\./,
	/^169\.254\./,
	/^172\.(1[6-9]|2\d|3[0-1])\./,
	/^192\.168\./,
	/^0\./,
];

function isPrivateHost(hostname: string): boolean {
	const host = hostname.toLowerCase();
	if (
		host === "localhost" ||
		host === "::1" ||
		host.endsWith(".local") ||
		host.endsWith(".internal")
	) {
		return true;
	}
	if (PRIVATE_IPV4_SEGMENTS.some((pattern) => pattern.test(host))) {
		return true;
	}
	// IPv6 unique-local/link-local ranges
	if (
		host.startsWith("fc") ||
		host.startsWith("fd") ||
		host.startsWith("fe80:")
	) {
		return true;
	}
	return false;
}

function getFetchTargetUrl(input: RequestInfo | URL): string | null {
	if (typeof input === "string") return input;
	if (input instanceof URL) return input.toString();
	if (input instanceof Request) return input.url;
	return null;
}

function assertSafeOutboundUrl(input: RequestInfo | URL): void {
	const raw = getFetchTargetUrl(input);
	if (!raw) {
		throw new Error("Invalid outbound request target.");
	}
	const url = new URL(raw);
	if (url.protocol !== "https:" && url.protocol !== "http:") {
		throw new Error(`Unsupported outbound protocol: ${url.protocol}`);
	}
	if (
		process.env.ALLOW_PRIVATE_EGRESS !== "true" &&
		isPrivateHost(url.hostname)
	) {
		throw new Error(`Blocked private outbound target: ${url.hostname}`);
	}
}

function normalizeOrigin(origin: string): string | null {
	try {
		return new URL(origin).origin;
	} catch {
		return null;
	}
}

function getExtraAllowedOrigins(): Set<string> {
	const configured = process.env.ALLOWED_ORIGINS || "";
	return new Set(
		configured
			.split(",")
			.map((value) => normalizeOrigin(value.trim()))
			.filter((value): value is string => Boolean(value)),
	);
}

function isAllowedOrigin(origin: string): boolean {
	const normalizedOrigin = normalizeOrigin(origin);
	if (!normalizedOrigin) {
		return false;
	}

	if (LOCAL_ALLOWED_ORIGINS.has(normalizedOrigin)) {
		return true;
	}

	const url = new URL(normalizedOrigin);
	if (
		url.protocol === "https:" &&
		(url.hostname === "designedbyanthony.com" ||
			url.hostname.endsWith(".designedbyanthony.com"))
	) {
		return true;
	}

	if (
		url.protocol === "https:" &&
		isTrustedHostedPreviewHostname(url.hostname)
	) {
		return true;
	}

	return getExtraAllowedOrigins().has(normalizedOrigin);
}

export function buildCorsHeaders(
	request: Request,
	methods: string,
	allowHeaders = "Content-Type, Authorization",
): Record<string, string> {
	const headers: Record<string, string> = {
		"Access-Control-Allow-Methods": methods,
		"Access-Control-Allow-Headers": allowHeaders,
		Vary: "Origin",
	};

	const origin = request.headers.get("origin");
	if (origin && isAllowedOrigin(origin)) {
		headers["Access-Control-Allow-Origin"] = origin;
	}

	return headers;
}

export function getClientAddress(request: Request): string {
	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) {
		return forwardedFor.split(",")[0]?.trim() || "unknown";
	}

	return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Best-effort burst protection for public endpoints.
 * This is process-local, so it helps with accidental floods and basic abuse,
 * but it is not a substitute for edge or shared-store rate limiting.
 */
export function checkLocalRateLimit(
	key: string,
	limit: number,
	windowMs: number,
): number | null {
	const now = Date.now();
	const existing = localRateLimitBuckets.get(key) || [];
	const recentHits = existing.filter((timestamp) => now - timestamp < windowMs);

	if (recentHits.length >= limit) {
		const retryAfterMs = windowMs - (now - recentHits[0]);
		localRateLimitBuckets.set(key, recentHits);
		return Math.max(1, Math.ceil(retryAfterMs / 1000));
	}

	recentHits.push(now);
	localRateLimitBuckets.set(key, recentHits);
	return null;
}

export async function fetchWithTimeout(
	input: RequestInfo | URL,
	init: RequestInit = {},
	timeoutMs = 15_000,
): Promise<Response> {
	assertSafeOutboundUrl(input);

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		// nosemgrep: nodejs_scan.javascript-ssrf-rule-node_ssrf
		return await fetch(input, {
			...init,
			signal: controller.signal,
		});
	} finally {
		clearTimeout(timeout);
	}
}
