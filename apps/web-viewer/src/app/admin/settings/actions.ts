"use server";

import "@dba/env/web-viewer-aliases";
import { auth } from "@clerk/nextjs/server";
import {
  getDb,
  withTenantContext,
  tenants,
  notifications,
  pushSubscriptions,
  type TenantRow,
} from "@dba/database";
import { eq, and, desc } from "drizzle-orm";

// ============================================
// Auth helper
// ============================================
async function requireTenant(): Promise<{ db: NonNullable<ReturnType<typeof getDb>>; tenantId: string }> {
  const { orgId } = await auth();
  if (!orgId) throw new Error("No active organization");
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  return { db, tenantId: orgId };
}

// ============================================
// Tenant Settings CRUD
// ============================================

export async function getTenantSettings(): Promise<TenantRow | null> {
  const { db, tenantId } = await requireTenant();
  return await withTenantContext(db, tenantId, async (tx) => {
    const rows = await tx.select().from(tenants).where(eq(tenants.clerkOrgId, tenantId)).limit(1);
    return rows[0] ?? null;
  });
}

export async function updateTenantSettings(
  fields: Partial<{
    name: string;
    verticalType: "agency" | "service_pro" | "restaurant" | "wellness";
    brandColor: string;
    brandLogoUrl: string;
    replyFromEmail: string;
    replyFromName: string;
    supportEmail: string;
    physicalAddress: string;
    pipelineStages: Array<{
      id: string;
      label: string;
      color: string;
      probability: number;
      order: number;
    }>;
    dealSources: string[];
    notificationPrefs: Record<string, unknown>;
    crmConfig: Record<string, unknown>;
  }>,
): Promise<{ success: boolean }> {
  const { db, tenantId } = await requireTenant();

  const payload: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (fields.name !== undefined) payload.name = fields.name;
  if (fields.verticalType !== undefined) payload.verticalType = fields.verticalType;
  if (fields.brandColor !== undefined) payload.brandColor = fields.brandColor;
  if (fields.brandLogoUrl !== undefined) payload.brandLogoUrl = fields.brandLogoUrl;
  if (fields.replyFromEmail !== undefined) payload.replyFromEmail = fields.replyFromEmail;
  if (fields.replyFromName !== undefined) payload.replyFromName = fields.replyFromName;
  if (fields.supportEmail !== undefined) payload.supportEmail = fields.supportEmail;
  if (fields.physicalAddress !== undefined) payload.physicalAddress = fields.physicalAddress;
  if (fields.pipelineStages !== undefined) payload.pipelineStages = fields.pipelineStages;
  if (fields.dealSources !== undefined) payload.dealSources = fields.dealSources;
  if (fields.notificationPrefs !== undefined) payload.notificationPrefs = fields.notificationPrefs;
  if (fields.crmConfig !== undefined) payload.crmConfig = fields.crmConfig;

  await withTenantContext(db, tenantId, async (tx) => {
    await tx
      .update(tenants)
      .set(payload)
      .where(eq(tenants.clerkOrgId, tenantId));
  });

  return { success: true };
}

/**
 * Ensure a tenant row exists (upsert on first load).
 * Called from the onboarding flow or settings page.
 */
export async function ensureTenantExists(name: string): Promise<TenantRow> {
  const { db, tenantId } = await requireTenant();

  return await withTenantContext(db, tenantId, async (tx) => {
    const existing = await tx
      .select()
      .from(tenants)
      .where(eq(tenants.clerkOrgId, tenantId))
      .limit(1);

    if (existing.length > 0) return existing[0];

    const now = new Date().toISOString();
    const newTenant = {
      clerkOrgId: tenantId,
      name,
      verticalType: "agency" as const,
      brandColor: "#2563eb",
      pipelineStages: [
        { id: "lead", label: "New Lead", color: "#3b82f6", probability: 0.1, order: 0 },
        { id: "contacted", label: "Contacted", color: "#3b82f6", probability: 0.25, order: 1 },
        { id: "proposal", label: "Proposal Sent", color: "#f59e0b", probability: 0.5, order: 2 },
        { id: "dev", label: "In Development", color: "#10b981", probability: 0.8, order: 3 },
        { id: "launched", label: "Launched", color: "#06d6a0", probability: 1.0, order: 4 },
      ],
      dealSources: ["Lighthouse Audit", "Referral", "Cold Outbound", "Inbound", "Organic", "Social Media"],
      notificationPrefs: {
        emailOnNewLead: true,
        emailOnStageChange: true,
        emailOnTicket: true,
        emailDailyDigest: false,
        pushEnabled: false,
        pushOnNewLead: true,
        pushOnStageChange: false,
      },
      crmConfig: {},
      createdAt: now,
      updatedAt: now,
    };

    await tx.insert(tenants).values(newTenant);

    const rows = await tx.select().from(tenants).where(eq(tenants.clerkOrgId, tenantId)).limit(1);
    return rows[0];
  });
}

// ============================================
// Notifications
// ============================================

export async function getNotifications(limit = 20): Promise<Array<{
  id: string;
  title: string;
  body: string;
  type: string;
  referenceId: string | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string;
}>> {
  const { db, tenantId } = await requireTenant();
  return await withTenantContext(db, tenantId, async (tx) => {
    const rows = await tx
      .select()
      .from(notifications)
      .where(eq(notifications.tenantId, tenantId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    return rows;
  });
}

export async function markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
  const { db, tenantId } = await requireTenant();
  await withTenantContext(db, tenantId, async (tx) => {
    await tx
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.tenantId, tenantId),
          eq(notifications.id, notificationId),
        ),
      );
  });
  return { success: true };
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  const { db, tenantId } = await requireTenant();
  await withTenantContext(db, tenantId, async (tx) => {
    await tx
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.tenantId, tenantId),
          eq(notifications.isRead, false),
        ),
      );
  });
  return { success: true };
}

// ============================================
// Push Subscription Management
// ============================================

export async function registerPushSubscription(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
): Promise<{ success: boolean }> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  const { db, tenantId } = await requireTenant();

  return await withTenantContext(db, tenantId, async (tx) => {
    // Check if already registered
    const existing = await tx
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.tenantId, tenantId),
          eq(pushSubscriptions.endpoint, subscription.endpoint),
        ),
      )
      .limit(1);

    if (existing.length > 0) return { success: true };

    await tx.insert(pushSubscriptions).values({
      tenantId,
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  });
}

export async function removePushSubscription(endpoint: string): Promise<{ success: boolean }> {
  const { db, tenantId } = await requireTenant();
  await withTenantContext(db, tenantId, async (tx) => {
    await tx
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.tenantId, tenantId),
          eq(pushSubscriptions.endpoint, endpoint),
        ),
      );
  });
  return { success: true };
}
