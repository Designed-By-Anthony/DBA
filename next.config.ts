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
		return [
			{
				source: "/(.*)",
				headers: [
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
