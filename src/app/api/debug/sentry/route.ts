import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Dev-only: confirms server Sentry init and sends a test message.
 * GET http://localhost:3000/api/debug/sentry
 */
export async function GET() {
	if (process.env.NODE_ENV !== "development") {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	const pub = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
	const srv = process.env.SENTRY_DSN?.trim();

	const hasServerDsn = Boolean(srv ?? pub);
	const hasPublicDsn = Boolean(pub);

	let eventId: string | undefined;
	if (hasServerDsn) {
		eventId = Sentry.captureMessage("Sentry server verification (dev)", "info");
		await Sentry.flush(2000);
	}

	return NextResponse.json({
		ok: true,
		/** Which env keys are non-empty (values are never returned). */
		envPresent: {
			NEXT_PUBLIC_SENTRY_DSN: Boolean(pub),
			SENTRY_DSN: Boolean(srv),
		},
		server: {
			dsnConfigured: hasServerDsn,
			testEventSent: hasServerDsn,
			eventId: eventId ?? null,
		},
		client: {
			needsNextPublic:
				"Browser Sentry only reads NEXT_PUBLIC_SENTRY_DSN (not SENTRY_DSN alone).",
			nextPublicDsnConfigured: hasPublicDsn,
			cookieBanner:
				"Accept all cookies so replay/tracing/PII can load; Essential only keeps minimal client Sentry.",
		},
		nextStep:
			"In Sentry → Issues, search “Sentry server verification” (may take ~30–60s).",
		ifStillEmpty:
			"Restart `next dev` after editing .env.local. No quotes around the DSN unless your host requires them.",
	});
}
