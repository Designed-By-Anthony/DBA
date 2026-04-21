import { type NextRequest, NextResponse } from "next/server";
import "@dba/env/web-viewer-aliases";
import { auth } from "@clerk/nextjs/server";
import { getDb, invoices, withTenantContext } from "@dba/database";
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

const createInvoiceSchema = z.object({
	contractId: z.string().uuid().optional(),
	estimateId: z.string().uuid().optional(),
	prospectId: z.string().optional(),
	lineItems: z.array(lineItemSchema),
	dueDate: z.string().optional(),
});

/**
 * GET /api/admin/invoices — list invoices.
 */
export async function GET(req: NextRequest) {
	try {
		const { orgId, userId } = await auth();
		if (!orgId || !userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const db = getDb();
		if (!db) return NextResponse.json({ invoices: [] });

		const statusFilter = req.nextUrl.searchParams.get("status");

		const rows = await withTenantContext(db, orgId, async (tx) => {
			const conditions = [eq(invoices.tenantId, orgId)];
			if (statusFilter) {
				conditions.push(eq(invoices.status, statusFilter as "draft"));
			}
			return tx
				.select()
				.from(invoices)
				.where(and(...conditions))
				.orderBy(desc(invoices.createdAt))
				.limit(100);
		});

		return NextResponse.json({ invoices: rows });
	} catch (error: unknown) {
		return apiError("admin/invoices/GET", error);
	}
}

/**
 * POST /api/admin/invoices — create a new invoice.
 */
export async function POST(req: NextRequest) {
	try {
		const { orgId, userId } = await auth();
		if (!orgId || !userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = createInvoiceSchema.safeParse(await req.json());
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
		const totalCents = body.data.lineItems.reduce(
			(sum, item) => sum + item.unitPriceCents * item.quantity,
			0,
		);

		const result = await withTenantContext(db, orgId, async (tx) => {
			// Generate next invoice number
			const existing = await tx
				.select()
				.from(invoices)
				.where(eq(invoices.tenantId, orgId))
				.orderBy(desc(invoices.createdAt))
				.limit(1);

			const nextNum =
				existing.length > 0
					? parseInt(existing[0].invoiceNumber.replace(/\D/g, "") || "0", 10) +
						1
					: 1;

			const invoiceNumber = `INV-${String(nextNum).padStart(4, "0")}`;

			const [row] = await tx
				.insert(invoices)
				.values({
					tenantId: orgId,
					invoiceNumber,
					contractId: body.data.contractId ?? null,
					estimateId: body.data.estimateId ?? null,
					prospectId: body.data.prospectId ?? null,
					lineItems: body.data.lineItems,
					totalCents,
					dueDate: body.data.dueDate ?? null,
					createdBy: userId,
					createdAt: now,
					updatedAt: now,
				})
				.returning();

			return row;
		});

		return NextResponse.json({ invoice: result }, { status: 201 });
	} catch (error: unknown) {
		return apiError("admin/invoices/POST", error);
	}
}

/**
 * PATCH /api/admin/invoices — update invoice status.
 */
export async function PATCH(req: NextRequest) {
	try {
		const { orgId, userId } = await auth();
		if (!orgId || !userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = z
			.object({
				id: z.string().uuid(),
				status: z
					.enum(["draft", "sent", "paid", "overdue", "voided", "refunded"])
					.optional(),
			})
			.safeParse(await req.json());

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

		if (body.data.status) {
			updates.status = body.data.status;
			if (body.data.status === "sent") updates.sentAt = now;
			if (body.data.status === "paid") updates.paidAt = now;
		}

		await withTenantContext(db, orgId, async (tx) => {
			await tx
				.update(invoices)
				.set(updates)
				.where(
					and(eq(invoices.id, body.data.id), eq(invoices.tenantId, orgId)),
				);
		});

		return NextResponse.json({ ok: true });
	} catch (error: unknown) {
		return apiError("admin/invoices/PATCH", error);
	}
}
