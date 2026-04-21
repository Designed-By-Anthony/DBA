/**
 * Root Vercel Routing Middleware — host-based routing for
 * Designed by Anthony ("Chameleon" multi-app gateway).
 *
 * Vercel runs this file before the cache for every request to the apex
 * Vercel project (the Astro marketing deployment). Depending on the
 * Host header we either let the request fall through to the Astro site
 * or rewrite it to the upstream URL of another Vercel project.
 *
 * Deploy model (see `ANTHONYS_INSTRUCTIONS.txt`):
 *   - apps/marketing  — deployed as a standalone Vercel project; also
 *     serves this middleware. Hostname: designedbyanthony.com.
 *   - apps/vertaflow-crm — deployed as a separate Vercel project; the
 *     admin and accounts surfaces both live here. Hostname:
 *     $ADMIN_UPSTREAM_URL / $ACCOUNTS_UPSTREAM_URL.
 *   - apps/lighthouse — deployed as its own Vercel project. Hostname:
 *     $LIGHTHOUSE_UPSTREAM_URL (subdomain routing optional).
 *
 * Why a root middleware instead of vercel.json `rewrites`?
 *   - vercel.json rewrites run *before* middleware and are static; a
 *     TypeScript middleware lets the "Chameleon" rules evolve (A/B
 *     tests, tenant skins, feature flags) without a redeploy of the
 *     config layer.
 *   - Keeping the rules in TS also means our type-checker catches
 *     mistakes (undefined env vars, bad URL shapes).
 *
 * Reference: https://vercel.com/docs/routing-middleware
 */
import { next, rewrite } from "@vercel/functions";

const APEX_DOMAIN = "designedbyanthony.com";
const VERTAFLOW_DOMAIN = "vertaflow.io";

const ADMIN_HOST = `admin.${APEX_DOMAIN}`;
const ACCOUNTS_HOST = `accounts.${APEX_DOMAIN}`;
const LIGHTHOUSE_HOST = `lighthouse.${APEX_DOMAIN}`;

// VertaFlow subdomains (same CRM upstream, separate marketing site)
const VF_ADMIN_HOST = `admin.${VERTAFLOW_DOMAIN}`;
const VF_LOGIN_HOST = `login.${VERTAFLOW_DOMAIN}`;
const VF_ACCOUNTS_HOST = `accounts.${VERTAFLOW_DOMAIN}`;
const VF_APEX_HOSTS = [VERTAFLOW_DOMAIN, `www.${VERTAFLOW_DOMAIN}`];

/**
 * Matcher — run the gateway for all user-facing paths, including static
 * assets. The app subdomains render HTML from separate Vercel projects,
 * and that HTML references root-relative files such as `/_next/static/*`,
 * `/manifest.webmanifest`, `/serwist/*`, and `/brand/*`. If those requests
 * bypass this gateway they hit the apex Astro project and become cached
 * 404s, breaking hydration on admin/accounts/lighthouse.
 */
export const config = {
	matcher: ["/((?!_vercel).*)"],
};

function hostnameOf(request: Request): string {
	const raw = request.headers.get("host") ?? "";
	// Strip the port (e.g. :3000) for local dev, lowercase for safety.
	return (raw.split(":")[0] ?? "").toLowerCase();
}

function buildUpstream(
	upstreamBase: string,
	pathname: string,
	search: string,
	pathPrefix = "",
): URL {
	const base = upstreamBase.replace(/\/$/, "");
	const joinedPath = `${pathPrefix}${pathname}`.replace(/\/{2,}/g, "/");
	return new URL(`${joinedPath}${search}`, base);
}

function isAppAssetPath(pathname: string): boolean {
	if (pathname.startsWith("/_next/")) return true;
	if (pathname.startsWith("/brand/")) return true;
	if (pathname.startsWith("/icons/")) return true;
	if (pathname.startsWith("/serwist/")) return true;
	if (pathname === "/manifest.webmanifest") return true;
	if (pathname.startsWith("/favicon.")) return true;
	return /\.[a-z0-9]{2,8}$/i.test(pathname);
}

function isSharedAppRoute(pathname: string): boolean {
	return (
		pathname === "/offline" ||
		pathname === "/sign-in" ||
		pathname.startsWith("/sign-in/")
	);
}

/**
 * In production the apex Vercel project OWNS the canonical subdomains
 * (admin / accounts / lighthouse) via the Chameleon middleware. If an
 * upstream env var is missing we MUST NOT fall through to `next()` —
 * that silently serves the Astro marketing homepage from admin.* /
 * accounts.* / lighthouse.*, which is the exact regression this guard
 * prevents. Return a loud 502 instead so the misconfig is visible.
 *
 * Preview + local dev (`VERCEL_ENV !== 'production'`) keep the
 * fallthrough so unconfigured preview URLs still render something.
 */
