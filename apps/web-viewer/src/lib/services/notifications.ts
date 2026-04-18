import { z } from "zod";
import type { TenantDomainRow } from "@dba/database";

const tenantNotificationSchema = z
  .object({
    tenantId: z.string().min(1),
    tenantName: z.string().min(1),
    domainName: z.string().min(1),
    resendId: z.string().min(1),
    status: z.string().min(1),
  })
  .strict();

export type TenantNotificationPayload = z.infer<typeof tenantNotificationSchema>;

export type DiscordNotification = {
  id: string;
  firedAt: string;
  kind: "new_tenant_domain" | "domain_verified";
  payload: TenantNotificationPayload;
};

type DiscordStore = {
  notifications: DiscordNotification[];
  counter: number;
};

const globalKey = "__DBA_DISCORD_NOTIFICATIONS__" as const;
const globalStore = globalThis as unknown as Record<typeof globalKey, DiscordStore | undefined>;

function getStore(): DiscordStore {
  if (!globalStore[globalKey]) {
    globalStore[globalKey] = { notifications: [], counter: 0 };
  }
  return globalStore[globalKey];
}

function isDiscordTestMode(): boolean {
  if (process.env.DISCORD_TEST_MODE === "true") return true;
  if (process.env.EMAIL_TEST_MODE === "true") return true;
  if (process.env.NEXT_PUBLIC_IS_TEST === "true") return true;
  if (process.env.NODE_ENV === "test") return true;
  return false;
}

function captureNotification(
  kind: DiscordNotification["kind"],
  payload: TenantNotificationPayload,
): DiscordNotification {
  const store = getStore();
  store.counter += 1;
  const notification = {
    id: `discord-test-${store.counter}-${Date.now()}`,
    firedAt: new Date().toISOString(),
    kind,
    payload,
  };
  store.notifications.push(notification);
  return notification;
}

async function sendDiscordEmbed(
  kind: DiscordNotification["kind"],
  title: string,
  description: string,
  payload: TenantNotificationPayload,
): Promise<{ ok: true; mode: "test" | "discord"; id?: string } | { ok: false; error: string }> {
  const parsed = tenantNotificationSchema.parse(payload);

  if (isDiscordTestMode()) {
    const notification = captureNotification(kind, parsed);
    return { ok: true, mode: "test", id: notification.id };
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return { ok: false, error: "Missing DISCORD_WEBHOOK_URL" };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Agency OS",
      embeds: [
        {
          title,
          description,
          color: kind === "domain_verified" ? 0x16a34a : 0x2563eb,
          fields: [
            { name: "Tenant", value: parsed.tenantName, inline: true },
            { name: "Tenant ID", value: parsed.tenantId, inline: true },
            { name: "Domain", value: parsed.domainName, inline: true },
            { name: "Resend ID", value: parsed.resendId, inline: false },
            { name: "Status", value: parsed.status, inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!response.ok) {
    return { ok: false, error: `Discord webhook returned ${response.status}` };
  }

  return { ok: true, mode: "discord" };
}

export async function notifyAdminOfNewTenant(
  tenantData: TenantNotificationPayload,
): Promise<{ ok: true; mode: "test" | "discord"; id?: string } | { ok: false; error: string }> {
  return sendDiscordEmbed(
    "new_tenant_domain",
    "New domain awaiting DNS",
    "A tenant started email domain onboarding and needs DNS records installed.",
    tenantData,
  );
}

export async function notifyAdminOnVerification(
  domain: TenantDomainRow & { tenantName?: string },
): Promise<{ ok: true; mode: "test" | "discord"; id?: string } | { ok: false; error: string }> {
  return sendDiscordEmbed(
    "domain_verified",
    "Domain verified",
    "A tenant domain is verified in Resend and is ready for reputation warm-up.",
    {
      tenantId: domain.tenantId,
      tenantName: domain.tenantName || domain.tenantId,
      domainName: domain.domainName,
      resendId: domain.resendId,
      status: domain.status,
    },
  );
}

export function getTestDiscordNotifications(): DiscordNotification[] {
  return [...getStore().notifications];
}

export function clearTestDiscordNotifications(): void {
  const store = getStore();
  store.notifications = [];
  store.counter = 0;
}
