import { NextRequest, NextResponse } from "next/server";
import "@dba/env/web-viewer-aliases";
import { auth } from "@clerk/nextjs/server";
import { getDb, reviewRequests, withTenantContext } from "@dba/database";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { apiError } from "@/lib/api-error";

const createReviewSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  prospectId: z.string().optional(),
  platform: z.string().default("google"),
  reviewUrl: z.string().url(),
});

/**
 * GET /api/admin/review-requests — list review requests.
 */
export async function GET() {
  try {
    const { orgId, userId } = await auth();
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ reviewRequests: [] });

    const rows = await withTenantContext(db, orgId, async (tx) => {
      return tx
        .select()
        .from(reviewRequests)
        .where(eq(reviewRequests.tenantId, orgId))
        .orderBy(desc(reviewRequests.createdAt))
        .limit(100);
    });

    return NextResponse.json({ reviewRequests: rows });
  } catch (error: unknown) {
    return apiError("admin/review-requests/GET", error);
  }
}

/**
 * POST /api/admin/review-requests — create a review request.
 */
export async function POST(req: NextRequest) {
  try {
    const { orgId, userId } = await auth();
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = createReviewSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    const now = new Date().toISOString();

    const result = await withTenantContext(db, orgId, async (tx) => {
      const [row] = await tx
        .insert(reviewRequests)
        .values({
          tenantId: orgId,
          invoiceId: body.data.invoiceId ?? null,
          prospectId: body.data.prospectId ?? null,
          platform: body.data.platform,
          reviewUrl: body.data.reviewUrl,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return row;
    });

    return NextResponse.json({ reviewRequest: result }, { status: 201 });
  } catch (error: unknown) {
    return apiError("admin/review-requests/POST", error);
  }
}

/**
 * PATCH /api/admin/review-requests — mark as sent/completed.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { orgId, userId } = await auth();
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = z.object({
      id: z.string().uuid(),
      action: z.enum(["send", "complete"]),
    }).safeParse(await req.json());

    if (!body.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (body.data.action === "send") updates.sentAt = now;
    if (body.data.action === "complete") updates.completedAt = now;

    await withTenantContext(db, orgId, async (tx) => {
      await tx
        .update(reviewRequests)
        .set(updates)
        .where(eq(reviewRequests.id, body.data.id));
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return apiError("admin/review-requests/PATCH", error);
  }
}
