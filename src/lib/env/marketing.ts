import { z } from "zod";
import { optionalUrl, validateEnv } from "./shared";

/**
 * Marketing site — designedbyanthony.com (Next.js).
 *
 * Single-deploy: marketing + Lighthouse + APIs all live in this one Next.js
 * app (Firebase App Hosting primary). Schema validates the surface this app reads;
 * everything else passes through (`.passthrough()`). The legacy 3-project
 * env-bleed detector was removed when Lighthouse moved onto the apex.
 */
const marketingSchema = z
	.object({
		NODE_ENV: z.enum(["development", "test", "production"]).optional(),
		VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
		VERCEL: z.string().optional(),

		PUBLIC_CRM_LEAD_URL: optionalUrl,
		/** Server-side JSON POST target for `POST /api/contact` (Convex, etc.). */
		LEAD_WEBHOOK_URL: optionalUrl,
		/** Browser lead JSON POST default for `[data-audit-form]` (e.g. Convex HTTP webhook). */
		NEXT_PUBLIC_LEAD_WEBHOOK_URL: optionalUrl,
		PUBLIC_API_URL: optionalUrl,
		PUBLIC_TURNSTILE_SITE_KEY: z.string().trim().optional(),
		/** reCAPTCHA Enterprise — browser site key (Create Assessment must use the same key). */
		NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().trim().optional(),
		/** Action string passed to `grecaptcha.enterprise.execute` (must match server `RECAPTCHA_EXPECTED_ACTION` / default). */
		NEXT_PUBLIC_RECAPTCHA_ACTION: z.string().trim().optional(),
		/** Google Cloud API key with `recaptchaenterprise.assessments.create` (server-only). */
		RECAPTCHA_ENTERPRISE_API_KEY: z.string().trim().optional(),
		/** Optional override when different from `GOOGLE_CLOUD_PROJECT` (Lighthouse). */
		RECAPTCHA_GOOGLE_CLOUD_PROJECT: z.string().trim().optional(),
		/** Server-only site key if you do not expose it via `NEXT_PUBLIC_*` (unusual). */
		RECAPTCHA_SITE_KEY: z.string().trim().optional(),
		/** Must match the client `execute` action (defaults to `contact_submit`). */
		RECAPTCHA_EXPECTED_ACTION: z.string().trim().optional(),
		/** Minimum risk score (0–1); default 0.5 when `riskAnalysis.score` is present. */
		RECAPTCHA_MIN_SCORE: z.string().trim().optional(),
		PUBLIC_SENTRY_DSN: optionalUrl,

		INDEXNOW_KEY: z.string().trim().optional(),
		INDEXNOW_ENDPOINT: optionalUrl,
		INDEXNOW_FALLBACK_ENDPOINTS: z.string().trim().optional(),

		SENTRY_AUTH_TOKEN: z.string().trim().optional(),
		SENTRY_ORG: z.string().trim().optional(),
		SENTRY_PROJECT: z.string().trim().optional(),

		// Reserved for VertaFlow redirect targets if we ever need to override
		// the hard-coded admin/accounts hostnames in `src/proxy.ts`.
		ADMIN_UPSTREAM_URL: optionalUrl,
		ACCOUNTS_UPSTREAM_URL: optionalUrl,

		/** GetStream Chat — marketing site widget (optional; off unless PUBLIC_ENABLE_STREAM_CHAT=1) */
		PUBLIC_ENABLE_STREAM_CHAT: z.string().trim().optional(),
		PUBLIC_STREAM_CHAT_API_KEY: z.string().trim().optional(),
		STREAM_CHAT_SECRET: z.string().trim().optional(),
		STREAM_CHAT_INBOX_USER_ID: z.string().trim().optional(),
		STREAM_CHAT_INBOX_NAME: z.string().trim().optional(),
	})
	.passthrough();

export type MarketingEnv = z.infer<typeof marketingSchema>;

export function validateMarketingEnv(
	env: NodeJS.ProcessEnv = process.env,
): MarketingEnv {
	return validateEnv("marketing (Next.js)", marketingSchema, env);
}

export { marketingSchema };
