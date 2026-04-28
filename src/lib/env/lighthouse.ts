import { z } from "zod";
import { optionalUrl, validateEnv } from "./shared";

/**
 * Lighthouse audit API + report viewer env — same Next.js app on `/lighthouse/*`.
 * Qualified leads forward to Convex / Slack via `LEAD_WEBHOOK_URL`.
 */
const lighthouseSchema = z
	.object({
		NODE_ENV: z.enum(["development", "test", "production"]).optional(),

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

		GMAIL_SERVICE_ACCOUNT_KEY: z.string().trim().optional(),

		MOZ_API_CREDENTIALS: z.string().trim().optional(),
		GOOGLE_PLACES_API_KEY: z.string().trim().optional(),
		GOOGLE_CLOUD_PROJECT: z.string().trim().optional(),
		GOOGLE_CLOUD_LOCATION: z.string().trim().optional(),
		ALLOWED_ORIGINS: z.string().trim().optional(),

		/** Convex HTTP action or Slack webhook for audit + marketing leads. */
		LEAD_WEBHOOK_URL: optionalUrl,
		LEAD_WEBHOOK_SECRET: z.string().trim().optional(),

		/** POST JSON audit summary after success (e.g. Convex logging pipeline). */
		AUDIT_LOGGING_WEBHOOK_URL: optionalUrl,
		REPORT_PUBLIC_BASE_URL: optionalUrl,

		/**
		 * Resend transactional email — audit receipt + `/api/lead-email`.
		 * All three are optional at build time so local/dev deploys without a
		 * Resend key still validate.
		 */
		RESEND_API_KEY: z.string().trim().optional(),
		RESEND_FROM_EMAIL: z.string().trim().email().optional(),
		LEAD_EMAIL_TO: z.string().trim().email().optional(),
	})
	.passthrough();

export type LighthouseEnv = z.infer<typeof lighthouseSchema>;

export function validateLighthouseEnv(
	env: NodeJS.ProcessEnv = process.env,
): LighthouseEnv {
	return validateEnv("lighthouse", lighthouseSchema, env);
}

export { lighthouseSchema };
