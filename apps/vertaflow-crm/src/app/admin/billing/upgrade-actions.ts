"use server";

import "@dba/env/web-viewer-aliases";
import { auth, currentUser } from "@clerk/nextjs/server";
import { verifyAuth } from "@/app/admin/actions";
import { getStripeClient } from "@/lib/stripe";
import { STRIPE_METADATA_CLERK_ORG } from "@/lib/stripe-tenant-metadata";

/**
 * Agency Pro subscription checkout. Set STRIPE_AGENCY_PRO_PRICE_ID in production;
 * otherwise uses inline $49/mo price_data.
 */
export async function createAgencyUpgradeCheckoutSession(): Promise<{
	url: string | null;
	error?: string;
}> {
	await verifyAuth();
	const { orgId } = await auth();
	const user = await currentUser();
	const email = user?.emailAddresses?.[0]?.emailAddress;
	if (!email) {
		return {
			url: null,
			error: "Add an email address to your account (Clerk).",
		};
	}

	const stripe = getStripeClient();
	const upgradeMeta: Record<string, string> = {
		type: "agency_os_upgrade",
		...(orgId ? { [STRIPE_METADATA_CLERK_ORG]: orgId } : {}),
	};
	const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
	const priceId = process.env.STRIPE_AGENCY_PRO_PRICE_ID;

	try {
		if (priceId) {
			const session = await stripe.checkout.sessions.create({
				mode: "subscription",
				customer_email: email,
				line_items: [{ price: priceId, quantity: 1 }],
				success_url: `${base}/admin/billing?upgraded=1`,
				cancel_url: `${base}/admin/billing/upgrade?cancelled=1`,
				metadata: upgradeMeta,
			});
			return { url: session.url };
		}

		const session = await stripe.checkout.sessions.create({
			mode: "subscription",
			customer_email: email,
			line_items: [
				{
					price_data: {
						currency: "usd",
						recurring: { interval: "month" },
						product_data: { name: "Agency Pro" },
						unit_amount: 4900,
					},
					quantity: 1,
				},
			],
			success_url: `${base}/admin/billing?upgraded=1`,
			cancel_url: `${base}/admin/billing/upgrade?cancelled=1`,
			metadata: upgradeMeta,
		});
		return { url: session.url };
	} catch (e: unknown) {
		return {
			url: null,
			error: e instanceof Error ? e.message : String(e),
		};
	}
}
