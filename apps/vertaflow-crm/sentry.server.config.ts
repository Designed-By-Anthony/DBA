// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = (
	process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
)?.trim();

if (dsn) {
	Sentry.init({
		dsn,

		tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

		enableLogs: true,

		// HIPAA / minimum-necessary: keep off unless you have a BAA and scrubbing rules.
		sendDefaultPii: false,

		environment:
			process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
	});
}
