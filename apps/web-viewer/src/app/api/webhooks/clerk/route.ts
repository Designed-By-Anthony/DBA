import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { OrganizationJSON } from "@clerk/backend";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, tenants, withTenantClerkOrg } from "@dba/database";
import {
  hasExplicitShowKitchenDisplay,
  parseEngineConfigFromPublicMetadata,
  parseSlugFromPublicMetadata,
  parseVerticalFromPublicMetadata,
} from "@/lib/tenant-metadata";

export const dynamic = "force-dynamic";

function deriveSlug(data: OrganizationJSON): string {
  const fromMeta = parseSlugFromPublicMetadata(data.public_metadata);
  if (fromMeta) return fromMeta.replace(/[^a-z0-9-]/g, "").slice(0, 64) || fallbackSlug(data);
  return fallbackSlug(data);
}

function fallbackSlug(data: OrganizationJSON): string {
  const name = (data.name || "org")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "org";
  const suffix = data.id.replace(/[^a-z0-9]/gi, "").slice(-8) || "tenant";
  return `${name}-${suffix}`;
}

/**
 * Clerk → Cloud SQL sync for multi-tenant registry.
 *
 * Dashboard: Webhooks → endpoint `https://<your-viewer-host>/api/webhooks/clerk`
 * Events: `organization.created`, `organization.updated`, `organization.deleted`
 *
 * Set `public_metadata.vertical` (`agency` | `restaurant` | `service_pro` | `retail` or legacy aliases),
 * optional `slug`, and engine flags: `primaryColor`, `showKitchenDisplay`, `customEstimator` (or nested `crm_config`).
 */
export async function POST(request: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(request);
  } catch (e) {
    console.error("[clerk webhook] verify failed", e);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    if (evt.type === "organization.deleted") {
      const id = evt.data.id;
      if (id) {
        await withTenantClerkOrg(db, id, async (tx) => {
          await tx.delete(tenants).where(eq(tenants.clerkOrgId, id));
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (evt.type === "organization.created" || evt.type === "organization.updated") {
      const data = evt.data as OrganizationJSON;
      const vertical = parseVerticalFromPublicMetadata(data.public_metadata);
      let config = parseEngineConfigFromPublicMetadata(data.public_metadata);
      if (vertical === "restaurant" && !hasExplicitShowKitchenDisplay(data.public_metadata)) {
        config = { ...config, showKitchenDisplay: true };
      }
      const slug = deriveSlug(data);

      await withTenantClerkOrg(db, data.id, async (tx) => {
        await tx
          .insert(tenants)
          .values({
            clerkOrgId: data.id,
            name: data.name,
            slug,
            vertical,
            config,
          })
          .onConflictDoUpdate({
            target: tenants.clerkOrgId,
            set: {
              name: data.name,
              slug,
              vertical,
              config,
            },
          });
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, ignored: evt.type });
  } catch (e) {
    console.error("[clerk webhook] handler error", e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
