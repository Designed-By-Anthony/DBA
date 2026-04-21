import "@dba/env/web-viewer-aliases";
import { auth } from "@clerk/nextjs/server";
import { getTenantByOrgId } from "@/lib/tenant-db";

/**
 * Resolve the Cloudflare zone + allowed hostname suffix for the calling tenant.
 *
 * Use this helper as the ONLY entry point in any admin route that touches
 * Cloudflare DNS or custom-hostname resources. It:
 *
 *   1. Requires a Clerk session with an active organization.
 *   2. Looks up that org's tenant row and returns its zone ID + apex hostname.
 *   3. Returns a discriminated-union error if the tenant isn't provisioned
 *      for Cloudflare (cloudflare_zone_id IS NULL).
 *
 * The old admin routes read a single `CLOUDFLARE_ZONE_ID` env var, which
 * meant any authenticated org member could manipulate every other tenant's
 * DNS on the shared zone. This helper structurally removes that class of
 * bug — a missing value returns `tenant_not_provisioned` (404), not
 * "fall back to some other tenant's zone".
 *
 * A future admin DNS / hostname route should:
 *
 *    const z = await resolveTenantZone();
 *    if (!z.ok) return NextResponse.json({ error: z.reason }, { status: z.status });
 *    // ...call Cloudflare with z.zoneId, validate hostnames end with z.apex
 */
export async function resolveTenantZone(): Promise<
	| { ok: true; orgId: string; zoneId: string; apex: string }
	| { ok: false; status: 401 | 403 | 404 | 503; reason: string }
> {
	if (!process.env.CLERK_SECRET_KEY) {
		return { ok: false, status: 503, reason: "Auth not configured" };
	}

	const { userId, orgId } = await auth();
	if (!userId) return { ok: false, status: 401, reason: "Unauthorized" };
	if (!orgId)
		return { ok: false, status: 403, reason: "Organization required" };

	const tenant = await getTenantByOrgId(orgId);
	if (!tenant) return { ok: false, status: 404, reason: "Tenant not found" };
	if (!tenant.cloudflareZoneId || !tenant.cloudflareApexHostname) {
		return {
			ok: false,
			status: 404,
			reason: "Tenant not provisioned for Cloudflare",
		};
	}

	return {
		ok: true,
		orgId,
		zoneId: tenant.cloudflareZoneId,
		apex: tenant.cloudflareApexHostname,
	};
}

/**
 * Validate that a Cloudflare resource's target hostname belongs to this tenant.
 *
 * Call this before creating any DNS record or custom hostname under a tenant's
 * zone. Without this check, a compromised admin on tenant A could write a DNS
 * record that targets a completely unrelated hostname — the Cloudflare API
 * would happily store it against tenant A's zone (since only the zone check
 * matters at the API level), but the record would not resolve anywhere useful.
 * Stops mass-takeover attempts at the application layer before they leave a
 * confusing trail in someone's Cloudflare dashboard.
 *
 * Returns true iff `hostname` ends with ".${apex}" or equals the apex itself,
 * case-insensitive.
 */
export function isHostnameUnderApex(hostname: string, apex: string): boolean {
	const h = hostname.trim().toLowerCase();
	const a = apex.trim().toLowerCase();
	if (!h || !a) return false;
	return h === a || h.endsWith(`.${a}`);
}
