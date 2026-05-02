import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Cloudflare Access JWT gate for the admin subdomain.
 * CF injects `CF-Access-Jwt-Assertion` on every request that passes
 * the Zero Trust policy. If the header is absent the request did not
 * come through Access — reject it.
 *
 * For local dev (no CF tunnel) set SKIP_CF_ACCESS_CHECK=true in .dev.vars.
 */
export function middleware(request: NextRequest) {
  const skipCheck = process.env.SKIP_CF_ACCESS_CHECK === "true";

  if (!skipCheck) {
    const jwt = request.headers.get("CF-Access-Jwt-Assertion");
    if (!jwt) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Bearer realm="Cloudflare Access"' },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};