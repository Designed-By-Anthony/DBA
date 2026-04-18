import { NextResponse } from "next/server";
import { getDb, leads, activities } from "@dba/database";
import { eq } from "drizzle-orm";
import { evaluateProspectHealth, recalculateLeadScore } from "@/lib/intelligence";
import { getSecret, verifySharedSecret } from "@/lib/webhook-auth";

/**
 * Next-Gen Agentic AI Ingestion Hook (Mock LLM Evaluator)
 *
 * Mutates prospects (dealValue, status, healthStatus) on behalf of an upstream
 * agent. Requires AGENTIC_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const secret = getSecret("AGENTIC_WEBHOOK_SECRET");
  if (!secret) {
    console.error("[agentic] webhook rejected: AGENTIC_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  if (!verifySharedSecret(req.headers, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { agencyId, prospectId, rawMessage } = body;

    if (
      typeof agencyId !== "string" ||
      typeof prospectId !== "string" ||
      typeof rawMessage !== "string" ||
      !agencyId.trim() ||
      !prospectId.trim() ||
      !rawMessage.trim()
    ) {
      return NextResponse.json({ error: "Missing required Agentic context parameters" }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    // --- simulated LLM EVALUATION ---
    let inferredStatusUpdate = null;
    let inferredDealValue = null;
    let intentFlag = "neutral";
    const extractedTags: string[] = [];

    const msg = rawMessage.toLowerCase();

    if (msg.includes("budget") && msg.includes("$")) {
      const match = rawMessage.match(/\$([0-9,]+(k|m)?)/i);
      if (match) {
        const rawNum = match[1].replace(/,/g, '').replace(/k/i, '000').replace(/m/i, '000000');
        inferredDealValue = parseInt(rawNum, 10);
      }
    }

    if (msg.includes("cancel") || msg.includes("slash") || msg.includes("too expensive")) {
      intentFlag = "churn_risk";
      extractedTags.push("AI_Churn_Flag");
    }

    if (msg.includes("ready to start") || msg.includes("send the contract") || msg.includes("let's do it")) {
      intentFlag = "buying_signal";
      inferredStatusUpdate = "proposal";
    }

    // --- AUTONOMOUS DATABASE UPDATES ---
    const updatePayload: Record<string, string | number> = {};
    if (inferredDealValue) updatePayload.dealValue = inferredDealValue;
    if (inferredStatusUpdate) updatePayload.status = inferredStatusUpdate;
    if (intentFlag === "churn_risk") updatePayload.healthStatus = "churn_risk";

    if (Object.keys(updatePayload).length > 0) {
      await db
        .update(leads)
        .set({ ...updatePayload, updatedAt: new Date().toISOString() })
        .where(eq(leads.prospectId, prospectId));
    }

    // Log agent action
    await db.insert(activities).values({
      tenantId: agencyId,
      leadId: prospectId,
      type: "note_added",
      title: `🤖 AI Extracted Insights`,
      description: `Autonomously parsed incoming context: Intent detected as '${intentFlag}'. ${inferredDealValue ? `Updated Deal Value: $${inferredDealValue}.` : ''}`,
      metadata: { isAgentic: true, raw: rawMessage },
      createdAt: new Date().toISOString(),
    });

    // Fire generic lifecycle hooks
    await recalculateLeadScore(agencyId, prospectId);
    await evaluateProspectHealth(agencyId, prospectId);

    return NextResponse.json({
      success: true,
      appliedActions: {
        fieldsUpdated: Object.keys(updatePayload),
        intent: intentFlag
      }
    });

  } catch (error) {
    console.error("[Agentic Webhook] Error processing ingest:", error);
    return NextResponse.json({ error: "Failed to process agentic evaluation" }, { status: 500 });
  }
}
