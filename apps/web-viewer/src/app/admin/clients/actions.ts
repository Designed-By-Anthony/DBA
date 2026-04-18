"use server";

import type { PlanSuite } from "@dba/lead-form-contract";
import { clerkClient } from "@clerk/nextjs/server";
import { getDb, withTenantContext, tenants, leads } from "@dba/database";
import { eq, and, count } from "drizzle-orm";
import { verifyAuth } from "../actions";

// ============================================
// Client Organization Management
// ============================================

/**
 * List all organizations the current user belongs to,
 * enriched with prospect count from SQL.
 */
export async function listClientOrgs() {
  const session = await verifyAuth();
  if (session.user.id === "dev") return [];

  const userId = session.user.id;
  const client = await clerkClient();
  const memberships = await client.users.getOrganizationMembershipList({ userId });

  const db = getDb();

  const orgs = await Promise.all(
    memberships.data.map(async (m) => {
      const org = m.organization;

      let prospectCount = 0;
      let branding = null;

      if (db) {
        try {
          await withTenantContext(db, org.id, async (tx) => {
            const countResult = await tx
              .select({ count: count() })
              .from(leads)
              .where(eq(leads.tenantId, org.id));
            prospectCount = countResult[0]?.count || 0;
          });
        } catch {
          // Count may fail
        }

        try {
          const tenantRows = await db
            .select()
            .from(tenants)
            .where(eq(tenants.clerkOrgId, org.id))
            .limit(1);
          if (tenantRows.length > 0) {
            const t = tenantRows[0];
            branding = {
              brandName: t.name,
              brandColor: t.brandColor || "#2563eb",
              brandInitial: (t.name?.charAt(0) || "A").toUpperCase(),
              portalEnabled: true,
              verticalTemplate: t.verticalType || "agency",
            };
          }
        } catch {
          // Non-critical
        }
      }

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        imageUrl: org.imageUrl,
        membersCount: org.membersCount || 0,
        createdAt: org.createdAt ? new Date(org.createdAt).toISOString() : new Date().toISOString(),
        prospectCount,
        role: m.role,
        branding,
      };
    })
  );

  return orgs;
}

/**
 * Create a new client organization.
 */
export async function createClientOrg(name: string, verticalTemplate: string = "agency") {
  const session = await verifyAuth();
  if (session.user.id === "dev") {
    throw new Error("Sign in with Clerk to create client organizations.");
  }

  const userId = session.user.id;
  const client = await clerkClient();
  const org = await client.organizations.createOrganization({
    name,
    createdBy: userId,
  });

  // Initialize tenant record in SQL
  const db = getDb();
  if (db) {
    const now = new Date().toISOString();
    await db.insert(tenants).values({
      clerkOrgId: org.id,
      name,
      verticalType: verticalTemplate as "agency" | "service_pro",
      brandColor: "#2563eb",
      pipelineStages: [],
      dealSources: ["Referral", "Inbound", "Organic"],
      notificationPrefs: {},
      crmConfig: {},
      createdAt: now,
      updatedAt: now,
    });
  }

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
  };
}

/**
 * Update org branding settings (stored in SQL tenants table).
 */
export async function updateOrgBranding(orgId: string, settings: {
  brandName?: string;
  brandColor?: string;
  brandInitial?: string;
  portalEnabled?: boolean;
  planSuite?: PlanSuite;
}) {
  const session = await verifyAuth();
  if (session.user.id === "dev") {
    throw new Error("Sign in with Clerk to update organization settings.");
  }

  const userId = session.user.id;
  const client = await clerkClient();
  const memberships = await client.users.getOrganizationMembershipList({ userId });
  const isMember = memberships.data.some((m) => m.organization.id === orgId);
  if (!isMember) throw new Error("Unauthorized: Not a member of this organization");

  const db = getDb();
  if (db) {
    const payload: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (settings.brandName) payload.name = settings.brandName;
    if (settings.brandColor) payload.brandColor = settings.brandColor;

    await db
      .update(tenants)
      .set(payload)
      .where(eq(tenants.clerkOrgId, orgId));
  }

  return { success: true };
}

/**
 * Get branding settings for an org.
 */
export async function getOrgBranding(orgId: string) {
  const db = getDb();
  if (!db) {
    return {
      brandName: "Agency OS",
      brandColor: "#2563eb",
      brandInitial: "A",
      portalEnabled: true,
    };
  }

  const rows = await db
    .select()
    .from(tenants)
    .where(eq(tenants.clerkOrgId, orgId))
    .limit(1);

  if (rows.length === 0) {
    return {
      brandName: "Agency OS",
      brandColor: "#2563eb",
      brandInitial: "A",
      portalEnabled: true,
    };
  }

  const t = rows[0];
  return {
    brandName: t.name || "Agency OS",
    brandColor: t.brandColor || "#2563eb",
    brandInitial: (t.name?.charAt(0) || "A").toUpperCase(),
    portalEnabled: true,
    verticalTemplate: t.verticalType || "agency",
  };
}
