import {
	activities,
	type Database,
	getDb,
	invoices,
	leads,
	reviewRequests,
	withBypassRls,
} from "@dba/database";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { apiError } from "@/lib/api-error";
import { escapeHtml } from "@/lib/email-utils";
import { sendMail } from "@/lib/mailer";
import { sendPushToTenantAdmins } from "@/lib/push-notify";
import { stripe } from "@/lib/stripe";
import { syncConnectAccountStatus } from "@/lib/stripe-connect";
import {
	readClerkOrgIdFromMetadata,
	readProspectIdFromMetadata,
} from "@/lib/stripe-webhook-tenant";
import { isTestMode } from "@/lib/test-mode";
import { complianceConfig } from "@/lib/theme.config";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

type TenantTx = Parameters<Parameters<Database["transaction"]>[0]>[0];

async function findLeadRowsForStripeCustomer(
	tx: TenantTx,
	stripeCustomerId: string,
): Promise<(typeof leads.$inferSelect)[]> {
	return tx
		.select()
		.from(leads)
		.where(eq(leads.stripeCustomerId, stripeCustomerId));
}

function pickLeadForStripeCustomer(
	rows: (typeof leads.$inferSelect)[],
	tenantIdHint: string | undefined,
	prospectIdHint: string | undefined,
): typeof leads.$inferSelect | undefined {
	if (rows.length === 0) return undefined;
	if (prospectIdHint && tenantIdHint) {
		const m = rows.find(
			(r) => r.prospectId === prospectIdHint && r.tenantId === tenantIdHint,
		);
		if (m) return m;
	}
	if (prospectIdHint) {
		const m = rows.find((r) => r.prospectId === prospectIdHint);
		if (m) return m;
	}
	if (tenantIdHint) {
		const m = rows.find((r) => r.tenantId === tenantIdHint);
		if (m) return m;
	}
	if (rows.length === 1) return rows[0];
	return undefined;
}

