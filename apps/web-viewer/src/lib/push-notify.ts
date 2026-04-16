/**
 * Web Push (VAPID) — matches NotificationOptIn which stores PushSubscription JSON in prospects.fcmToken.
 */
import webpush from "web-push";
import { db } from "@/lib/firebase";

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

export async function sendWebPushToProspect(
  prospectId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  if (!ensureVapid()) {
    return;
  }

  const doc = await db.collection("prospects").doc(prospectId).get();
  if (!doc.exists) return;
  const data = doc.data()!;
  if (!data.notifyByPush) return;
  const raw = data.fcmToken as string | undefined;
  if (!raw) return;

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
      await db.collection("prospects").doc(prospectId).update({
        fcmToken: null,
        notifyByPush: false,
      });
    }
    console.error("[push] send failed:", e);
  }
}
