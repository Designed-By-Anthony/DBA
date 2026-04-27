import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import { validateLighthouseEnv } from "@/lib/env/lighthouse";
import { validateMarketingEnv } from "@/lib/env/marketing";

validateMarketingEnv();
validateLighthouseEnv();

/**
 * `@sentry/nextjs` merges `experimental.clientTraceMetadata` for tracing; Next 16
 * then prints it under "Experiments (use with caution)". We keep Sentry but drop
 * that flag so production builds stay quiet (pageload trace headers are optional here).
 */
function withoutExperimentalClientTraceMetadata(
	config: NextConfig,
): NextConfig {
	const experimental = config.experimental;
	if (
		!experimental ||
		experimental.clientTraceMetadata === undefined ||
		experimental.clientTraceMetadata.length === 0
	) {
		return config;
	}
	const { clientTraceMetadata: _trace, ...restExperimental } = experimental;
	const keys = Object.keys(restExperimental);
	return {
		...config,
		...(keys.length > 0
			? { experimental: restExperimental }
			: { experimental: undefined }),
	};
}

const nextConfig: NextConfig = {
	trailingSlash: false,
	reactStrictMode: true,
	experimental: {
		/** Tree-shake `framer-motion` re-exports so only used motion primitives ship. */
		optimizePackageImports: ["framer-motion"],
	},
	compiler: {
		/** Drop stray `console.log` / `console.info` / `console.debug` in production client+server bundles. */
		removeConsole:
			process.env.NODE_ENV === "production"
				? { exclude: ["error", "warn"] }
				: false,
	},
	async redirects() {
		return [
			{
				source: "/free-seo-audit",
				destination: "/contact",
				permanent: true,
			},
		];
	},
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
							"camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=(), usb=(), xr-spatial-tracking=*",
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

export default withoutExperimentalClientTraceMetadata(
	withSentryConfig(nextConfig, {
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
			automaticVercelMonitors: false,
			treeshake: {
				removeDebugLogging: true,
			},
		},
	}) as NextConfig,
);
