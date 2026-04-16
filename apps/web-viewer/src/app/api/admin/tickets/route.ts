import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { getDb, tickets } from "@dba/database";

/**
 * GET /api/admin/tickets
 * Returns all tickets across all clients (admin only, dev bypass active)
 */
export async function GET() {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const database = getDb();
    if (!database) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const rows = await database
      .select()
      .from(tickets)
      .where(eq(tickets.tenantId, orgId))
      .orderBy(desc(tickets.createdAt));

    return NextResponse.json(
      rows.map((row) => ({
        id: row.id,
        prospectId: row.prospectId,
        prospectName: row.prospectName,
        subject: row.subject,
        description: row.description,
        status: row.status,
        priority: row.priority,
        adminReply: row.adminReply,
        messages: row.messages,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        resolvedAt: row.resolvedAt,
        firstResponseAt: row.firstResponseAt,
      })),
    );
  } catch (err) {
    console.error("Admin ticket list error:", err);
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}
