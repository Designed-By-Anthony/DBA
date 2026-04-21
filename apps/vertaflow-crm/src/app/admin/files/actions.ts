"use server";

import { auth } from "@clerk/nextjs/server";
import { fileAttachments, getDb, withTenantContext } from "@dba/database";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function requireDb() {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	return db;
}

const attachmentSchema = z.object({
	entityType: z.enum([
		"appointment",
		"lead",
		"order",
		"event",
		"inventory_item",
		"ticket",
		"contract",
	]),
	entityId: z.string(),
	url: z.string().url(),
	fileName: z.string().max(255),
	mimeType: z.string().max(100).optional(),
	sizeBytes: z.number().int().min(0).optional(),
});

/** Attach a file (already uploaded to R2) to an entity. */
export async function createFileAttachment(
	data: z.infer<typeof attachmentSchema>,
) {
	const { orgId, userId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	const parsed = attachmentSchema.parse(data);
	const now = new Date().toISOString();

	return withTenantContext(db, orgId, async (tx) => {
		const [attachment] = await tx
			.insert(fileAttachments)
			.values({
				tenantId: orgId,
				entityType: parsed.entityType,
				entityId: parsed.entityId,
				url: parsed.url,
				fileName: parsed.fileName,
				mimeType: parsed.mimeType,
				sizeBytes: parsed.sizeBytes,
				uploadedBy: userId,
				createdAt: now,
			})
			.returning();

		revalidatePath("/admin/appointments");
		revalidatePath("/admin/clients");
		return attachment;
	});
}

/** Get all file attachments for an entity. */
export async function getEntityAttachments(
	entityType: string,
	entityId: string,
) {
	const { orgId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	return withTenantContext(db, orgId, async (tx) =>
		tx
			.select()
			.from(fileAttachments)
			.where(
				and(
					eq(fileAttachments.tenantId, orgId),
					eq(fileAttachments.entityType, entityType),
					eq(fileAttachments.entityId, entityId),
				),
			)
			.orderBy(fileAttachments.createdAt),
	);
}

/**
 * Get before/after photos for a job (Service Pro).
 * Convention: fileName prefix "BEFORE_" or "AFTER_" categorizes photos.
 */
export async function getBeforeAfterPhotos(appointmentId: string) {
	const { orgId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	return withTenantContext(db, orgId, async (tx) => {
		const all = await tx
			.select()
			.from(fileAttachments)
			.where(
				and(
					eq(fileAttachments.tenantId, orgId),
					eq(fileAttachments.entityType, "appointment"),
					eq(fileAttachments.entityId, appointmentId),
				),
			)
			.orderBy(fileAttachments.createdAt);

		return {
			before: all.filter((f) => f.fileName.startsWith("BEFORE_")),
			after: all.filter((f) => f.fileName.startsWith("AFTER_")),
			other: all.filter(
				(f) =>
					!f.fileName.startsWith("BEFORE_") && !f.fileName.startsWith("AFTER_"),
			),
		};
	});
}
