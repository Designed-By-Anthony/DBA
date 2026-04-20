import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { getDb, notificationPreferences, withTenantContext } from "@dba/database";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { apiError } from "@/lib/api-error";

/**
 * GET /api/admin/notification-preferences
 * Returns org-wide mandatory settings (__org_default__ rows) + personal preferences.
 */
export async function GET() {
  try {
    const { orgId, userId } = await auth();
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ orgDefaults: [], personal: [] });

    const rows = await withTenantContext(db, orgId, async (tx) =>
      tx
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.tenantId, orgId)),
    );

    const orgDefaults = rows.filter((r) => r.userId === "__org_default__");
    const personal = rows.filter((r) => r.userId === userId);

    return NextResponse.json({ orgDefaults, personal });
  } catch (error: unknown) {
    return apiError("admin/notification-preferences/GET", error);
  }
}

const prefSchema = z.object({
  events: z.array(
    z.object({
      eventType: z.string(),
      emailEnabled: z.boolean(),
      pushEnabled: z.boolean(),
      inAppEnabled: z.boolean(),
      mandatory: z.boolean(),
    }),
  ),
});

/**
 * PUT /api/admin/notification-preferences
 * Admin: upserts org-wide mandatory baselines (__org_default__).
 * Member: upserts personal channel preferences.
 */
export async function PUT(req: NextRequest) {
  try {
    const { orgId, userId, orgRole } = await auth();
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = prefSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    const isAdmin = orgRole === "org:admin";
    const now = new Date().toISOString();

    await withTenantContext(db, orgId, async (tx) => {
      for (const event of body.data.events) {
        if (isAdmin) {
          const existing = await tx
            .select()
            .from(notificationPreferences)
            .where(
              and(
                eq(notificationPreferences.tenantId, orgId),
                eq(notificationPreferences.eventType, event.eventType),
                eq(notificationPreferences.userId, "__org_default__"),
              ),
            )
            .limit(1);

          if (existing.length > 0) {
            await tx
              .update(notificationPreferences)
              .set({
                emailEnabled: event.emailEnabled,
                pushEnabled: event.pushEnabled,
                inAppEnabled: event.inAppEnabled,
                mandatory: event.mandatory,
                updatedAt: now,
              })
              .where(eq(notificationPreferences.id, existing[0].id));
          } else {
            await tx.insert(notificationPreferences).values({
              tenantId: orgId,
              userId: "__org_default__",
              eventType: event.eventType,
              emailEnabled: event.emailEnabled,
              pushEnabled: event.pushEnabled,
              inAppEnabled: event.inAppEnabled,
              mandatory: event.mandatory,
              createdAt: now,
              updatedAt: now,
            });
          }
        }

        // Upsert personal preference
        const personal = await tx
          .select()
          .from(notificationPreferences)
          .where(
            and(
              eq(notificationPreferences.tenantId, orgId),
              eq(notificationPreferences.userId, userId),
              eq(notificationPreferences.eventType, event.eventType),
            ),
          )
          .limit(1);

        if (personal.length > 0) {
          await tx
            .update(notificationPreferences)
            .set({
              emailEnabled: event.emailEnabled,
              pushEnabled: event.pushEnabled,
              inAppEnabled: event.inAppEnabled,
              updatedAt: now,
            })
            .where(eq(notificationPreferences.id, personal[0].id));
        } else {
          await tx.insert(notificationPreferences).values({
            tenantId: orgId,
            userId,
            eventType: event.eventType,
            emailEnabled: event.emailEnabled,
            pushEnabled: event.pushEnabled,
            inAppEnabled: event.inAppEnabled,
            mandatory: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return apiError("admin/notification-preferences/PUT", error);
  }
}
