/**
 * Stripe metadata keys for mapping Stripe objects to Clerk orgs (tenants).
 * Every product, checkout session, and customer created for CRM flows must include
 * `clerk_org_id` so webhooks and Price Book queries stay tenant-scoped.
 */
export const STRIPE_METADATA_CLERK_ORG = "clerk_org_id" as const;
export const STRIPE_METADATA_PROSPECT_ID = "prospect_id" as const;

/** Stripe Search query fragment: products belonging to this Clerk organization. */
export function productSearchQueryForTenant(clerkOrgId: string): string {
  const id = clerkOrgId.trim();
  return `metadata['${STRIPE_METADATA_CLERK_ORG}']:'${escapeStripeSearchLiteral(id)}'`;
}

function escapeStripeSearchLiteral(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
