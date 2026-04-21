import { eventBookings, events, getDb } from "@dba/database";
import { and, eq, gte, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/events?tenant=<clerkOrgId>
 *
 * Public endpoint — returns upcoming public events for the website calendar.
 * Includes remaining seats for urgency display.
 */
export async function GET(req: NextRequest) {
	const tenantId = req.nextUrl.searchParams.get("tenant");
	if (!tenantId) {
		return NextResponse.json(
			{ error: "Missing tenant parameter" },
			{ status: 400 },
		);
	}

	const db = getDb();
	if (!db) {
		return NextResponse.json(
			{ error: "Database unavailable" },
			{ status: 503 },
		);
	}

	const now = new Date().toISOString();

	// Fetch upcoming public events
	const upcomingEvents = await db
		.select()
		.from(events)
		.where(
			and(
				eq(events.tenantId, tenantId),
				eq(events.isPublic, true),
				gte(events.startTime, now),
			),
		)
		.orderBy(events.startTime);

	// Enrich with booking counts
	const enriched = await Promise.all(
		upcomingEvents.map(async (event) => {
			const [{ count }] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(eventBookings)
				.where(
					and(
						eq(eventBookings.eventId, event.id),
						eq(eventBookings.tenantId, tenantId),
						eq(eventBookings.status, "confirmed"),
					),
				);

			const bookedCount = count ?? 0;
			const remainingSeats = event.maxCapacity
				? Math.max(0, event.maxCapacity - bookedCount)
				: null;

			return {
				id: event.id,
				name: event.name,
				description: event.description,
				location: event.location,
				imageUrl: event.imageUrl,
				startTime: event.startTime,
				endTime: event.endTime,
				priceCents: event.priceCents,
				maxCapacity: event.maxCapacity,
				remainingSeats,
				isAlmostFull:
					remainingSeats !== null && remainingSeats <= 5 && remainingSeats > 0,
				isFull: remainingSeats !== null && remainingSeats <= 0,
				waitlistEnabled: event.waitlistEnabled,
			};
		}),
	);

	return NextResponse.json({ events: enriched });
}
