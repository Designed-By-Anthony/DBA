import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, leads, portalTokens } from "@dba/database";
import { sendMail, isEmailTestMode } from "@/lib/mailer";
import { complianceConfig } from "@/lib/theme.config";
import crypto from "crypto";
import { hashPortalToken } from "@/lib/portal-auth";

/**
 * Magic Link Authentication for Client Portal.
 * Uses SQL projection tables (leads + portal_tokens) with tenant scoping.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, orgId } = (await request.json()) as { email?: string; orgId?: string };

    if (!email || !orgId) {
      // Keep response generic to avoid exposing tenant membership.
      return NextResponse.json({ success: true });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const database = getDb();
    if (!database) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    // Anti-enumeration: same response even if no matching lead.
    const lead = (
      await database
        .select()
        .from(leads)
        // magic-link lookup must be tenant-scoped to avoid cross-org disclosure
        .where(and(eq(leads.tenantId, orgId), eq(leads.emailNormalized, normalizedEmail)))
        .limit(1)
    )[0];

    if (!lead) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashPortalToken(token);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await database.insert(portalTokens).values({
      tenantId: lead.tenantId,
      prospectId: lead.prospectId,
      prospectEmail: lead.email,
      prospectName: lead.name,
      tokenHash,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString(),
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "[REDACTED]";
    const magicLink = `${baseUrl}/portal/verify?token=${token}`;

    await sendMail({
      from: `Designed by Anthony <${complianceConfig.fromEmail}>`,
      to: [normalizedEmail],
      subject: "Your Portal Login Link",
      html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px;">
            <div style="background: #0a0a0f; border-radius: 16px; padding: 40px; text-align: center;">
              <div style="width: 56px; height: 56px; background: #2563eb; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px; margin-bottom: 24px;">
                D
              </div>
              <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 24px;">Welcome Back, ${(lead.name || "there").split(" ")[0]}</h1>
              <p style="color: #888; margin: 0 0 32px; font-size: 14px;">
                Click the button below to access your Client Portal.
              </p>
              <a href="${magicLink}"
                style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 40px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);">
                Open My Portal →
              </a>
              <p style="color: #555; font-size: 12px; margin-top: 32px;">
                This link expires in 15 minutes. If you didn't request this, you can safely ignore it.
              </p>
            </div>
            <p style="color: #666; font-size: 11px; text-align: center; margin-top: 16px;">
              Designed by Anthony · Rome, NY 13440
            </p>
          </div>
        `,
    });

    if (isEmailTestMode() || request.headers.get("x-e2e-testing") === "true") {
      return NextResponse.json({ success: true, testModeLink: magicLink });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Magic link error:", error);
    const msg = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
