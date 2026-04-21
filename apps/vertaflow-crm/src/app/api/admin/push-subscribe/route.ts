import { type NextRequest, NextResponse } from "next/server";
import "@dba/env/web-viewer-aliases";
import { auth } from "@clerk/nextjs/server";
import { getDb, pushSubscriptions, withTenantContext } from "@dba/database";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { apiError } from "@/lib/api-error";

const subscribeSchema = z.object({
	endpoint: z.string().url(),
	keys: z.object({
		p256dh: z.string().min(1),
		auth: z.string().min(1),
	}),
});

/**
 * POST   — subscribe admin browser for Web Push notifications.
 * DELETE — unsubscribe (body: { endpoint: string }).
 */

export async function POST(req: NextRequest) {
	try {
		const { orgId, userId } = await auth();
		if (!orgId || !userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = subscribeSchema.parse(await req.json());
		const db = getDb();
		if (!db) return NextResponse.json({ ok: true });

		await withTenantContext(db, orgId, async (tx) => {
			// Upsert — avoid duplicates for same endpoint
			const existing = await tx
				.select({ id: pushSubscriptions.id })
				.from(pushSubscriptions)
				.where(
					and(
						eq(pushSubscriptions.tenantId, orgId),
						eq(pushSubscriptions.userId, userId),
						eq(pushSubscriptions.endpoint, body.endpoint),
					),
				)
				.limit(1);

			if (existing.length > 0) {
				// Update keys in case they rotated
				await tx
					.update(pushSubscriptions)
					.set({
						p256dh: body.keys.p256dh,
						auth: body.keys.auth,
					})
					.where(eq(pushSubscriptions.id, existing[0].id));
			} else {
				await tx.insert(pushSubscriptions).values({
					tenantId: orgId,
					userId,
					endpoint: body.endpoint,
					p256dh: body.keys.p256dh,
					auth: body.keys.auth,
					createdAt: new Date().toISOString(),
				});
			}
		});

		return NextResponse.json({ ok: true });
	} catch (error: unknown) {
		return apiError("admin/push-subscribe/POST", error);
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const { orgId, userId } = await auth();
		if (!orgId || !userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = (await req.json()) as { endpoint?: string };
		if (!body.endpoint) {
			return NextResponse.json(
				{ error: "endpoint is required" },
				{ status: 400 },
			);
		}
		const ep = body.endpoint;

		const db = getDb();
		if (!db) return NextResponse.json({ ok: true });

		await withTenantContext(db, orgId, async (tx) => {
			await tx
				.delete(pushSubscriptions)
				.where(
					and(
						eq(pushSubscriptions.tenantId, orgId),
						eq(pushSubscriptions.userId, userId),
						eq(pushSubscriptions.endpoint, ep),
					),
				);
		});

		return NextResponse.json({ ok: true });
	} catch (error: unknown) {
		return apiError("admin/push-subscribe/DELETE", error);
	}
}
