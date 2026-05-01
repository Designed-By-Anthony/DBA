import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const APEX_DOMAIN = "designedbyanthony.com";
/** Legacy redirect host for managed admin + accounts consoles (infrastructure host). */
const EXTERNAL_CONSOLE_DOMAIN = "vertaflow.io";

const ADMIN_HOST = `admin.${APEX_DOMAIN}`;
const ACCOUNTS_HOST = `accounts.${APEX_DOMAIN}`;

const EXTERNAL_ADMIN_HOST = `admin.${EXTERNAL_CONSOLE_DOMAIN}`;
const EXTERNAL_ACCOUNTS_HOST = `accounts.${EXTERNAL_CONSOLE_DOMAIN}`;

/**
 * RFC 8288 Link headers for agent discovery
 * https://www.rfc-editor.org/rfc/rfc8288
 */
const LINK_HEADERS = [
	// API Catalog (RFC 9727)
	'</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
	// Agent Skills Discovery
	'</.well-known/agent-skills/index.json>; rel="agent-skills"; type="application/json"',
	// MCP Server Card
	'</.well-known/mcp/server-card.json>; rel="mcp-server"; type="application/json"',
	// Service documentation
	'</lighthouse>; rel="service-doc"; title="Lighthouse Scanner"',
	// API documentation
	'<https://api.designedbyanthony.com>; rel="service-desc"; title="API Endpoint"',
	// Health/Status endpoint
	'<https://api.designedbyanthony.com/health>; rel="status"; title="API Health"',
].join(", ");

function redirectToExternalConsole(
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
 * `admin.*` and `accounts.*` redirect to the managed console host; everything else is the
 * single Next.js marketing app (including `/lighthouse`).
 */
export function middleware(request: NextRequest) {
	const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
	const { pathname } = request.nextUrl;

	if (host === ADMIN_HOST) {
		return redirectToExternalConsole(request, EXTERNAL_ADMIN_HOST);
	}

	if (host === ACCOUNTS_HOST) {
		return redirectToExternalConsole(request, EXTERNAL_ACCOUNTS_HOST);
	}

	/* `/404` cannot be a stable `(site)/[...path]` segment — Next treats `404` specially.
	   Rewrite to a real route so the branded not-found page always renders. */
	if (pathname === "/404" || pathname === "/404/") {
		const url = request.nextUrl.clone();
		url.pathname = "/page-not-found";
		return NextResponse.rewrite(url);
	}

	/* ── Phase-3 fix list #19, #20 ─────────────────────────────────────────
	 * Backwards-compatible URL aliases for marketing routes whose published
	 * slugs differ from the descriptive form people type/link to.
	 *   /our-edge                       → /ouredge   (canonical: no hyphen)
	 *   /services/hosting-infrastructure → /services/managed-hosting
	 * These return 308 (Permanent Redirect) so search engines consolidate
	 * link equity onto the canonical page instead of soft-404'ing.
	 * ─────────────────────────────────────────────────────────────────── */
	const redirectAliases: Record<string, string> = {
		"/our-edge": "/ouredge",
		"/our-edge/": "/ouredge",
		"/services/hosting-infrastructure": "/services/managed-hosting",
		"/services/hosting-infrastructure/": "/services/managed-hosting",
	};
	const aliased = redirectAliases[pathname];
	if (aliased) {
		const url = request.nextUrl.clone();
		url.pathname = aliased;
		return NextResponse.redirect(url, 308);
	}

	/* Magic-link reports were emailed under /report/{id}; the actual route
	   lives under /lighthouse/report/{id}. Redirect 308 so existing links
	   in customer inboxes resolve correctly (phase-3 #8). */
	if (pathname.startsWith("/report/")) {
		const id = pathname.slice("/report/".length).replace(/\/$/, "");
		if (id && /^[A-Za-z0-9_-]+$/.test(id)) {
			const url = request.nextUrl.clone();
			url.pathname = `/lighthouse/report/${id}`;
			return NextResponse.redirect(url, 308);
		}
	}

	// Handle Markdown for Agents (text/markdown content negotiation)
	// https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
	const acceptHeader = request.headers.get("accept") ?? "";
	const wantsMarkdown = acceptHeader.includes("text/markdown");

	if (wantsMarkdown && pathname === "/") {
		// For now, return a simple markdown version of the homepage
		const markdownContent = generateHomepageMarkdown();
		return new NextResponse(markdownContent, {
			status: 200,
			headers: {
				"Content-Type": "text/markdown; charset=utf-8",
				"X-Markdown-Tokens": "256",
				Link: LINK_HEADERS,
			},
		});
	}

	// Add Link headers to all responses for agent discovery (RFC 8288)
	const response = NextResponse.next();
	response.headers.set("Link", LINK_HEADERS);
	return response;
}

/**
 * Generate markdown version of homepage for agents
 */
function generateHomepageMarkdown(): string {
	return `# ANTHONY.

**Mohawk Valley Web Design Studio** · Utica · Rome · Syracuse · CNY

Custom websites for contractors, home-service pros, medspas, salons, boutiques, and every other small business across Central New York. Fast on a phone, friendly to read, and built so people searching for what you do actually land, trust you, and call.

## Services

- Web Design & Development
- Local SEO
- Performance Optimization
- Website Audits

## Free Tool

**[Lighthouse Scanner](/lighthouse)** — Free SEO & Performance Audit

## Contact

- Website: https://designedbyanthony.com
- Phone: 315-638-2320
- Email: anthony@designedbyanthony.com
- Address: 8370 Elizabethtown Rd, Herkimer, NY 13350

## API

- API Endpoint: https://api.designedbyanthony.com
- API Documentation: https://api.designedbyanthony.com/docs

---

*Built with Next.js, React, TypeScript, Tailwind CSS, and Cloudflare.*
`;
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
