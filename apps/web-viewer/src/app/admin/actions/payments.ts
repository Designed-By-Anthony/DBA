"use server";

import { db } from "@/lib/firebase";
import { verifyAuth } from "./auth";
import { ensureOwnership } from "../action-helpers";
import { addActivity } from "./timeline";
import { getProspect } from "./prospects";

export async function createPaymentLinkAction(params: {
  prospectId: string;
  amount: number;
  type: "down_payment" | "completion";
  description: string;
}): Promise<{ url: string | null; error?: string }> {
  try {
    const session = await verifyAuth();
    await ensureOwnership("prospects", params.prospectId, session.user.agencyId);

    const prospect = await getProspect(params.prospectId);
    if (!prospect) return { url: null, error: "Prospect not found" };

    if (process.env.NEXT_PUBLIC_IS_TEST === "true") {
      await addActivity(
        params.prospectId,
        "note_added",
        `Payment link created: $${params.amount.toLocaleString()} (${params.type})`,
        params.description,
        { stripeSessionId: "cs_test_mock_12345" },
      );
      return { url: "https://checkout.stripe.com/c/pay/cs_test_mock_12345" };
    }

    const { createPaymentLink } = await import("@/lib/stripe");
    const result = await createPaymentLink({
      prospectId: params.prospectId,
      prospectEmail: prospect.email,
      prospectName: prospect.name,
      amount: params.amount,
      type: params.type,
      description: params.description,
      organizationId: session.user.agencyId,
    });

    await addActivity(
      params.prospectId,
      "note_added",
      `Payment link created: $${params.amount.toLocaleString()} (${params.type})`,
      params.description,
      { stripeSessionId: result.sessionId },
    );
    return { url: result.url };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create payment link";
    return { url: null, error: msg };
  }
}

export async function createSubscriptionAction(params: {
  prospectId: string;
  stripePriceId: string;
}): Promise<{ url: string | null; error?: string }> {
  const session = await verifyAuth();

  try {
    const prospect = await getProspect(params.prospectId);
    if (!prospect) return { url: null, error: "Prospect not found" };

    const { createSubscription } = await import("@/lib/stripe");
    const result = await createSubscription({
      prospectId: params.prospectId,
      prospectEmail: prospect.email,
      prospectName: prospect.name,
      stripePriceId: params.stripePriceId,
      organizationId: session.user.agencyId,
    });

    if (result.customerId) {
      await db.collection("prospects").doc(params.prospectId).update({
        stripeCustomerId: result.customerId,
      });
    }

    return { url: result.url };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create subscription";
    return { url: null, error: msg };
  }
}

export async function getInvoices(
  prospectId?: string,
): Promise<import("@/lib/types").Invoice[]> {
  const session = await verifyAuth();
  try {
    let query: FirebaseFirestore.Query = db
      .collection("invoices")
      .where("agencyId", "==", session.user.agencyId)
      .orderBy("createdAt", "desc");

    if (prospectId) {
      query = query.where("prospectId", "==", prospectId);
    }
    const snapshot = await query.limit(100).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as import("@/lib/types").Invoice[];
  } catch {
    return [];
  }
}

