// The "Zod" environment guard — fails the build if a required key is missing
// (see AGENTS.md > Code Quality & Purge Rules → Strict Typing + Zod).
import { validateWebViewerEnv } from "@dba/env/web-viewer";
import { withSentryConfig } from "@sentry/nextjs";
import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

validateWebViewerEnv();

const clerkFapiUpstream = process.env.CLERK_FAPI_UPSTREAM?.trim().replace(
	/\/$/,
	"",
);

const nextConfig: NextConfig = {
	/** Native `pg` driver — avoid bundling issues in the server graph. */
	serverExternalPackages: ["pg"],
	experimental: {
		optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
	},
	async rewrites() {
		if (!clerkFapiUpstream || !/^https:\/\//i.test(clerkFapiUpstream))
			return [];
		return [
			{
				source: "/clerk-fapi/:path*",
				destination: `${clerkFapiUpstream}/:path*`,
			},
		];
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "Content-Security-Policy",
						// Clerk FAPI (*.clerk.accounts.dev), scdn project settings fetch, telemetry, img — see https://clerk.com/docs/security/clerk-csp
						// `connect-src` includes *.vertaflow.io + designedbyanthony.com (studio marketing → CRM ingest).
						// `frame-ancestors 'self'` supersedes the legacy X-Frame-Options and is the
						// check modern browsers actually honor.
						value:
							"default-src 'self'; " +
							"base-uri 'self'; " +
							"object-src 'none'; " +
							"frame-ancestors 'self'; " +
							"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://*.clerk.accounts.dev https://scdn.clerk.com https://*.vertaflow.io https://challenges.cloudflare.com https://static.cloudflareinsights.com https://va.vercel-scripts.com; " +
							"style-src 'self' 'unsafe-inline'; " +
							"img-src 'self' data: blob: https://images.unsplash.com https://qr-code-generator.com https://img.clerk.com https://*.vertaflow.io; " +
							// img.clerk.com + va.vercel-scripts.com: Clerk avatar fetch() + Vercel Analytics/Speed Insights beacons (connect-src; img-src already allows img.clerk.com for <img>)
							"connect-src 'self' https://*.vertaflow.io https://designedbyanthony.com https://www.designedbyanthony.com https://*.designedbyanthony.com https://api.stripe.com https://*.clerk.accounts.dev https://img.clerk.com https://scdn.clerk.com https://clerk-telemetry.com https://*.clerk-telemetry.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://cloudflareinsights.com https://*.cloudflareinsights.com; " +
							"frame-src 'self' https://js.stripe.com https://www.google.com/recaptcha/ https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.vertaflow.io https://calendly.com https://*.calendly.com; " +
							"worker-src 'self' blob: https://*.vertaflow.io;",
					},
					// HSTS: pin the host to HTTPS for two years (preload-eligible once you
					// verify apex+subdomain coverage). Safe to apply on Vercel which is
					// HTTPS-only for production deployments.
					{
						key: "Strict-Transport-Security",
						value: "max-age=63072000; includeSubDomains; preload",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					// Legacy header kept only for IE/old Safari; modern browsers ignore it
					// and `frame-ancestors 'self'` above is the canonical control.
					{
						key: "X-Frame-Options",
						value: "SAMEORIGIN",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "Permissions-Policy",
						// Deny sensor/device APIs we never use; allow PaymentRequest for Stripe.
						value:
							"camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=(), usb=()",
					},
					{
						key: "Cross-Origin-Opener-Policy",
						// Keeps Stripe Checkout popups working while isolating the window.
						value: "same-origin-allow-popups",
					},
				],
			},
		];
	},
};

/** Turbopack-friendly PWA: route handler at app/serwist/[path], worker bundled via esbuild (see Serwist docs). */
export default withSentryConfig(withSerwist(nextConfig), {
	// For all available options, see:
	// https://www.npmjs.com/package/@sentry/webpack-plugin#options

	org: "designed-by-anthony",

	project: "agency-os",

	// Only print logs for uploading source maps in CI
	silent: !process.env.CI,

	// For all available options, see:
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

	// Upload a larger set of source maps for prettier stack traces (increases build time)
	widenClientFileUpload: true,

	// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
	// This can increase your server load as well as your hosting bill.
	// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
	// side errors will fail.
	tunnelRoute: "/monitoring",

	webpack: {
		// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
		// See the following for more information:
		// https://docs.sentry.io/product/crons/
		// https://vercel.com/docs/cron-jobs
		automaticVercelMonitors: true,

		// Tree-shaking options for reducing bundle size
		treeshake: {
			// Automatically tree-shake Sentry logger statements to reduce bundle size
			removeDebugLogging: true,
		},
	},
});
