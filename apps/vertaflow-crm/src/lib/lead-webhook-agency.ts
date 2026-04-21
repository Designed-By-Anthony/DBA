/**
 * Lead webhook agency resolver — pure Drizzle + Postgres.
 */

import { getDb, tenants } from "@dba/database";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

export type CalendlyTenantResolution =
	| { ok: true; tenantId: string }
	| { ok: false; status: number; message: string };

/**
 * Resolve which CRM tenant a Calendly booking belongs to.
 *
 * **Multi-tenant:** In Calendly, set the webhook URL to include your Clerk org id, e.g.
 * `https://your-app.com/api/webhooks/calendly?tenant=org_abc` (one webhook subscription per
 * agency, or one URL per Calendly account). The hairdresser’s bookings must not use the plumber’s
 * `tenant` value.
 *
 * **Single-tenant:** Set `LEAD_WEBHOOK_DEFAULT_AGENCY_ID` and omit `?tenant=`.
 */
export async function resolveCalendlyWebhookTenant(
	request: NextRequest,
): Promise<CalendlyTenantResolution> {
	const q = request.nextUrl.searchParams.get("tenant")?.trim();
	if (q) {
		const db = getDb();
		if (db) {
			const rows = await db
				.select({ clerkOrgId: tenants.clerkOrgId })
				.from(tenants)
				.where(eq(tenants.clerkOrgId, q))
				.limit(1);
			if (rows.length === 0) {
				return {
					ok: false,
					status: 400,
					message:
						"Unknown tenant (?tenant= must be a Clerk org id present in tenants)",
				};
			}
		}
		return { ok: true, tenantId: q };
	}

	const fallback = await resolveLeadAgencyId(null);
	if (!fallback) {
		return {
			ok: false,
			status: 503,
			message:
				"Calendly webhook: set LEAD_WEBHOOK_DEFAULT_AGENCY_ID or add ?tenant=<Clerk org id> to the webhook URL.",
		};
	}
	return { ok: true, tenantId: fallback };
}

/**
 * Resolve the agency (tenant) ID from an optional incoming agencyId.
 * Falls back to LEAD_WEBHOOK_DEFAULT_AGENCY_ID env var.
 */
export async function resolveLeadAgencyId(
	incomingAgencyId?: string | null,
): Promise<string> {
	// If an agency ID was provided, verify it exists
	if (incomingAgencyId) {
		const db = getDb();
		if (db) {
			const rows = await db
				.select({ clerkOrgId: tenants.clerkOrgId })
				.from(tenants)
				.where(eq(tenants.clerkOrgId, incomingAgencyId))
				.limit(1);

			if (rows.length > 0) return incomingAgencyId;
		} else {
			return incomingAgencyId;
		}
	}

	// Fall back to the default agency ID
	const defaultId = process.env.LEAD_WEBHOOK_DEFAULT_AGENCY_ID;
	if (defaultId) return defaultId;

	return "";
}
