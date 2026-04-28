import * as Sentry from "@sentry/nextjs";

/**
 * Browser SDK. Kept in this file so Next can load it without passing extra keys through the bundler plugin.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
	Sentry.init({
		dsn,
		environment: process.env.NODE_ENV,
		enabled: process.env.NODE_ENV === "production",
		sendDefaultPii: true,
		enableLogs: true,

		integrations: [Sentry.replayIntegration()],

		tracesSampleRate: 0,

		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,

		ignoreErrors: [
			"ResizeObserver loop limit exceeded",
			"ResizeObserver loop completed with undelivered notifications",
			/challenges\.cloudflare\.com/i,
			/www\.google\.com\/recaptcha/i,
			/^Script error\.?$/,
			/** Turnstile 110200 = hostname not in site key allowlist (common on localhost). */
			/110200/,
			/TurnstileError/,
		],

		beforeSend(event) {
			if (typeof window !== "undefined") {
				const { hostname } = window.location;
				if (hostname === "localhost" || hostname === "127.0.0.1") return null;
			}
			return event;
		},
	});
}
