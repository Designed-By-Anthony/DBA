import type { NextConfig } from "next";
import { validateLighthouseEnv } from "@/lib/env/lighthouse";
import { validateMarketingEnv } from "@/lib/env/marketing";

validateMarketingEnv();
validateLighthouseEnv();

const nextConfig: NextConfig = {
	trailingSlash: false,
	reactStrictMode: true,
	// sharp is not available in Cloudflare Workers; use unoptimized images
	images: {
		unoptimized: true,
	},
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
						value:
							process.env.NODE_ENV === "development"
								? "unsafe-none"
								: "same-origin-allow-popups",
					},
				],
			},
		];
	},
};

export default nextConfig;