function misconfigured(hostLabel: string): Response {
	const body = `Upstream for ${hostLabel}.${APEX_DOMAIN} is not configured. Set ${hostLabel.toUpperCase()}_UPSTREAM_URL on the apex Vercel project.`;
	return new Response(body, {
		status: 502,
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}

function isProduction(): boolean {
	return process.env.VERCEL_ENV === "production";
}

/**
 * Cross-project Vercel rewrites present the upstream deployment's own
 * hostname to the downstream app (the origin `admin.` / `accounts.` host
 * is only visible via `x-forwarded-host`). So the CRM `proxy.ts`
 * host-based `/admin` + `/portal` prefixing does NOT fire in production
 * — it only runs on `*.localhost` during local dev. The apex gateway
 * therefore has to pre-prefix the path itself, otherwise:
 *   - `admin.<apex>/`     → serves the public root landing (wrong page)
 *   - `accounts.<apex>/`  → 404 (no `/accounts` route exists)
 *
 * `/api/...` paths are pass-through because the CRM API routes
 * live at `/api/*` (not `/admin/api/*` or `/portal/api/*`).
 */
function needsAppPrefix(pathname: string, prefix: string): boolean {
	if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return false;
	if (pathname.startsWith("/api/")) return false;
	if (isSharedAppRoute(pathname)) return false;
	if (isAppAssetPath(pathname)) return false;
	// Sentry tunnel MUST hit the root of the upstream Next.js app
	if (pathname === "/monitoring") return false;
	return true;
}

/** 308 permanent redirect — preserve path + query; move legacy DBA CRM hosts to vertaflow.io */
function redirectToVertaflowHost(
	request: Request,
	targetHost: string,
): Response {
	const target = new URL(request.url);
	target.hostname = targetHost;
	target.protocol = "https:";
	target.port = "";
	return Response.redirect(target.toString(), 308);
}

export default function middleware(request: Request) {
	const host = hostnameOf(request);
	const url = new URL(request.url);
	const { pathname, search } = url;

	// Legacy Designed by Anthony CRM subdomains → VertaFlow (CRM now lives on vertaflow.io only).
	if (host === ADMIN_HOST) {
		return redirectToVertaflowHost(request, VF_ADMIN_HOST);
	}

	if (host === ACCOUNTS_HOST) {
		return redirectToVertaflowHost(request, VF_ACCOUNTS_HOST);
	}

	if (host === LIGHTHOUSE_HOST) {
		const upstream = process.env.LIGHTHOUSE_UPSTREAM_URL;
		if (!upstream) return isProduction() ? misconfigured("lighthouse") : next();
		return rewrite(buildUpstream(upstream, pathname, search));
	}

	// ─── VertaFlow CRM subdomains ───
	// admin.vertaflow.io + login.vertaflow.io → CRM upstream (apps/vertaflow-crm)
	if (host === VF_ADMIN_HOST || host === VF_LOGIN_HOST) {
		const upstream = process.env.ADMIN_UPSTREAM_URL;
		if (!upstream) return isProduction() ? misconfigured("vf-admin") : next();
		const prefix = needsAppPrefix(pathname, "/admin") ? "/admin" : "";
		return rewrite(buildUpstream(upstream, pathname, search, prefix));
	}

	// accounts.vertaflow.io → client portal surface (CRM /portal routes)
	if (host === VF_ACCOUNTS_HOST) {
		const upstream =
			process.env.ACCOUNTS_UPSTREAM_URL ?? process.env.ADMIN_UPSTREAM_URL;
		if (!upstream)
			return isProduction() ? misconfigured("vf-accounts") : next();
		const prefix = needsAppPrefix(pathname, "/portal") ? "/portal" : "";
		return rewrite(buildUpstream(upstream, pathname, search, prefix));
	}

	// vertaflow.io / www.vertaflow.io → VertaFlow marketing site
	if (VF_APEX_HOSTS.includes(host)) {
		const upstream = process.env.VERTAFLOW_UPSTREAM_URL;
		if (!upstream) return isProduction() ? misconfigured("vertaflow") : next();
		return rewrite(buildUpstream(upstream, pathname, search));
	}

	// Apex + www + previews → fall through to Astro marketing site.
	const res = next();

	// Apply security headers for the marketing site
	res.headers.set(
		"Content-Security-Policy",
		"default-src 'self'; " +
			"base-uri 'self'; " +
			"object-src 'none'; " +
			"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://challenges.cloudflare.com https://www.googletagmanager.com https://vercel.live; " +
			"style-src 'self' 'unsafe-inline'; " +
			"img-src 'self' data: blob: https://images.unsplash.com https://american-operator-assets-public.s3.us-east-1.amazonaws.com https://astro.badg.es; " +
			"connect-src 'self' https://*.designedbyanthony.com https://admin.vertaflow.io https://accounts.vertaflow.io https://*.vertaflow.io https://api.stripe.com https://www.google-analytics.com wss://ws-mt1.pusher.com; " +
			"frame-src 'self' https://js.stripe.com https://www.google.com/recaptcha/ https://challenges.cloudflare.com; " +
			"worker-src 'self' blob:; " +
			"frame-ancestors 'none'; " +
			"require-trusted-types-for 'script';",
	);
	res.headers.set(
		"Strict-Transport-Security",
		"max-age=63072000; includeSubDomains; preload",
	);
	res.headers.set("X-Content-Type-Options", "nosniff");
	res.headers.set("X-Frame-Options", "DENY");
	res.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
	res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	res.headers.set(
		"Permissions-Policy",
		"camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=(), usb=()",
	);

	return res;
}
