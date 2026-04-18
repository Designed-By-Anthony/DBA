"use server";

import type { PlanSuite } from "@dba/lead-form-contract";
import "@dba/env/web-viewer-aliases";
import { clerkClient } from "@clerk/nextjs/server";
import { getDb, withTenantContext, tenants, leads } from "@dba/database";
import { eq, count } from "drizzle-orm";
import { verifyAuth } from "../actions";
import { getVerticalConfig } from "@/lib/verticals";
import {
  sqlVerticalTypeToUiTemplateFallback,
  uiVerticalTemplateToSqlVerticalType,
} from "@/lib/vertical-template-map";

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
            const crm = (t.crmConfig as Record<string, unknown> | undefined) ?? {};
            const templateFromCrm = crm.templateId;
            const verticalTemplate =
              typeof templateFromCrm === "string"
                ? templateFromCrm
                : sqlVerticalTypeToUiTemplateFallback(t.verticalType);
            branding = {
              brandName: t.name,
              brandColor: t.brandColor || "#2563eb",
              brandInitial: (t.name?.charAt(0) || "A").toUpperCase(),
              portalEnabled: true,
              verticalTemplate,
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
export async function createClientOrg(
  name: string,
  verticalTemplate: string = "agency",
): Promise<
  | { success: true; id: string; name: string; slug: string | null }
  | { success: false; error: string }
> {
  const session = await verifyAuth();
  if (session.user.id === "dev") {
    return { success: false, error: "Sign in with Clerk to create client organizations." };
  }

  const userId = session.user.id;
  try {
    const client = await clerkClient();
    const org = await client.organizations.createOrganization({
      name,
      createdBy: userId,
    });

    const db = getDb();
    if (db) {
      const now = new Date().toISOString();
      const uiTemplate = getVerticalConfig(verticalTemplate).id;
      const sqlVerticalType = uiVerticalTemplateToSqlVerticalType(uiTemplate);
      try {
        await db.insert(tenants).values({
          clerkOrgId: org.id,
          name,
          verticalType: sqlVerticalType,
          brandColor: "#2563eb",
          pipelineStages: [],
          dealSources: ["Referral", "Inbound", "Organic"],
          notificationPrefs: {},
          crmConfig: { templateId: uiTemplate },
          createdAt: now,
          updatedAt: now,
        });
      } catch (dbErr) {
        console.error("[createClientOrg] Tenant row insert failed:", dbErr);
        return {
          success: false,
          error:
            "Organization was created in Clerk, but the database could not save tenant settings. Check DATABASE_URL and try again, or contact support.",
        };
      }
    }

    return {
      success: true,
      id: org.id,
      name: org.name,
      slug: org.slug,
    };
  } catch (err) {
    console.error("[createClientOrg] Clerk error:", err);
    return {
      success: false,
      error: "Could not create organization. Verify CLERK_SECRET_KEY matches this deployment and your Clerk plan allows creating organizations.",
    };
  }
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
  const crm = (t.crmConfig as Record<string, unknown> | undefined) ?? {};
  const templateFromCrm = crm.templateId;
  const verticalTemplate =
    typeof templateFromCrm === "string"
      ? templateFromCrm
      : sqlVerticalTypeToUiTemplateFallback(t.verticalType);
  return {
    brandName: t.name || "Agency OS",
    brandColor: t.brandColor || "#2563eb",
    brandInitial: (t.name?.charAt(0) || "A").toUpperCase(),
    portalEnabled: true,
    verticalTemplate,
  };
}
