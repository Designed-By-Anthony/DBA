import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb, tickets } from "@dba/database";
import { getPortalSessionFromRequest } from "@/lib/portal-auth";
import { apiError } from "@/lib/api-error";

/**
 * Portal Data API.
 * Reads authenticated portal session and returns scoped ticket + milestone data.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getPortalSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const database = getDb();
    if (!database) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const ticketRows = await database
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.tenantId, session.tenantId),
          eq(tickets.prospectId, session.prospectId),
        ),
      )
      .orderBy(desc(tickets.createdAt))
      .limit(10);

    const latestStatus = ticketRows[0]?.status || "lead";
    const stages = ["lead", "contacted", "proposal", "dev", "launched"];
    const stageLabels: Record<string, string> = {
      lead: "Initial Inquiry",
      contacted: "Discovery Call",
      proposal: "Proposal & Contract",
      dev: "Building Your Website",
      launched: "Website Live!",
    };
    const currentIdx = stages.indexOf(latestStatus);
    const milestones = stages.map((stage, i) => ({
      label: stageLabels[stage] || stage,
      completed: i < currentIdx,
      current: i === currentIdx,
    }));

    return NextResponse.json({
      prospect: {
        name: session.prospectName,
        company: "",
        status: latestStatus,
        onboarding: null,
        driveFolderUrl: null,
        contractDocUrl: null,
        pricingTier: null,
        projectNotes: null,
        contractSigned: false,
        contractStatus: "draft",
        stagingUrl: null,
      },
      milestones,
      tickets: ticketRows.map((row) => ({
        id: row.id,
        subject: row.subject,
        status: row.status,
        createdAt: row.createdAt,
      })),
    });
  } catch (error: unknown) {
    return apiError("portal/data", error);
  }
}
