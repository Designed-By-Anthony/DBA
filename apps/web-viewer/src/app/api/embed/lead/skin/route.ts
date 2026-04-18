import { NextRequest, NextResponse } from "next/server";
import { getTenantByOrgId } from "@/lib/tenant-db";
import { verifyEmbedTenantSignature } from "@/lib/embed-widget-signature";
import { embedLeadCorsHeaders } from "@/lib/embed-lead-cors";

/**
 * Public skin for embedded lead widget — reads `tenants` (Neon) by Clerk org id.
 *
 * Query: `?tenant=<clerk_org_id>&sig=<hex>` — `sig` = HMAC-SHA256 of `v1|${tenant}`
 *   using `LEAD_EMBED_WIDGET_SECRET` (see `signEmbedTenant`).
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: embedLeadCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  const cors = embedLeadCorsHeaders(request);
  const secret = process.env.LEAD_EMBED_WIDGET_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Embed widget is not configured." },
      { status: 503, headers: cors },
    );
  }

  const tenantId = request.nextUrl.searchParams.get("tenant")?.trim() ?? "";
  const sig = request.nextUrl.searchParams.get("sig")?.trim() ?? "";

  if (!tenantId || !sig || !verifyEmbedTenantSignature(tenantId, sig, secret)) {
    return NextResponse.json({ error: "Invalid or missing signature." }, { status: 403, headers: cors });
  }

  try {
    const tenant = await getTenantByOrgId(tenantId);
    if (!tenant) {
      return NextResponse.json({ error: "Unknown tenant." }, { status: 404, headers: cors });
    }

    const brandColor = tenant.brandColor?.trim() || "#2563eb";
    const brandLogoUrl = tenant.brandLogoUrl?.trim() || null;
    const brandName = tenant.name?.trim() || "Contact";

    return NextResponse.json(
      {
        tenantId,
        brandName,
        brandColor,
        brandLogoUrl,
        turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null,
      },
      { headers: cors },
    );
  } catch {
    return NextResponse.json(
      { error: "Service temporarily unavailable." },
      { status: 503, headers: cors },
    );
  }
}
