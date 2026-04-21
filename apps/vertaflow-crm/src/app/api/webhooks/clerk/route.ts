import "@dba/env/web-viewer-aliases";
import type { OrganizationJSON } from "@clerk/backend";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { getDb, tenants } from "@dba/database";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
	parseCrmConfigFromPublicMetadata,
	parseVerticalFromPublicMetadata,
} from "@/lib/tenant-metadata";

export const dynamic = "force-dynamic";

/**
 * Clerk → Postgres (Neon) sync for multi-tenant registry.
 *
 * Dashboard: Webhooks → endpoint `https://<your-viewer-host>/api/webhooks/clerk`
 * Events: `organization.created`, `organization.updated`, `organization.deleted`
 *
 * Set `public_metadata.vertical` at signup (e.g. `roofer`, `restaurant`) and optional `crm_config`.
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
		return NextResponse.json(
			{ error: "Database not configured" },
			{ status: 503 },
		);
	}

	try {
		if (evt.type === "organization.deleted") {
			const id = evt.data.id;
			if (id) {
				await db.delete(tenants).where(eq(tenants.clerkOrgId, id));
			}
			return NextResponse.json({ ok: true });
		}

		if (
			evt.type === "organization.created" ||
			evt.type === "organization.updated"
		) {
			const data = evt.data as OrganizationJSON;
			const vertical = parseVerticalFromPublicMetadata(data.public_metadata);
			const crmConfig = parseCrmConfigFromPublicMetadata(data.public_metadata);

			await db
				.insert(tenants)
				.values({
					clerkOrgId: data.id,
					name: data.name,
					verticalType: vertical,
					crmConfig,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				})
				.onConflictDoUpdate({
					target: tenants.clerkOrgId,
					set: {
						name: data.name,
						verticalType: vertical,
						crmConfig,
						updatedAt: new Date().toISOString(),
					},
				});

			return NextResponse.json({ ok: true });
		}

		return NextResponse.json({ ok: true, ignored: evt.type });
	} catch (e) {
		console.error("[clerk webhook] handler error", e);
		return NextResponse.json({ error: "Handler failed" }, { status: 500 });
	}
}
