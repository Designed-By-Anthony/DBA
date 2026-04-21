import Dexie, { type Table } from "dexie";
import { z } from "zod";

export const syncStatusSchema = z.enum(["pending", "synced"]);
export type SyncStatus = z.infer<typeof syncStatusSchema>;

const isoTimestampSchema = z
	.string()
	.datetime({ offset: true })
	.or(z.string().datetime({ local: true }));

const baseRecordSchema = z.object({
	local_id: z.string().uuid(),
	tenant_id: z.string().min(1),
	sync_status: syncStatusSchema.default("pending"),
	created_at: isoTimestampSchema,
	updated_at: isoTimestampSchema,
});

export const leadRecordSchema = baseRecordSchema.extend({
	entity: z.literal("lead").default("lead"),
	server_id: z.string().uuid().nullable().optional(),
	name: z.string().min(1),
	email: z.string().email(),
	status: z.string().min(1).default("new"),
	prospect_id: z.string().min(1),
});

export const estimateRecordSchema = baseRecordSchema.extend({
	entity: z.literal("estimate").default("estimate"),
	server_id: z.string().uuid().nullable().optional(),
	estimate_number: z.string().min(1),
	prospect_id: z.string().min(1),
	total_cents: z.number().int().nonnegative(),
	status: z.string().min(1).default("draft"),
});

export type LocalLeadRecord = z.infer<typeof leadRecordSchema>;
export type LocalEstimateRecord = z.infer<typeof estimateRecordSchema>;
export type OfflineRecord = LocalLeadRecord | LocalEstimateRecord;

export class VertaFlowOfflineDatabase extends Dexie {
	leads!: Table<LocalLeadRecord, string>;
	estimates!: Table<LocalEstimateRecord, string>;

	constructor() {
		super("vertaflow_offline_db");

		this.version(1).stores({
			leads:
				"local_id, tenant_id, sync_status, updated_at, created_at, server_id, email",
			estimates:
				"local_id, tenant_id, sync_status, updated_at, created_at, server_id, prospect_id",
		});
	}
}

export const localDb = new VertaFlowOfflineDatabase();
export const db = localDb;

export async function resetLocalTables() {
	await localDb.transaction(
		"rw",
		localDb.leads,
		localDb.estimates,
		async () => {
			await localDb.leads.clear();
			await localDb.estimates.clear();
		},
	);
}
