// This file configures the initialization of Sentry on the client (browser).
// It runs whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

if (dsn) {
	Sentry.init({
		dsn,

		// Performance tracing — capture 100% in dev, 20% in production
		tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

		// Session Replay off by default (HIPAA: DOM may contain PHI). Set
		// NEXT_PUBLIC_SENTRY_REPLAY=1 to enable error-only replay sampling.
		replaysSessionSampleRate: 0,
		replaysOnErrorSampleRate:
			process.env.NEXT_PUBLIC_SENTRY_REPLAY === "1" ? 0.25 : 0,
		integrations: [
			...(process.env.NEXT_PUBLIC_SENTRY_REPLAY === "1"
				? [Sentry.replayIntegration()]
				: []),
			Sentry.browserTracingIntegration(),
			Sentry.feedbackIntegration({
				autoInject: true, // Automatically embeds the floating "Report a Bug" button
				colorScheme: "dark",
				themeDark: {
					background: "#0a0c12", // var(--color-surface-1)
					foreground: "#f7f4ee", // var(--color-text-white)
					submitBackground: "#5b9cf8", // matches var(--color-accent-blue)
					submitForeground: "#ffffff",
				},
			}),
		],

		enableLogs: true,

		// HIPAA / minimum-necessary: do not send names, emails, or request bodies by default.
		sendDefaultPii: false,

		// Don't send errors from local dev unless explicitly enabled
		enabled:
			process.env.NODE_ENV === "production" ||
			process.env.SENTRY_ENABLE_DEV === "true",

		environment: process.env.NODE_ENV,
	});
}
