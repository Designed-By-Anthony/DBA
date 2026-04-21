import { auth } from "@clerk/nextjs/server";
import { fileAttachments, getDb } from "@dba/database";
import { type NextRequest, NextResponse } from "next/server";
import { uniqueFileName, uploadToR2 } from "@/lib/r2";

/**
 * POST /api/admin/upload
 *
 * Accepts multipart form data with a file, entity type, and entity ID.
 * Uploads to R2 and creates a file_attachments record.
 */
export async function POST(req: NextRequest) {
	const { orgId, userId } = await auth();
	if (!orgId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const formData = await req.formData();
	const file = formData.get("file") as File | null;
	const entityType = formData.get("entityType") as string | null;
	const entityId = formData.get("entityId") as string | null;

	if (!file || !entityType || !entityId) {
		return NextResponse.json(
			{ error: "Missing file, entityType, or entityId" },
			{ status: 400 },
		);
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const fileName = uniqueFileName(file.name);
	const path = `${entityType}/${entityId}/${fileName}`;

	const result = await uploadToR2(buffer, path, orgId, file.type);

	const db = getDb();
	if (!db) {
		return NextResponse.json(
			{ error: "Database unavailable" },
			{ status: 503 },
		);
	}

	const now = new Date().toISOString();
	const [record] = await db
		.insert(fileAttachments)
		.values({
			tenantId: orgId,
			url: result.url,
			fileName: file.name,
			mimeType: file.type,
			sizeBytes: result.sizeBytes,
			entityType,
			entityId,
			uploadedBy: userId ?? undefined,
			createdAt: now,
		})
		.returning();

	return NextResponse.json({
		id: record.id,
		url: record.url,
		fileName: record.fileName,
	});
}
