"use server";

import { db } from "@/lib/firebase";
import { stripe } from "@/lib/stripe";
import {
  resolveVerticalTypeForStripe,
  STRIPE_META_CLIENT_ID,
  STRIPE_META_VERTICAL_TYPE,
} from "@/lib/stripe-metadata";

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
    // 1. Create pending BookingEvent in database to hold the slot
    const bookingRef = db.collection("agencies").doc(params.agencyId).collection("bookings").doc();
    
    await bookingRef.set({
      id: bookingRef.id,
      agencyId: params.agencyId,
      prospectId: "guest", // Could look up email to match Prospect
      clientEmail: params.clientEmail,
      clientName: params.clientName,
      serviceId: params.serviceId,
      serviceName: params.serviceName,
      startTime: `${params.date}T${params.time}`, 
      endTime: `${params.date}T${params.time}`, // Simplified
      status: 'pending',
      depositAmountCents: params.depositCents,
      createdAt: new Date().toISOString(),
    });

    const vertical_type = await resolveVerticalTypeForStripe(params.agencyId);

    // 2. Auth & Hold via Stripe Checkout (Revenue Protection)
    // Using manual capture means we authorize the card but don't pull funds until the service is complete,
    // OR we capture a flat deposit immediately if we want cash flow.
    // For this demonstration, we'll process a standard setup or manual capture payment for the deposit.
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      // Manual capture holds the vault without finalizing the charge immediately
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/booking-success?booking=${bookingRef.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/booking-cancelled`,
      metadata: {
        bookingId: bookingRef.id,
        agencyId: params.agencyId,
        [STRIPE_META_CLIENT_ID]: params.agencyId,
        type: 'revenue_protection_hold',
        [STRIPE_META_VERTICAL_TYPE]: vertical_type,
      }
    });

    if (!session.url) throw new Error("Failed to generate stripe vault link");

    return { url: session.url };

  } catch (err: unknown) {
    console.error("Booking auth error:", err);
    return { url: null, error: err instanceof Error ? err.message : "Internal error" };
  }
}
