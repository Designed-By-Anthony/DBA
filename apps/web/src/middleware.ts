import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const APEX_DOMAIN = "designedbyanthony.com";
const VERTAFLOW_DOMAIN = "vertaflow.io";

const ADMIN_HOST = `admin.${APEX_DOMAIN}`;
const ACCOUNTS_HOST = `accounts.${APEX_DOMAIN}`;

const VF_ADMIN_HOST = `admin.${VERTAFLOW_DOMAIN}`;
const VF_ACCOUNTS_HOST = `accounts.${VERTAFLOW_DOMAIN}`;

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

/**
 * Edge middleware for the Cloudflare Pages deployment.
 * `admin.*` and `accounts.*` redirect to VertaFlow; everything else is the
 * single Next.js marketing app (including `/lighthouse`).
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
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
