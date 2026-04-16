import { getTenantByOrgId } from "@/lib/tenant-db";

/**
 * Stripe Checkout session metadata key — use this consistently across webhooks and reporting.
 * Mirrors `tenants.vertical` in Cloud SQL when the org is provisioned.
 */
export const STRIPE_META_VERTICAL_TYPE = "vertical_type" as const;
/** Tenant/org identifier to correlate payment → provisioning. */
export const STRIPE_META_CLIENT_ID = "client_id" as const;

/** Resolves the org's industry vertical for Stripe metadata (defaults when SQL row missing). */
export async function resolveVerticalTypeForStripe(orgId: string): Promise<string> {
  const row = await getTenantByOrgId(orgId);
  return row?.vertical ?? "agency";
}
