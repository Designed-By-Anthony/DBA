import { validateLighthouseEnv } from "@/lib/env/lighthouse";
import { validateMarketingEnv } from "@/lib/env/marketing";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

validateMarketingEnv();
validateLighthouseEnv();

const nextConfig: NextConfig = {
	trailingSlash: false,
	reactStrictMode: true,
	async headers() {
		const isProd =
			process.env.VERCEL_ENV === "production" ||
			(process.env.NODE_ENV === "production" && process.env.VERCEL === "1");
		const frameAncestors = [
			"'self'",
			"https://designedbyanthony.com",
			"https://*.designedbyanthony.com",
			...(isProd ? [] : ["http://localhost:3000", "http://localhost:4321"]),
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
							"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://challenges.cloudflare.com https://www.googletagmanager.com https://vercel.live https://va.vercel-scripts.com; " +
							"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
							"img-src 'self' data: blob: https://images.unsplash.com https://american-operator-assets-public.s3.us-east-1.amazonaws.com; " +
							"connect-src 'self' https://*.designedbyanthony.com https://admin.vertaflow.io https://accounts.vertaflow.io https://*.vertaflow.io https://vitals.vercel-insights.com https://va.vercel-scripts.com https://www.google-analytics.com https://*.google-analytics.com wss://ws-mt1.pusher.com https://chat.stream-io-api.com https://*.stream-io-api.com wss://chat.stream-io-api.com wss://*.stream-io-api.com; " +
							"frame-src 'self' https://js.stripe.com https://www.google.com/recaptcha/ https://challenges.cloudflare.com; " +
							"worker-src 'self' blob:; " +
							"require-trusted-types-for 'script';",
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
	org: process.env.SENTRY_ORG ?? "designed-by-anthony",
	project: process.env.SENTRY_PROJECT ?? "marketing",
	authToken: process.env.SENTRY_AUTH_TOKEN,
	widenClientFileUpload: true,
	tunnelRoute: "/monitoring",
	silent: !process.env.CI,
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
