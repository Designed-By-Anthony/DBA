import {
	type Database,
	estimates,
	getDb,
	leads,
	withTenantContext,
} from "@dba/database";
import { and, desc, eq } from "drizzle-orm";
import {
	type EstimateSyncRecord,
	type LeadSyncRecord,
	type SyncPayload,
	syncPayloadSchema,
} from "./schema";

type SyncResult = {
	accepted: number;
	ignored: number;
	source: "database" | "noop";
};

type SyncResponse = {
	leads: SyncResult;
	estimates: SyncResult;
};

function isIncomingMoreRecent(
	existingUpdatedAt: string,
	incomingUpdatedAt: string,
): boolean {
	return (
		new Date(incomingUpdatedAt).getTime() >
		new Date(existingUpdatedAt).getTime()
	);
}

async function upsertLeadRecord(
	tx: Database,
	tenantId: string,
	lead: LeadSyncRecord,
): Promise<boolean> {
	const existing = await tx
		.select()
		.from(leads)
		.where(and(eq(leads.tenantId, tenantId), eq(leads.id, lead.server_id)))
		.limit(1);

	const row = existing[0];
	if (!row) {
		await tx.insert(leads).values({
			id: lead.server_id,
			tenantId,
			prospectId: lead.prospect_id,
			name: lead.name,
			email: lead.email,
			emailNormalized: lead.email.trim().toLowerCase(),
			status: lead.status,
			source: "vertaflow_offline_sync",
			company: null,
			website: null,
			dealValue: 0,
			notes: null,
			tags: [],
			assignedTo: null,
			lastContactedAt: null,
			unsubscribed: false,
			leadScore: 0,
			healthStatus: "healthy",
			targetUrl: null,
			stagingUrl: null,
			contractDocUrl: null,
			driveFolderUrl: null,
			contractSigned: false,
			contractStatus: "draft",
			stripeCustomerId: null,
			stripeSubscriptionId: null,
			pricingTier: null,
			projectNotes: null,
			fcmToken: null,
			metadata: { local_id: lead.local_id },
			createdAt: lead.created_at,
			updatedAt: lead.updated_at,
		});
		return true;
	}

	if (!isIncomingMoreRecent(row.updatedAt, lead.updated_at)) {
		return false;
	}

	await tx
		.update(leads)
		.set({
			name: lead.name,
			email: lead.email,
			emailNormalized: lead.email.trim().toLowerCase(),
			status: lead.status,
			metadata: { ...row.metadata, local_id: lead.local_id },
			updatedAt: lead.updated_at,
		})
		.where(and(eq(leads.tenantId, tenantId), eq(leads.id, lead.server_id)));
	return true;
}

async function upsertEstimateRecord(
	tx: Database,
	tenantId: string,
	estimate: EstimateSyncRecord,
): Promise<boolean> {
	const existing = await tx
		.select()
		.from(estimates)
		.where(
			and(
				eq(estimates.tenantId, tenantId),
				eq(estimates.id, estimate.server_id),
			),
		)
		.limit(1);

	const row = existing[0];
	if (!row) {
		await tx.insert(estimates).values({
			id: estimate.server_id,
			tenantId,
			estimateNumber: estimate.estimate_number,
			prospectId: estimate.prospect_id,
			templateType: "estimate",
			status: estimate.status,
			lineItems: [],
			proposalContent: null,
			terms: null,
			totalCents: estimate.total_cents,
			sentAt: null,
			validUntil: null,
			viewedAt: null,
			createdBy: null,
			createdAt: estimate.created_at,
			updatedAt: estimate.updated_at,
		});
		return true;
	}

	if (!isIncomingMoreRecent(row.updatedAt, estimate.updated_at)) {
		return false;
	}

	await tx
		.update(estimates)
		.set({
			estimateNumber: estimate.estimate_number,
			prospectId: estimate.prospect_id,
			status: estimate.status,
			totalCents: estimate.total_cents,
			updatedAt: estimate.updated_at,
		})
		.where(
			and(
				eq(estimates.tenantId, tenantId),
				eq(estimates.id, estimate.server_id),
			),
		);
	return true;
}

export async function syncOfflineRecords(
	payload: SyncPayload,
	deps: { db?: Database | null } = {},
): Promise<SyncResponse> {
	const parsed = syncPayloadSchema.parse(payload);
	const db = deps.db ?? getDb();

	if (!db) {
		return {
			leads: { accepted: 0, ignored: parsed.leads.length, source: "noop" },
			estimates: {
				accepted: 0,
				ignored: parsed.estimates.length,
				source: "noop",
			},
		};
	}

	const leadResult = { accepted: 0, ignored: 0 };
	const estimateResult = { accepted: 0, ignored: 0 };

	await withTenantContext(db, parsed.tenant_id, async (tx) => {
		for (const lead of parsed.leads) {
			const didWrite = await upsertLeadRecord(
				tx as unknown as Database,
				parsed.tenant_id,
				lead,
			);
			if (didWrite) {
				leadResult.accepted += 1;
			} else {
				leadResult.ignored += 1;
			}
		}

		for (const estimate of parsed.estimates) {
			const didWrite = await upsertEstimateRecord(
				tx as unknown as Database,
				parsed.tenant_id,
				estimate,
			);
			if (didWrite) {
				estimateResult.accepted += 1;
			} else {
				estimateResult.ignored += 1;
			}
		}
	});

	return {
		leads: { ...leadResult, source: "database" },
		estimates: { ...estimateResult, source: "database" },
	};
}

export async function getNewestLeadUpdatedAt(
	db: Database,
	tenantId: string,
	leadId: string,
): Promise<string | null> {
	const rows = await db
		.select({ updatedAt: leads.updatedAt })
		.from(leads)
		.where(and(eq(leads.tenantId, tenantId), eq(leads.id, leadId)))
		.orderBy(desc(leads.updatedAt))
		.limit(1);
	return rows[0]?.updatedAt ?? null;
}
