import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { getDb, portalSessions, portalTokens } from "@dba/database";
import crypto from "crypto";
import { hashPortalToken } from "@/lib/portal-auth";
import { apiError } from "@/lib/api-error";
import {
  HOST_PREFIXED_COOKIE_NAME,
  LEGACY_COOKIE_NAME,
  portalCookieNameToSet,
} from "@/lib/portal-cookie";

/**
 * Magic Link Token Verification.
 * Validates a token in SQL, marks it used, and creates a scoped portal session.
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = (await request.json()) as { token?: string };

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const database = getDb();
    if (!database) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const nowIso = new Date().toISOString();
    const tokenHash = hashPortalToken(token);

    const tokenRows = await database
      .select()
      .from(portalTokens)
      .where(
        and(
          eq(portalTokens.tokenHash, tokenHash),
          eq(portalTokens.used, false),
          gt(portalTokens.expiresAt, nowIso),
        ),
      )
      .limit(1);

    const tokenRow = tokenRows[0];
    if (!tokenRow) {
      return NextResponse.json({ error: "Invalid or already-used token" }, { status: 401 });
    }

    await database
      .update(portalTokens)
      .set({
        used: true,
        usedAt: nowIso,
      })
      .where(eq(portalTokens.id, tokenRow.id));

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionTokenHash = hashPortalToken(sessionToken);
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await database.insert(portalSessions).values({
      tenantId: tokenRow.tenantId,
      prospectId: tokenRow.prospectId,
      prospectEmail: tokenRow.prospectEmail,
      prospectName: tokenRow.prospectName,
      sessionTokenHash,
      expiresAt: sessionExpiry.toISOString(),
      createdAt: nowIso,
    });

    const response = NextResponse.json({
      success: true,
      prospectId: tokenRow.prospectId,
    });

    // Cookie posture:
    //   httpOnly: no JS read (mitigates XSS-driven exfil).
    //   sameSite: 'strict': portal is never entered via a cross-site
    //     navigation, so 'strict' closes CSRF without breaking legitimate
    //     flow. Loosening to 'lax' was unnecessary.
    //   secure: forced true when using the __Host- name (browser requires
    //     it anyway); true on Vercel even on non-prod (previews are HTTPS).
    //   __Host- prefix: where HTTPS is available, rename to __Host-
    //     portal_session. The prefix pins the cookie to the exact origin
    //     (no Domain attribute, path=/ required) so a compromised
    //     sibling subdomain can't overwrite our session cookie.
    //
    // Rollout: a sibling PR is extending getPortalSessionFromRequest() to
    // read BOTH the new and legacy cookie names. That lets us issue new
    // cookies under the prefixed name while honoring sessions that were
    // issued under the old name, with no user-visible logout.
    const cookieName = portalCookieNameToSet();
    const onVercel = process.env.VERCEL === "1";
    const isProd = process.env.NODE_ENV === "production";
    const mustBeSecure = cookieName === HOST_PREFIXED_COOKIE_NAME;

    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: mustBeSecure || onVercel || isProd,
      sameSite: "strict",
      expires: sessionExpiry,
      path: "/",
    });

    // Make sure any pre-existing legacy cookie with the same token doesn't
    // shadow the new one during the compat window. Only clear when we're
    // issuing under the new name; otherwise we'd clear the cookie we just
    // set on dev.
    if (cookieName === HOST_PREFIXED_COOKIE_NAME) {
      response.cookies.set(LEGACY_COOKIE_NAME, "", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        expires: new Date(0),
        path: "/",
      });
    }

    return response;
  } catch (error: unknown) {
    return apiError("portal/verify", error);
  }
}
