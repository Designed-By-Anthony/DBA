import { getDb, leads } from "@dba/database";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getSecret, verifySharedSecret } from "@/lib/webhook-auth";

/**
 * IDX Webhook — property view / saved-search telemetry.
 * Auth: Bearer <IDX_WEBHOOK_SECRET> or x-webhook-secret header.
 */
export async function POST(req: NextRequest) {
	const secret = getSecret("IDX_WEBHOOK_SECRET");
	if (!secret) {
		console.error("[idx] webhook rejected: IDX_WEBHOOK_SECRET not configured");
		return NextResponse.json(
			{ error: "Webhook not configured" },
			{ status: 503 },
		);
	}
	if (!verifySharedSecret(req.headers, secret)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const payload = await req.json();
		const leadIdRaw = payload.leadId;
		const event = String(payload.event || "");
		const data = payload.data || {};

		if (!leadIdRaw || !event) {
			return NextResponse.json(
				{ error: "Missing payload data" },
				{ status: 400 },
			);
		}

		const leadId = String(leadIdRaw).trim();
		const db = getDb();
		if (!db) {
			return NextResponse.json(
				{ error: "Database not configured" },
				{ status: 503 },
			);
		}

		const prospectRows = await db
			.select()
			.from(leads)
			.where(eq(leads.prospectId, leadId))
			.limit(1);

		if (prospectRows.length === 0) {
			return NextResponse.json(
				{ error: "Prospect not found" },
				{ status: 404 },
			);
		}

		const prospect = prospectRows[0];

		// Build interaction note
		let interactionNote = "";
		if (event === "property_view") {
			interactionNote = `[IDX Telemetry] Viewed MLS #${data.mlsNumber} (${data.address}) listed at $${data.price}. Total views: ${data.viewCount}`;
		} else if (event === "saved_search") {
			interactionNote = `[IDX Telemetry] Saved new search filter: ${data.searchCriteria}`;
		} else {
			interactionNote = `[IDX Telemetry] Unknown event: ${event}`;
		}

		const currentNotes = prospect.notes || "";
		const updatedNotes = `${new Date().toISOString()} - ${interactionNote}\n\n${currentNotes}`;

		await db
			.update(leads)
			.set({
				notes: updatedNotes,
				lastContactedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})
			.where(eq(leads.prospectId, leadId));

		return NextResponse.json({ success: true, recorded: true });
	} catch (error) {
		console.error("[IDX Webhook Error]", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
