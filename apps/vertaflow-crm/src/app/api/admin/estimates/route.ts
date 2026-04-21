import { type NextRequest, NextResponse } from "next/server";
import "@dba/env/web-viewer-aliases";
import { auth } from "@clerk/nextjs/server";
import { estimates, getDb, withTenantContext } from "@dba/database";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { apiError } from "@/lib/api-error";

const lineItemSchema = z.object({
	id: z.string(),
	stripeProductId: z.string().optional(),
	name: z.string().min(1),
	description: z.string().optional(),
	quantity: z.number().min(1),
	unitPriceCents: z.number().min(0),
	interval: z.string(),
});

const createEstimateSchema = z.object({
	prospectId: z.string().optional(),
	templateType: z.enum(["estimate", "proposal"]).default("estimate"),
	lineItems: z.array(lineItemSchema).default([]),
	proposalContent: z.string().optional(),
	terms: z.string().optional(),
	validUntil: z.string().optional(),
});

const updateEstimateSchema = z.object({
	id: z.string().uuid(),
	lineItems: z.array(lineItemSchema).optional(),
	proposalContent: z.string().optional(),
	terms: z.string().optional(),
	validUntil: z.string().optional(),
	status: z
		.enum(["draft", "sent", "viewed", "accepted", "declined", "expired"])
		.optional(),
});

/**
 * GET /api/admin/estimates — list estimates for the current org.
 */
export async function GET(req: NextRequest) {
	try {
		const { orgId, userId } = await auth();
		if (!orgId || !userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const db = getDb();
		if (!db) return NextResponse.json({ estimates: [] });

		const statusFilter = req.nextUrl.searchParams.get("status");

		const rows = await withTenantContext(db, orgId, async (tx) => {
			const conditions = [eq(estimates.tenantId, orgId)];
			if (statusFilter) {
				conditions.push(eq(estimates.status, statusFilter as "draft"));
			}
			return tx
				.select()
				.from(estimates)
				.where(and(...conditions))
				.orderBy(desc(estimates.createdAt))
				.limit(100);
		});

		return NextResponse.json({ estimates: rows });
	} catch (error: unknown) {
		return apiError("admin/estimates/GET", error);
	}
}

/**
 * POST /api/admin/estimates — create a new estimate.
 */
export async function POST(req: NextRequest) {
	try {
		const { orgId, userId } = await auth();
		if (!orgId || !userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = createEstimateSchema.safeParse(await req.json());
		if (!body.success) {
			return NextResponse.json(
				{ error: "Invalid payload", details: body.error.flatten() },
				{ status: 400 },
			);
		}

		const db = getDb();
		if (!db)
			return NextResponse.json(
				{ error: "Database unavailable" },
				{ status: 503 },
			);

		const now = new Date().toISOString();
		const totalCents = body.data.lineItems.reduce(
			(sum, item) => sum + item.unitPriceCents * item.quantity,
			0,
		);

		const result = await withTenantContext(db, orgId, async (tx) => {
			// Generate next estimate number
			const existing = await tx
				.select()
				.from(estimates)
				.where(eq(estimates.tenantId, orgId))
				.orderBy(desc(estimates.createdAt))
				.limit(1);

			const nextNum =
				existing.length > 0
					? parseInt(existing[0].estimateNumber.replace(/\D/g, "") || "0", 10) +
						1
					: 1;

			const estimateNumber = `EST-${String(nextNum).padStart(4, "0")}`;

			const [row] = await tx
				.insert(estimates)
				.values({
					tenantId: orgId,
					estimateNumber,
					prospectId: body.data.prospectId ?? null,
					templateType: body.data.templateType,
					lineItems: body.data.lineItems,
					proposalContent: body.data.proposalContent ?? null,
					terms: body.data.terms ?? null,
					totalCents,
					validUntil: body.data.validUntil ?? null,
					createdBy: userId,
					createdAt: now,
					updatedAt: now,
				})
				.returning();

			return row;
		});

		return NextResponse.json({ estimate: result }, { status: 201 });
	} catch (error: unknown) {
		return apiError("admin/estimates/POST", error);
	}
}

/**
 * PATCH /api/admin/estimates — update an existing estimate.
 */
export async function PATCH(req: NextRequest) {
	try {
		const { orgId, userId } = await auth();
		if (!orgId || !userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = updateEstimateSchema.safeParse(await req.json());
		if (!body.success) {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
		}

		const db = getDb();
		if (!db)
			return NextResponse.json(
				{ error: "Database unavailable" },
				{ status: 503 },
			);

		const now = new Date().toISOString();
		const updates: Record<string, unknown> = { updatedAt: now };

		if (body.data.lineItems) {
			updates.lineItems = body.data.lineItems;
			updates.totalCents = body.data.lineItems.reduce(
				(sum, item) => sum + item.unitPriceCents * item.quantity,
				0,
			);
		}
		if (body.data.proposalContent !== undefined)
			updates.proposalContent = body.data.proposalContent;
		if (body.data.terms !== undefined) updates.terms = body.data.terms;
		if (body.data.validUntil !== undefined)
			updates.validUntil = body.data.validUntil;
		if (body.data.status) {
			updates.status = body.data.status;
			if (body.data.status === "sent") updates.sentAt = now;
		}

		await withTenantContext(db, orgId, async (tx) => {
			await tx
				.update(estimates)
				.set(updates)
				.where(
					and(eq(estimates.id, body.data.id), eq(estimates.tenantId, orgId)),
				);
		});

		return NextResponse.json({ ok: true });
	} catch (error: unknown) {
		return apiError("admin/estimates/PATCH", error);
	}
}
