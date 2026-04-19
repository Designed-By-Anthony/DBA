"use server";

/**
 * Stripe Connect — Standard Connect for multi-tenant marketplace.
 *
 * Each tenant onboards as a Standard Connected Account. The platform earns
 * a configurable fee (default 2.5% / 250 bps) on every transaction processed
 * through the tenant's account.
 *
 * Docs: https://docs.stripe.com/connect/standard-accounts
 */

import { getStripeClient } from "@/lib/stripe";
import { getDb, tenants, withBypassRls } from "@dba/database";
import { eq } from "drizzle-orm";

// ─── Account Creation ──────────────────────────────────────────────────

export async function createConnectedAccount(params: {
  tenantId: string;
  email: string;
  businessName: string;
}): Promise<{ accountId: string } | { error: string }> {
  try {
    const stripe = getStripeClient();
    const account = await stripe.accounts.create({
      type: "standard",
      email: params.email,
      business_profile: {
        name: params.businessName,
      },
      metadata: {
        tenant_id: params.tenantId,
        created_via: "agency_os",
      },
    });

    const db = getDb();
    if (db) {
      await withBypassRls(db, async (tx) => {
        await tx
          .update(tenants)
          .set({
            stripeConnectAccountId: account.id,
            stripeConnectStatus: "onboarding",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(tenants.clerkOrgId, params.tenantId));
      });
    }

    return { accountId: account.id };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Onboarding Link ───────────────────────────────────────────────────

export async function createAccountLink(params: {
  accountId: string;
  returnUrl: string;
  refreshUrl: string;
}): Promise<{ url: string } | { error: string }> {
  try {
    const stripe = getStripeClient();
    const link = await stripe.accountLinks.create({
      account: params.accountId,
      type: "account_onboarding",
      return_url: params.returnUrl,
      refresh_url: params.refreshUrl,
    });

    return { url: link.url };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Account Status ────────────────────────────────────────────────────

export type ConnectAccountStatus = {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: string[];
};

export async function getAccountStatus(
  accountId: string,
): Promise<ConnectAccountStatus | { error: string }> {
  try {
    const stripe = getStripeClient();
    const account = await stripe.accounts.retrieve(accountId);

    return {
      accountId: account.id,
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      detailsSubmitted: account.details_submitted ?? false,
      currentlyDue: account.requirements?.currently_due ?? [],
    };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Sync account status from Stripe webhook ──────────────────────────

export async function syncConnectAccountStatus(
  accountId: string,
): Promise<void> {
  const stripe = getStripeClient();
  const account = await stripe.accounts.retrieve(accountId);

  const status = account.charges_enabled
    ? "active"
    : account.details_submitted
      ? "restricted"
      : "onboarding";

  const db = getDb();
  if (!db) return;

  await withBypassRls(db, async (tx) => {
    await tx
      .update(tenants)
      .set({
        stripeConnectStatus: status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tenants.stripeConnectAccountId, accountId));
  });
}

// ─── Connected Checkout ────────────────────────────────────────────────

/**
 * Create a Checkout session on a tenant's Connected Account with a platform fee.
 * The fee is calculated from `platformFeeBps` (basis points, e.g. 250 = 2.50%).
 */
export async function createConnectCheckoutSession(params: {
  connectedAccountId: string;
  platformFeeBps: number;
  lineItems: Array<{
    priceId?: string;
    priceData?: {
      currency: string;
      unitAmount: number;
      productData: { name: string; description?: string };
    };
    quantity: number;
  }>;
  mode: "payment" | "subscription";
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<{ url: string | null; sessionId: string } | { error: string }> {
  try {
    const stripe = getStripeClient();

    const lineItems = params.lineItems.map((item) => {
      if (item.priceId) {
        return { price: item.priceId, quantity: item.quantity };
      }
      if (item.priceData) {
        return {
          price_data: {
            currency: item.priceData.currency,
            unit_amount: item.priceData.unitAmount,
            product_data: {
              name: item.priceData.productData.name,
              description: item.priceData.productData.description,
            },
            ...(params.mode === "subscription"
              ? { recurring: { interval: "month" as const } }
              : {}),
          },
          quantity: item.quantity,
        };
      }
      throw new Error("Each line item must have either priceId or priceData");
    });

    // Calculate total for application fee
    const totalCents = params.lineItems.reduce((sum, item) => {
      const amount = item.priceData?.unitAmount ?? 0;
      return sum + amount * item.quantity;
    }, 0);

    const applicationFeeAmount = Math.round(
      (totalCents * params.platformFeeBps) / 10000,
    );

    const session = await stripe.checkout.sessions.create(
      {
        mode: params.mode,
        line_items: lineItems,
        ...(params.mode === "payment" && applicationFeeAmount > 0
          ? { payment_intent_data: { application_fee_amount: applicationFeeAmount } }
          : {}),
        ...(params.mode === "subscription" && applicationFeeAmount > 0
          ? {
              subscription_data: {
                application_fee_percent: params.platformFeeBps / 100,
              },
            }
          : {}),
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata ?? {},
      },
      { stripeAccount: params.connectedAccountId },
    );

    return { url: session.url, sessionId: session.id };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
