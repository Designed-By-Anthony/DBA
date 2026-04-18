/**
 * Next.js 16 uses `src/proxy.ts` with a **named** `proxy` export (see Next.js
 * `middleware.js` template: `mod.proxy`). Clerk’s quickstart still shows
 * `export default clerkMiddleware()` for `middleware.ts`; this file is the
 * App Router equivalent — do not rename to `middleware` without migrating exports.
 */
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function normalizeHost(hostHeader: string | null): string {
  return (hostHeader || "").split(":")[0]?.toLowerCase() || "";
}

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const hostname = normalizeHost(req.headers.get("host"));

  const isAdminDomain =
    hostname.startsWith("app.") ||
    hostname.startsWith("admin.") ||
    hostname.startsWith("admin-") ||
    hostname.startsWith("app-");

  if (isAdminDomain) {
    // Do not call `auth.protect()` here — it triggers extra Clerk redirects (often
    // cross-subdomain). Auth is enforced in `app/admin/layout.tsx` by rendering
    // the sign-in UI in-place when there is no session.

    // Root URL → sign-in page directly (no `/admin` hop).
    if (url.pathname === "/" || url.pathname === "") {
      return NextResponse.rewrite(new URL("/sign-in", req.url));
    }

    if (
      !url.pathname.startsWith("/admin") &&
      !url.pathname.startsWith("/api/") &&
      !url.pathname.startsWith("/sign-in")
    ) {
      return NextResponse.rewrite(new URL(`/admin${url.pathname}`, req.url));
    }

    return NextResponse.next();
  }

  const isPortalDomain = hostname.startsWith("portal.") || hostname.startsWith("portal-");
  if (isPortalDomain) {
    if (!url.pathname.startsWith("/portal") && !url.pathname.startsWith("/api/")) {
      return NextResponse.rewrite(new URL(`/portal${url.pathname}`, req.url));
    }

    return NextResponse.next();
  }

  const isPreviewDomain =
    hostname.includes(".preview.designedbyanthony.com") ||
    (hostname.includes(".localhost") && !hostname.startsWith("www."));

  if (isPreviewDomain) {
    const subdomain = hostname.split(".")[0];
    if (!url.pathname.startsWith("/preview/")) {
      return NextResponse.rewrite(
        new URL(`/preview/${subdomain}${url.pathname === "/" ? "" : url.pathname}`, req.url),
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
