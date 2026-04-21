import { z } from "zod";

export const syncStatusSchema = z.enum(["pending", "synced"]);
export type SyncStatus = z.infer<typeof syncStatusSchema>;

export const syncEntitySchema = z.enum(["lead", "estimate"]);
export type SyncEntity = z.infer<typeof syncEntitySchema>;

const isoDatetimeSchema = z
	.string()
	.datetime({ offset: true })
	.or(z.string().datetime({ local: true }));

export const syncRecordPayloadSchema = z
	.record(z.string(), z.unknown())
	.default({});

export const syncBatchRecordSchema = z.object({
	entity: syncEntitySchema,
	local_id: z.string().uuid(),
	tenant_id: z.string().min(1),
	sync_status: syncStatusSchema.default("pending"),
	updated_at: isoDatetimeSchema,
	created_at: isoDatetimeSchema,
	payload: syncRecordPayloadSchema,
});

export const syncBatchRequestSchema = z.object({
	records: z.array(syncBatchRecordSchema),
});

export const syncBatchResponseSchema = z.object({
	syncedLocalIds: z.array(z.string().uuid()),
});

export type SyncBatchRecord = z.infer<typeof syncBatchRecordSchema>;
export type SyncBatchRequest = z.infer<typeof syncBatchRequestSchema>;
export type SyncBatchResponse = z.infer<typeof syncBatchResponseSchema>;