/**
 * Stripe Webhook Handler
 *
 * Handles:
 * - checkout.session.completed → payment received
 * - invoice.paid → recurring retainer paid
 * - customer.subscription.deleted → retainer cancelled
 *
 * Catalog: products/prices are scoped with metadata `clerk_org_id`; Price Book uses
 * Stripe Search. Optional webhook events: `product.*`, `price.*`,
 * `customer.subscription.created`, `entitlements.active_entitlement_summary.updated`.
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.text();
		const signature = request.headers.get("stripe-signature") || "";

		let event: Stripe.Event;

		if (isTestMode()) {
			event = JSON.parse(body) as Stripe.Event;
		} else {
			if (!webhookSecret) {
				console.error(
					"Stripe webhook rejected: STRIPE_WEBHOOK_SECRET not configured",
				);
				return NextResponse.json(
					{ error: "Webhook not configured" },
					{ status: 503 },
				);
			}
			try {
				event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
			} catch (err) {
				console.error("Stripe signature verification failed:", err);
				return NextResponse.json(
					{ error: "Invalid signature" },
					{ status: 400 },
				);
			}
		}

		const db = getDb();
		if (!db) return NextResponse.json({ received: true });

		await withBypassRls(db, async (tx) => {
			switch (event.type) {
				case "checkout.session.completed": {
					const session = event.data.object as Stripe.Checkout.Session;
					const prospectId =
						readProspectIdFromMetadata(session.metadata ?? undefined) ??
						session.metadata?.prospectId;
					const orgFromStripe = readClerkOrgIdFromMetadata(
						session.metadata ?? undefined,
					);
					const paymentType = session.metadata?.type as
						| "down_payment"
						| "completion"
						| "retainer";

					if (!prospectId) break;

					const amount =
						session.mode === "payment" ? (session.amount_total || 0) / 100 : 0;

					// Find prospect to get tenant_id (RLS bypass — enforce tenant via metadata + DB row)
					const prospectRows = await tx
						.select()
						.from(leads)
						.where(eq(leads.prospectId, prospectId))
						.limit(1);

					if (prospectRows.length === 0) break;
					const prospect = prospectRows[0];
					if (orgFromStripe && orgFromStripe !== prospect.tenantId) break;
					const tenantId = prospect.tenantId;

					// Log activity
					await tx.insert(activities).values({
						tenantId,
						leadId: prospectId,
						type: "payment_received",
						title: `Payment received: $${amount.toLocaleString()}`,
						description: `${paymentType?.replace("_", " ")} via Stripe`,
						metadata: {
							amount,
							paymentType,
							stripeSessionId: session.id,
							customerEmail: session.customer_details?.email,
						},
						createdAt: new Date().toISOString(),
					});

					// Update prospect
					const updates: Record<string, unknown> = {};
					if (session.customer) {
						updates.stripeCustomerId = String(session.customer);
					}

					// Auto-advance pipeline: down payment → move to dev
					if (
						paymentType === "down_payment" &&
						prospect.status === "proposal"
					) {
						updates.status = "active";
					}

					if (Object.keys(updates).length > 0) {
						updates.updatedAt = new Date().toISOString();
						await tx
							.update(leads)
							.set(updates)
							.where(
								and(
									eq(leads.tenantId, tenantId),
									eq(leads.prospectId, prospectId),
								),
							);
					}

					// Notify admin
					try {
						const customerName = session.customer_details?.name || "Unknown";
						const safeCustomerName = escapeHtml(customerName);
						const safePaymentType = escapeHtml(
							paymentType?.replace("_", " ") || "Payment",
						);
						await sendMail({
							from: `Agency OS <${complianceConfig.fromEmail}>`,
							to: [complianceConfig.adminNotificationEmail],
							subject:
								`💰 Payment Received: $${amount.toLocaleString()} — ` +
								customerName.replace(/[\r\n]+/g, " "),
							html: `
                  <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; padding: 32px; background: #0a0a0f; color: #e0e0e0; border-radius: 12px;">
                    <h2 style="color: #10b981; margin: 0 0 16px;">💰 Payment Received</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr><td style="padding: 8px 0; color: #888;">Client</td><td style="color: #fff;">${safeCustomerName}</td></tr>
                      <tr><td style="padding: 8px 0; color: #888;">Amount</td><td style="color: #10b981; font-size: 1.25em; font-weight: bold;">$${amount.toLocaleString()}</td></tr>
                      <tr><td style="padding: 8px 0; color: #888;">Type</td><td style="color: #fff;">${safePaymentType}</td></tr>
                    </table>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/prospects/${prospectId}"
                      style="display: inline-block; margin-top: 20px; background: #2563eb; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none;">
                      View in Agency OS →
                    </a>
                  </div>
                `,
						});
					} catch (e) {
						console.error("Payment notification email failed:", e);
					}

					// Push notification to admin bell
					try {
						await sendPushToTenantAdmins(tenantId, {
							title: `💰 Payment: $${amount.toLocaleString()}`,
							body: `${session.customer_details?.name || "Client"} — ${paymentType?.replace("_", " ") || "payment"}`,
							type: "payment_received",
							actionUrl: `/admin/prospects/${prospectId}`,
							referenceId: prospectId,
							referenceType: "lead",
						});
					} catch {
						// non-critical
					}

					// ── Invoice reconciliation (Revenue Pipeline) ────────────────
					const invoiceId = session.metadata?.invoiceId;
					if (invoiceId) {
						try {
							const now = new Date().toISOString();
							await tx
								.update(invoices)
								.set({
									status: "paid",
									paidAt: now,
									stripeSessionId: session.id,
									stripePaymentIntentId:
										typeof session.payment_intent === "string"
											? session.payment_intent
											: null,
									updatedAt: now,
								})
								.where(eq(invoices.id, invoiceId));

							// Auto-create review request
							const defaultReviewUrl = `https://search.google.com/local/writereview?placeid=PLACEHOLDER`;
							await tx.insert(reviewRequests).values({
								tenantId,
								invoiceId,
								prospectId,
								platform: "google",
								reviewUrl: defaultReviewUrl,
								createdAt: now,
								updatedAt: now,
							});
						} catch {
							// non-critical — invoice may not exist
						}
					}

					break;
				}

				case "invoice.paid": {
					const invoice = event.data.object as Stripe.Invoice;
					const invoiceSubscription = (
						invoice as unknown as Record<string, unknown>
					).subscription as string;

					if (
						invoiceSubscription &&
						invoice.billing_reason === "subscription_cycle"
					) {
						const custId = String(invoice.customer);
						let tenantHint = readClerkOrgIdFromMetadata(
							invoice.metadata ?? undefined,
						);
						let prospectIdHint: string | undefined;

						try {
							const sub = await stripe.subscriptions.retrieve(
								typeof invoiceSubscription === "string"
									? invoiceSubscription
									: String(invoiceSubscription),
							);
							prospectIdHint =
								prospectIdHint ??
								readProspectIdFromMetadata(sub.metadata ?? undefined);
							tenantHint =
								tenantHint ??
								readClerkOrgIdFromMetadata(sub.metadata ?? undefined);
						} catch {
							// ignore — fall back to customer-only resolution
						}

						if (!tenantHint) {
							try {
								const customer = await stripe.customers.retrieve(custId);
								if (!("deleted" in customer && customer.deleted)) {
									tenantHint =
										tenantHint ??
										readClerkOrgIdFromMetadata(customer.metadata ?? undefined);
								}
							} catch {
								// ignore
							}
						}

						const customerRows = await findLeadRowsForStripeCustomer(
							tx,
							custId,
						);
						const prospect = pickLeadForStripeCustomer(
							customerRows,
							tenantHint,
							prospectIdHint,
						);

						if (prospect) {
							const amount = (invoice.amount_paid || 0) / 100;

							await tx.insert(activities).values({
								tenantId: prospect.tenantId,
								leadId: prospect.prospectId,
								type: "payment_received",
								title: `Retainer payment: $${amount.toLocaleString()}/mo`,
								description: "Recurring subscription payment",
								createdAt: new Date().toISOString(),
							});
						}
					}
					break;
				}

				case "customer.subscription.created": {
					const subscription = event.data.object as Stripe.Subscription;
					const prospectId = readProspectIdFromMetadata(
						subscription.metadata ?? undefined,
					);
					const orgFromStripe = readClerkOrgIdFromMetadata(
						subscription.metadata ?? undefined,
					);
					if (!prospectId) break;

					const prospectRows = await tx
						.select()
						.from(leads)
						.where(eq(leads.prospectId, prospectId))
						.limit(1);

					if (prospectRows.length === 0) break;
					const prospect = prospectRows[0];
					if (orgFromStripe && orgFromStripe !== prospect.tenantId) break;

					await tx
						.update(leads)
						.set({
							stripeSubscriptionId: subscription.id,
							updatedAt: new Date().toISOString(),
						})
						.where(
							and(
								eq(leads.tenantId, prospect.tenantId),
								eq(leads.prospectId, prospectId),
							),
						);
					break;
				}

				case "customer.subscription.deleted": {
					const subscription = event.data.object as Stripe.Subscription;
					const prospectId = readProspectIdFromMetadata(
						subscription.metadata ?? undefined,
					);
					const orgFromStripe = readClerkOrgIdFromMetadata(
						subscription.metadata ?? undefined,
					);

					let prospect: typeof leads.$inferSelect | undefined;

					if (prospectId) {
						const prospectRows = await tx
							.select()
							.from(leads)
							.where(eq(leads.prospectId, prospectId))
							.limit(1);
						if (
							prospectRows.length > 0 &&
							(!orgFromStripe || prospectRows[0].tenantId === orgFromStripe)
						) {
							prospect = prospectRows[0];
						}
					} else {
						const customerRows = await findLeadRowsForStripeCustomer(
							tx,
							String(subscription.customer),
						);
						prospect = pickLeadForStripeCustomer(
							customerRows,
							orgFromStripe,
							undefined,
						);
					}

					if (prospect) {
						await tx.insert(activities).values({
							tenantId: prospect.tenantId,
							leadId: prospect.prospectId,
							type: "note_added",
							title: "Retainer subscription cancelled",
							description:
								"Client's recurring subscription has been cancelled in Stripe",
							createdAt: new Date().toISOString(),
						});

						await tx
							.update(leads)
							.set({
								stripeSubscriptionId: null,
								updatedAt: new Date().toISOString(),
							})
							.where(
								and(
									eq(leads.tenantId, prospect.tenantId),
									eq(leads.prospectId, prospect.prospectId),
								),
							);
					}
					break;
				}

				// Price Book uses Stripe Search + metadata; acknowledge catalog events.
				case "product.updated":
				case "product.deleted":
				case "price.updated":
					break;

				case "entitlements.active_entitlement_summary.updated":
					break;

				// Stripe Connect — sync account status on onboarding completion
				case "account.updated": {
					const account = event.data.object as Stripe.Account;
					if (account.id) {
						try {
							await syncConnectAccountStatus(account.id);
						} catch (e) {
							console.error("Connect account sync failed:", e);
						}
					}
					break;
				}
			}
		});

		return NextResponse.json({ received: true });
	} catch (error: unknown) {
		return apiError("webhooks/stripe", error);
	}
}
