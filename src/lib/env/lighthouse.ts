import { z } from "zod";
import { optionalUrl, validateEnv } from "./shared";

/**
 * Lighthouse audit API + report viewer env — same Next.js app on
 * `lighthouse.*` and `/lighthouse/*`. Qualified leads forward to Convex or
 * Agency OS via `LEAD_WEBHOOK_URL` / `AGENCY_OS_WEBHOOK_URL`.
 */
const lighthouseSchema = z
	.object({
		NODE_ENV: z.enum(["development", "test", "production"]).optional(),
		VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
		VERCEL: z.string().optional(),

		GOOGLE_PAGESPEED_API_KEY: z.string().trim().optional(),
		GEMINI_API_KEY: z.string().trim().optional(),
		GEMINI_MODEL: z.string().trim().optional(),
		NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY: z.string().trim().optional(),
		NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_ACTION: z.string().trim().optional(),
		RECAPTCHA_ENTERPRISE_API_KEY: z.string().trim().optional(),
		RECAPTCHA_ENTERPRISE_PROJECT_ID: z.string().trim().optional(),
		RECAPTCHA_ENTERPRISE_SITE_KEY: z.string().trim().optional(),
		RECAPTCHA_ENTERPRISE_EXPECTED_ACTION: z.string().trim().optional(),
		RECAPTCHA_ENTERPRISE_MIN_SCORE: z.string().trim().optional(),
		TURNSTILE_SECRET_KEY: z.string().trim().optional(),
		/** When `1`/`true`, `/api/audit` requires Turnstile (needs secret + client token). */
		LIGHTHOUSE_STRICT_TURNSTILE: z.string().trim().optional(),

		GMAIL_SERVICE_ACCOUNT_KEY: z.string().trim().optional(),
		SHEETS_ID: z.string().trim().optional(),
		DRIVE_PROJECTS_FOLDER_ID: z.string().trim().optional(),

		MOZ_API_CREDENTIALS: z.string().trim().optional(),
		GOOGLE_PLACES_API_KEY: z.string().trim().optional(),
		GOOGLE_CLOUD_PROJECT: z.string().trim().optional(),
		GOOGLE_CLOUD_LOCATION: z.string().trim().optional(),
		ALLOWED_ORIGINS: z.string().trim().optional(),

		/** Convex HTTP action or CRM ingest for audit + marketing leads. */
		LEAD_WEBHOOK_URL: optionalUrl,
		LEAD_WEBHOOK_SECRET: z.string().trim().optional(),

		AGENCY_OS_WEBHOOK_URL: optionalUrl,
		AGENCY_OS_WEBHOOK_SECRET: z.string().trim().optional(),
		/** POST JSON audit summary after success (e.g. Convex logging pipeline). */
		AUDIT_LOGGING_WEBHOOK_URL: optionalUrl,
		REPORT_PUBLIC_BASE_URL: optionalUrl,

		/** When `1`, POST successful audit leads to Freshsales (`FRESHWORKS_CRM_*`). */
		FRESHWORKS_CRM_SYNC_ENABLED: z.string().trim().optional(),
		FRESHWORKS_CRM_BASE_URL: optionalUrl,
		FRESHWORKS_CRM_API_KEY: z.string().trim().optional(),
		FRESHWORKS_CRM_AUTH_MODE: z.enum(["token", "bearer"]).optional(),
		FRESHWORKS_CRM_CUSTOM_FIELD_KEYS: z.string().trim().optional(),

		/**
		 * Interim lead-email bridge (`/api/lead-email`). Active until the
		 * VertaFlow CRM tenant is wired and marketing's `PUBLIC_INGEST_URL`
		 * is flipped back to the CRM ingest route. All three are optional at
		 * build time so local/dev deploys without a Resend key still validate.
		 */
		RESEND_API_KEY: z.string().trim().optional(),
		RESEND_FROM_EMAIL: z.string().trim().email().optional(),
		LEAD_EMAIL_TO: z.string().trim().email().optional(),

		NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
		SENTRY_DSN: optionalUrl,
		SENTRY_AUTH_TOKEN: z.string().trim().optional(),
		SENTRY_ORG: z.string().trim().optional(),
		SENTRY_PROJECT: z.string().trim().optional(),
	})
	.passthrough()
	.superRefine((env, ctx) => {
		// Only enforce on Vercel (`VERCEL=1`). Skip local/CI.
		//
		// This repo ships one Next.js app (marketing + `/lighthouse`). That deploy
		// often shares Vercel env with Agency OS secrets — same as
		// `validateMarketingEnv` unified mode. Do **not** hard-fail here by default.
		//
		// Legacy: a **dedicated** Lighthouse-only Vercel project should set
		// `LIGHTHOUSE_ISOLATED_PROJECT=1` so CRM secrets are rejected (env-bleed).
		if (env.VERCEL !== "1" && process.env.VERCEL !== "1") return;

		const isolated =
			env.LIGHTHOUSE_ISOLATED_PROJECT === "1" ||
			env.LIGHTHOUSE_ISOLATED_PROJECT === "true" ||
			process.env.LIGHTHOUSE_ISOLATED_PROJECT === "1" ||
			process.env.LIGHTHOUSE_ISOLATED_PROJECT === "true";
		if (!isolated) return;

		const forbidden = [
			"CLERK_SECRET_KEY",
			"DATABASE_URL",
			"STRIPE_SECRET_KEY",
			"STRIPE_WEBHOOK_SECRET",
		] as const;
		const source = env as unknown as Record<string, string | undefined>;
		for (const key of forbidden) {
			const value = source[key] ?? process.env[key];
			if (value && value.length > 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: [key],
					message: `${key} must not be set on an isolated lighthouse project — it belongs to Agency OS (env-bleed detected).`,
				});
			}
		}
	});

export type LighthouseEnv = z.infer<typeof lighthouseSchema>;

export function validateLighthouseEnv(
	env: NodeJS.ProcessEnv = process.env,
): LighthouseEnv {
	return validateEnv("lighthouse", lighthouseSchema, env);
}

export { lighthouseSchema };
