/**
 * Web Push (VAPID) — pure Drizzle, no Firebase.
 * Reads push subscriptions from the `push_subscriptions` table.
 */
import webpush from "web-push";
import {
  getDb,
  setTenantContext,
  pushSubscriptions,
  leads,
} from "@dba/database";
import { eq, and } from "drizzle-orm";

let vapidConfigured = false;

function ensureVapid(): boolean {
  if (vapidConfigured) return true;
  const publicKey =
    process.env.NEXT_PUBLIC_FCM_VAPID_KEY || process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const contact =
    process.env.VAPID_CONTACT_EMAIL || "mailto:anthony@designedbyanthony.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(contact, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

/**
 * Send Web Push to all subscriptions for a given user within a tenant.
 */
export async function sendWebPushToUser(
  tenantId: string,
  userId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  if (!ensureVapid()) return;

  const db = getDb();
  if (!db) return;

  await setTenantContext(db, tenantId);
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.tenantId, tenantId),
        eq(pushSubscriptions.userId, userId),
      ),
    );

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url:
      payload.url ||
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin`,
  });

  for (const sub of subs) {
    const subscription: webpush.PushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };

    try {
      await webpush.sendNotification(subscription, body);
    } catch (e: unknown) {
      const err = e as { statusCode?: number };
      if (err.statusCode === 404 || err.statusCode === 410) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }
}

/**
 * Send Web Push to a prospect (from their fcmToken field — legacy PushSubscription JSON).
 */
export async function sendWebPushToProspect(
  prospectId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  if (!ensureVapid()) return;

  const db = getDb();
  if (!db) return;

  const rows = await db
    .select({ fcmToken: leads.fcmToken, tenantId: leads.tenantId })
    .from(leads)
    .where(eq(leads.prospectId, prospectId))
    .limit(1);

  if (rows.length === 0 || !rows[0].fcmToken) return;
  const raw = rows[0].fcmToken;

  let subscription: webpush.PushSubscription;
  try {
    subscription = JSON.parse(raw) as webpush.PushSubscription;
  } catch {
    return;
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url:
      payload.url ||
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/tickets`,
  });

  try {
    await webpush.sendNotification(subscription, body);
  } catch (e: unknown) {
    const err = e as { statusCode?: number };
    if (err.statusCode === 404 || err.statusCode === 410) {
      await db
        .update(leads)
        .set({ fcmToken: null })
        .where(eq(leads.prospectId, prospectId));
    }
  }
}
