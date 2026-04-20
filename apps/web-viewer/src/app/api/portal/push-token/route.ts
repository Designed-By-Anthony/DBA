import { type NextRequest, NextResponse } from "next/server";
import { getPortalSessionFromRequest } from "@/lib/portal-auth";
import { getDb, withTenantContext, pushSubscriptions, leads } from "@dba/database";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

/**
 * Web Push subscription payload from the browser PushManager.
 * `token` is a stringified PushSubscription JSON.
 */
const subscriptionSchema = z.object({
  token: z.string().min(1),
});

/**
 * POST /api/portal/push-token
 * Persists a Web Push subscription from the client portal to the push_subscriptions table.
 * Also stores the raw JSON in the prospect's `fcm_token` column for backward-compat push sends.
 */
export async function POST(request: NextRequest) {
  const session = await getPortalSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = subscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const { token } = parsed.data;
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const sub = JSON.parse(token) as Record<string, unknown>;
    const endpoint = typeof sub.endpoint === "string" ? sub.endpoint : "";
    const keys = sub.keys as Record<string, unknown> | undefined;
    const p256dh = typeof keys?.p256dh === "string" ? keys.p256dh : "";
    const auth = typeof keys?.auth === "string" ? keys.auth : "";
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Invalid subscription format" }, { status: 400 });
    }

    await withTenantContext(db, session.tenantId, async (tx) => {
      // Upsert: delete existing sub with same endpoint, then insert
      await tx
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.tenantId, session.tenantId),
            eq(pushSubscriptions.endpoint, endpoint),
          ),
        );

      await tx.insert(pushSubscriptions).values({
        tenantId: session.tenantId,
        userId: session.prospectId,
        endpoint,
        p256dh,
        auth,
        createdAt: new Date().toISOString(),
      });

      // Also store raw JSON in leads.fcmToken for backward-compat push sends
      await tx
        .update(leads)
        .set({ fcmToken: token })
        .where(
          and(
            eq(leads.tenantId, session.tenantId),
            eq(leads.prospectId, session.prospectId),
          ),
        );
    });

    return NextResponse.json({ success: true, persisted: true });
  } catch (err) {
    console.error("Push token save error:", err);
    return NextResponse.json({ error: "Failed to process token" }, { status: 500 });
  }
}

/**
 * DELETE /api/portal/push-token
 * Removes all push subscriptions for this portal user.
 */
export async function DELETE(request: NextRequest) {
  const session = await getPortalSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    await withTenantContext(db, session.tenantId, async (tx) => {
      await tx
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.tenantId, session.tenantId),
            eq(pushSubscriptions.userId, session.prospectId),
          ),
        );

      // Clear the legacy fcmToken too
      await tx
        .update(leads)
        .set({ fcmToken: null })
        .where(
          and(
            eq(leads.tenantId, session.tenantId),
            eq(leads.prospectId, session.prospectId),
          ),
        );
    });

    return NextResponse.json({ success: true, persisted: true });
  } catch (err) {
    console.error("Push token delete error:", err);
    return NextResponse.json({ error: "Failed to remove token" }, { status: 500 });
  }
}
