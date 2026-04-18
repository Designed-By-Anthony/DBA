import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

function shouldProtectAdmin() {
  return process.env.NODE_ENV === "production";
}

function normalizeHost(hostHeader: string | null): string {
  return (hostHeader || "").split(":")[0]?.toLowerCase() || "";
}

export const proxy = clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const hostname = normalizeHost(req.headers.get("host"));

  const isAdminDomain =
    hostname.startsWith("app.") ||
    hostname.startsWith("admin.") ||
    hostname.startsWith("admin-") ||
    hostname.startsWith("app-");

  if (isAdminDomain) {
    const isInboundWebhook = url.pathname.startsWith("/api/webhooks/");
    if (!isInboundWebhook && shouldProtectAdmin()) {
      await auth.protect();
    }

    if (!url.pathname.startsWith("/admin") && !url.pathname.startsWith("/api/")) {
      return NextResponse.rewrite(new URL(`/admin${url.pathname}`, req.url));
    }

    return NextResponse.next();
  }

  // `accounts.*` is the public-facing client-portal subdomain and shares
  // the same /portal surface; local dev (e.g. `accounts.localhost:3001`)
  // relies on this prefix rewrite to match production parity. In prod the
  // apex middleware.ts rewrites the path before it reaches here, so the
  // upstream host is `dba-agency-os.vercel.app` — these branches are the
  // local-dev safety net.
  const isPortalDomain =
    hostname.startsWith("portal.") ||
    hostname.startsWith("portal-") ||
    hostname.startsWith("accounts.") ||
    hostname.startsWith("accounts-");
  if (isPortalDomain) {
    if (!url.pathname.startsWith("/portal") && !url.pathname.startsWith("/api/")) {
      return NextResponse.rewrite(new URL(`/portal${url.pathname}`, req.url));
    }

    return NextResponse.next();
  }

  if (isAdminRoute(req) && shouldProtectAdmin()) {
    await auth.protect();
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
