import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { evaluateProspectHealth, recalculateLeadScore } from "@/lib/intelligence";

/**
 * Next-Gen Agentic AI Ingestion Hook (Mock LLM Evaluator)
 * This endpoint simulates an MCP/LLM integration parsing unstructured inbound data
 * and autonomously updating the CRM data structures without human data entry.
 */
export async function POST(req: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Example Payload:
    // { "agencyId": "...", "prospectId": "...", "rawMessage": "..." }
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

    // --- simulated LLM EVALUATION ---
    let inferredStatusUpdate = null;
    let inferredDealValue = null;
    let intentFlag = "neutral";
    const extractedTags: string[] = [];
    
    const msg = rawMessage.toLowerCase();
    
    if (msg.includes("budget") && msg.includes("$")) {
      // Mock regex extraction of budget
      const match = rawMessage.match(/\$([0-9,]+(k|m)?)/i);
      if (match) {
        // Very basic parsing for simulation
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
    const prospectRef = db.collection("prospects").doc(prospectId);
    
    const updatePayload: Record<string, string | number> = {};
    if (inferredDealValue) updatePayload.dealValue = inferredDealValue;
    if (inferredStatusUpdate) updatePayload.status = inferredStatusUpdate;
    if (intentFlag === "churn_risk") updatePayload.healthStatus = "churn_risk";

    if (Object.keys(updatePayload).length > 0) {
      await prospectRef.update(updatePayload);
    }
    
    // Log independent Agent action
    await db.collection("activities").add({
      agencyId,
      prospectId,
      type: "note_added",
      title: `🤖 AI Extracted Insights`,
      description: `Autonomously parsed incoming context: Intent detected as '${intentFlag}'. ${inferredDealValue ? `Updated Deal Value: $${inferredDealValue}.` : ''}`,
      metadata: { isAgentic: true, raw: rawMessage },
      createdAt: new Date().toISOString(),
    });

    // Fire generic lifecycle hooks
    await recalculateLeadScore(prospectId);
    await evaluateProspectHealth(prospectId);

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
