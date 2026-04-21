import { type NextRequest, NextResponse } from "next/server";
import "@dba/env/web-viewer-aliases";
import { auth } from "@clerk/nextjs/server";
import { getDb, notifications, withTenantContext } from "@dba/database";
import { and, desc, eq } from "drizzle-orm";
import { apiError } from "@/lib/api-error";

/**
 * GET  — list recent notifications for the current user (last 50).
 * PATCH — mark notifications as read (body: { ids: string[] } or { all: true }).
 */

export async function GET(req: NextRequest) {
	try {
		const { orgId, userId } = await auth();
		if (!orgId || !userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const db = getDb();
		if (!db) return NextResponse.json({ notifications: [] });

		const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";

		const rows = await withTenantContext(db, orgId, async (tx) => {
			const conditions = [eq(notifications.tenantId, orgId)];

			if (unreadOnly) {
				conditions.push(eq(notifications.isRead, false));
			}

			return tx
				.select()
				.from(notifications)
				.where(and(...conditions))
				.orderBy(desc(notifications.createdAt))
				.limit(50);
		});

		// Filter: show notifications where userId is null (org-wide) or matches current user
		const filtered = rows.filter(
			(n) => n.userId === null || n.userId === userId,
		);

		return NextResponse.json({
			notifications: filtered,
			unreadCount: filtered.filter((n) => !n.isRead).length,
		});
	} catch (error: unknown) {
		return apiError("admin/notifications/GET", error);
	}
}

export async function PATCH(req: NextRequest) {
	try {
		const { orgId, userId } = await auth();
		if (!orgId || !userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = (await req.json()) as { ids?: string[]; all?: boolean };
		const db = getDb();
		if (!db) return NextResponse.json({ ok: true });

		await withTenantContext(db, orgId, async (tx) => {
			if (body.all) {
				// Mark all org notifications as read for this user
				await tx
					.update(notifications)
					.set({ isRead: true })
					.where(
						and(
							eq(notifications.tenantId, orgId),
							eq(notifications.isRead, false),
						),
					);
			} else if (body.ids && body.ids.length > 0) {
				for (const id of body.ids) {
					await tx
						.update(notifications)
						.set({ isRead: true })
						.where(
							and(eq(notifications.id, id), eq(notifications.tenantId, orgId)),
						);
				}
			}
		});

		return NextResponse.json({ ok: true });
	} catch (error: unknown) {
		return apiError("admin/notifications/PATCH", error);
	}
}
