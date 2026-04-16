import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { getDb, portalSessions, portalTokens } from "@dba/database";
import crypto from "crypto";
import { hashPortalToken } from "@/lib/portal-auth";

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

    response.cookies.set("portal_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: sessionExpiry,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("Token verification error:", error);
    const msg = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
