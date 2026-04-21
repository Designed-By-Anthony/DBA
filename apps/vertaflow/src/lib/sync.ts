import { z } from "zod";
import {
	type LocalEstimateRecord,
	type LocalLeadRecord,
	localDb,
	type OfflineRecord,
} from "@/lib/db";

export const syncBatchResponseSchema = z.object({
	syncedLocalIds: z.array(z.string().uuid()),
});

export type SyncBatchResponse = z.infer<typeof syncBatchResponseSchema>;
export type SyncApi = (records: OfflineRecord[]) => Promise<SyncBatchResponse>;

async function postSyncBatch(
	records: OfflineRecord[],
): Promise<SyncBatchResponse> {
	const response = await fetch("/api/sync", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ records }),
	});

	if (!response.ok) {
		throw new Error(`Sync endpoint failed with ${response.status}`);
	}

	const json = await response.json();
	return syncBatchResponseSchema.parse(json);
}

async function markSynced(localId: string): Promise<void> {
	const lead = await localDb.leads.get(localId);
	if (lead) {
		const nextLead: LocalLeadRecord = { ...lead, sync_status: "synced" };
		await localDb.leads.put(nextLead);
		return;
	}

	const estimate = await localDb.estimates.get(localId);
	if (estimate) {
		const nextEstimate: LocalEstimateRecord = {
			...estimate,
			sync_status: "synced",
		};
		await localDb.estimates.put(nextEstimate);
	}
}

export async function syncPendingRecords(
	syncApi: SyncApi = postSyncBatch,
): Promise<SyncBatchResponse> {
	if (typeof navigator !== "undefined" && !navigator.onLine) {
		return { syncedLocalIds: [] };
	}

	const pendingLeads = await localDb.leads
		.where("sync_status")
		.equals("pending")
		.toArray();
	const pendingEstimates = await localDb.estimates
		.where("sync_status")
		.equals("pending")
		.toArray();
	const allPending = [...pendingLeads, ...pendingEstimates];

	if (allPending.length === 0) {
		return { syncedLocalIds: [] };
	}

	const result = await syncApi(allPending);

	if (result.syncedLocalIds.length > 0) {
		await localDb.transaction(
			"rw",
			localDb.leads,
			localDb.estimates,
			async () => {
				await Promise.all(
					result.syncedLocalIds.map((localId) => markSynced(localId)),
				);
			},
		);
	}

	return result;
}
