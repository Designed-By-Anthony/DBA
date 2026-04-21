// The "Zod" environment guard — fails the build if web-viewer / Stripe
// secrets accidentally bleed onto the Lighthouse Vercel project.
import { validateLighthouseEnv } from "@dba/env/lighthouse";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

validateLighthouseEnv();

const nextConfig: NextConfig = {
	async headers() {
		const isProd =
			process.env.VERCEL_ENV === "production" ||
			(process.env.NODE_ENV === "production" && process.env.VERCEL === "1");
		const frameAncestors = [
			"'self'",
			"https://designedbyanthony.com",
			"https://*.designedbyanthony.com",
			// Dev-only: Astro marketing preview on localhost embeds the audit app.
			// Stripped from prod responses so an attacker can't load us in a frame via
			// a DNS-collision or http proxy.
			...(isProd ? [] : ["http://localhost:3000", "http://localhost:4321"]), // pragma: allowlist secret
		].join(" ");
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "Content-Security-Policy",
						value:
							"default-src 'self'; " +
							`frame-ancestors ${frameAncestors}; ` +
							"base-uri 'self'; " +
							"object-src 'none'; " +
							"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://challenges.cloudflare.com https://va.vercel-scripts.com; " +
							"style-src 'self' 'unsafe-inline'; " +
							"img-src 'self' data: blob: https://images.unsplash.com; " +
							"connect-src 'self' https://*.designedbyanthony.com https://vitals.vercel-insights.com https://va.vercel-scripts.com; " +
							"frame-src 'self' https://www.google.com/recaptcha/ https://challenges.cloudflare.com; " +
							"worker-src 'self' blob:;",
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=63072000; includeSubDomains; preload",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "X-Frame-Options",
						value: "SAMEORIGIN",
					},
					{
						key: "Permissions-Policy",
						value:
							"camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=(), usb=()",
					},
					{
						key: "Cross-Origin-Opener-Policy",
						value: "same-origin-allow-popups",
					},
				],
			},
		];
	},
};

export default withSentryConfig(nextConfig, {
	// Wizard defaults — override via SENTRY_ORG / SENTRY_PROJECT in CI or .env
	org: process.env.SENTRY_ORG ?? "designed-by-anthony",
	project: process.env.SENTRY_PROJECT ?? "lighthouse-audit",

	authToken: process.env.SENTRY_AUTH_TOKEN,

	widenClientFileUpload: true,

	tunnelRoute: "/monitoring",

	silent: !process.env.CI,

	/**
	 * Do not fail `next build` when the auth token is missing locally.
	 * Set SENTRY_AUTH_TOKEN in CI / App Hosting for source map uploads.
	 */
	errorHandler: (err) => {
		console.warn("[Sentry build plugin]", err.message);
	},

	webpack: {
		automaticVercelMonitors: true,
		treeshake: {
			removeDebugLogging: true,
		},
	},
});
