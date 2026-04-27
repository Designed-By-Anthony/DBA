import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const APEX_DOMAIN = "designedbyanthony.com";
const VERTAFLOW_DOMAIN = "vertaflow.io";

const ADMIN_HOST = `admin.${APEX_DOMAIN}`;
const ACCOUNTS_HOST = `accounts.${APEX_DOMAIN}`;
const LIGHTHOUSE_HOST = `lighthouse.${APEX_DOMAIN}`;

const VF_ADMIN_HOST = `admin.${VERTAFLOW_DOMAIN}`;
const VF_ACCOUNTS_HOST = `accounts.${VERTAFLOW_DOMAIN}`;

function buildUpstream(
	upstreamBase: string,
	pathname: string,
	search: string,
): URL {
	const base = upstreamBase.replace(/\/$/, "");
	const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
	return new URL(`${path}${search}`, base);
}

function redirectToVertaflow(
	request: NextRequest,
	targetHost: string,
): NextResponse {
	const target = request.nextUrl.clone();
	target.hostname = targetHost;
	target.protocol = "https:";
	target.port = "";
	return NextResponse.redirect(target, 308);
}

function isBypassPath(pathname: string): boolean {
	if (pathname.startsWith("/_next/")) return true;
	if (pathname.startsWith("/api/")) return true;
	if (pathname.startsWith("/monitoring")) return true;
	if (pathname.startsWith("/brand/")) return true;
	if (pathname.startsWith("/icons/")) return true;
	if (pathname === "/manifest.webmanifest") return true;
	if (pathname === "/trusted-types-bootstrap.js") return true;
	if (pathname.startsWith("/favicon")) return true;
	if (/\.[a-z0-9]{2,8}$/i.test(pathname)) return true;
	return false;
}

/**
 * Host-based routing for the apex deployment (admin/accounts → VertaFlow,
 * lighthouse.* → in-app `/lighthouse` or external `LIGHTHOUSE_UPSTREAM_URL`).
 */
export function middleware(request: NextRequest) {
	const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
	const { pathname } = request.nextUrl;

	if (host === ADMIN_HOST) {
		return redirectToVertaflow(request, VF_ADMIN_HOST);
	}

	if (host === ACCOUNTS_HOST) {
		return redirectToVertaflow(request, VF_ACCOUNTS_HOST);
	}

	if (host === LIGHTHOUSE_HOST) {
		const upstream = process.env.LIGHTHOUSE_UPSTREAM_URL?.trim();
		if (upstream) {
			const dest = buildUpstream(upstream, pathname, request.nextUrl.search);
			return NextResponse.rewrite(dest);
		}
		if (isBypassPath(pathname)) {
			return NextResponse.next();
		}
		const url = request.nextUrl.clone();
		url.pathname = pathname === "/" ? "/lighthouse" : `/lighthouse${pathname}`;
		return NextResponse.rewrite(url);
	}

	if (pathname === "/lighthouse" || pathname.startsWith("/lighthouse/")) {
		return new NextResponse(null, { status: 404 });
	}

	/* `/404` cannot be a stable `(site)/[...path]` segment — Next treats `404` specially.
	   Rewrite to a real route so the branded not-found page always renders. */
	if (pathname === "/404" || pathname === "/404/") {
		const url = request.nextUrl.clone();
		url.pathname = "/page-not-found";
		return NextResponse.rewrite(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_vercel).*)"],
};
