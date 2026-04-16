import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";

// Example payload from an IDX provider (e.g. Ylopo, Showcase IDX, Sierra Interactive)
// {
//   "leadId": "prospect_abc",
//   "event": "property_view",
//   "data": {
//     "mlsNumber": "12345678",
//     "price": 450000,
//     "address": "123 Main St",
//     "viewCount": 3
//   }
// }

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const leadIdRaw = payload.leadId;
    const event = String(payload.event || "");
    const data = payload.data || {};

    if (!leadIdRaw || !event) {
      return NextResponse.json({ error: "Missing payload data" }, { status: 400 });
    }

    const leadId = String(leadIdRaw).trim();

    const prospectRef = db.collection("prospects").doc(leadId);
    const prospectDoc = await prospectRef.get();

    if (!prospectDoc.exists) {
       // Auto-create lead or ignore depending on agency rules
       return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    // Append behavioral telemetry to the Prospect's timeline/notes
    let interactionNote = "";
    if (event === "property_view") {
       interactionNote = `[IDX Telemetry] Viewed MLS #${data.mlsNumber} (${data.address}) listed at $${data.price}. Total views: ${data.viewCount}`;
    } else if (event === "saved_search") {
       interactionNote = `[IDX Telemetry] Saved new search filter: ${data.searchCriteria}`;
    } else {
       interactionNote = `[IDX Telemetry] Unknown event: ${event}`;
    }

    // In a real app we'd push to a subcollection like `prospects/{id}/timeline`
    // For this boilerplate we prepend to notes and update lastContacted.
    const currentNotes = prospectDoc.data()?.notes || "";
    const updatedNotes = `${new Date().toISOString()} - ${interactionNote}\n\n${currentNotes}`;

    await prospectRef.update({
      notes: updatedNotes,
      lastContactedAt: new Date().toISOString(),
      // AI could trigger here to bump pipeline priority based on intent.
    });

    return NextResponse.json({ success: true, recorded: true });

  } catch (error) {
    console.error("[IDX Webhook Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
