"use server";

import { stripe } from "@/lib/stripe";

export async function createBookingDepositAction(params: {
  agencyId: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  clientEmail: string;
  clientName: string;
  depositCents: number;
}): Promise<{ url: string | null; error?: string }> {
  try {
    const bookingId = `booking_${Date.now()}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      payment_intent_data: { capture_method: 'manual' },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Reservation Hold: ${params.serviceName}`,
              description: `Appointment on ${params.date} at ${params.time}`,
            },
            unit_amount: params.depositCents,
          },
          quantity: 1,
        }
      ],
      customer_email: params.clientEmail,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/booking-success?booking=${bookingId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/booking-cancelled`,
      metadata: {
        bookingId,
        agencyId: params.agencyId,
        type: 'revenue_protection_hold'
      }
    });

    if (!session.url) throw new Error("Failed to generate stripe vault link");

    return { url: session.url };

  } catch (err: unknown) {
    console.error("Booking auth error:", err);
    return { url: null, error: err instanceof Error ? err.message : "Internal error" };
  }
}
