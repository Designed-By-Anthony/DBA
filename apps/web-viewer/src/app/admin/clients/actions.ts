"use server";

import type { PlanSuite } from "@dba/lead-form-contract";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/firebase";
import { verifyAuth } from "../actions";

// ============================================
// Client Organization Management
// ============================================

/**
 * List all organizations the current user belongs to,
 * enriched with prospect count from Firestore.
 */
export async function listClientOrgs() {
  const session = await verifyAuth();
  // Same dev/test bypass as the rest of admin — no Clerk session → empty list, not a thrown 500
  if (session.user.id === "dev") {
    return [];
  }

  const userId = session.user.id;
  const client = await clerkClient();
  const memberships = await client.users.getOrganizationMembershipList({ userId });

  const orgs = await Promise.all(
    memberships.data.map(async (m) => {
      const org = m.organization;

      // Count prospects for this org
      let prospectCount = 0;
      try {
        const snap = await db
          .collection("prospects")
          .where("agencyId", "==", org.id)
          .count()
          .get();
        prospectCount = snap.data().count;
      } catch {
        // Firestore count may fail on empty collections
      }

      // Get branding config if exists
      let branding = null;
      try {
        const brandDoc = await db.collection("org_settings").doc(org.id).get();
        if (brandDoc.exists) {
          branding = brandDoc.data();
        }
      } catch {
        // Non-critical
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
 * The current user becomes the admin automatically.
 */
export async function createClientOrg(name: string, verticalTemplate: string = "general") {
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

  // Initialize branding + vertical defaults in Firestore
  await db.collection("org_settings").doc(org.id).set({
    brandName: name,
    brandColor: "#2563eb",
    brandInitial: name.charAt(0).toUpperCase(),
    portalEnabled: true,
    // Vertical template — determines CRM layout per industry
    verticalTemplate,
    createdAt: new Date().toISOString(),
  });

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
  };
}

/**
 * Update org branding settings (stored in Firestore).
 */
export async function updateOrgBranding(orgId: string, settings: {
  brandName?: string;
  brandColor?: string;
  brandInitial?: string;
  portalEnabled?: boolean;
  /** Product tier: same pipeline; `starter` hides advanced modules in the sidebar. */
  planSuite?: PlanSuite;
}) {
  const session = await verifyAuth();
  if (session.user.id === "dev") {
    throw new Error("Sign in with Clerk to update organization settings.");
  }

  const userId = session.user.id;
  // Verify the user has access to the target org
  // (they must be a member of it)
  const client = await clerkClient();
  const memberships = await client.users.getOrganizationMembershipList({ userId });
  const isMember = memberships.data.some((m) => m.organization.id === orgId);
  if (!isMember) throw new Error("Unauthorized: Not a member of this organization");

  await db.collection("org_settings").doc(orgId).set(
    { ...settings, updatedAt: new Date().toISOString() },
    { merge: true }
  );

  return { success: true };
}

/**
 * Get branding settings for an org (used by portal).
 */
export async function getOrgBranding(orgId: string) {
  const doc = await db.collection("org_settings").doc(orgId).get();
  if (!doc.exists) {
    return {
      brandName: "Agency OS",
      brandColor: "#2563eb",
      brandInitial: "A",
      portalEnabled: true,
    };
  }
  return doc.data();
}
