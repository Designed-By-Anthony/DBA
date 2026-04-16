"use server";

import { db } from "@/lib/firebase";
import type { QuotePackage } from "@/lib/types";
import { verifyAuth } from "./auth";
import { ensureOwnership } from "../action-helpers";
import { addActivity } from "./timeline";

export async function saveQuoteAction(
  prospectId: string,
  quotePayload: Record<string, unknown>,
): Promise<{ success: boolean; quoteId: string }> {
  const session = await verifyAuth();
  await ensureOwnership("prospects", prospectId, session.user.agencyId);

  const quoteRef = db.collection("prospects").doc(prospectId).collection("quotes").doc();
  const quoteData = {
    ...quotePayload,
    id: quoteRef.id,
    agencyId: session.user.agencyId,
    prospectId,
    status: "draft",
    createdAt: new Date().toISOString(),
  };

  await quoteRef.set(quoteData);

  try {
    const packages = quotePayload["packages"] as QuotePackage[] | undefined;
    const totalCents = packages?.[0]?.totalOneTimeCents ?? 0;
    await addActivity(
      prospectId,
      "note_added",
      "Quote Draft Created",
      `A new quote ($${(totalCents / 100).toFixed(2)}) has been drafted for the portal.`,
      { quoteId: quoteRef.id },
    );
  } catch {
    // best-effort
  }

  return { success: true, quoteId: quoteRef.id };
}

