import { z } from "zod";
import { optionalUrl, validateEnv } from "./shared";

/**
 * Marketing site — designedbyanthony.com (Next.js).
 *
 * Single-deploy: marketing + Lighthouse + APIs all live in this one Next.js
 * app on Firebase App Hosting (and local dev). Schema validates the surface
 * that this app actually reads; everything else passes through (`.passthrough()`).
 */
const marketingSchema = z
	.object({
		NODE_ENV: z.enum(["development", "test", "production"]).optional(),

		PUBLIC_CRM_LEAD_URL: optionalUrl,
		PUBLIC_API_URL: optionalUrl,

		/** Convex HTTP action or Slack webhook for lead ingest. */
		LEAD_WEBHOOK_URL: optionalUrl,
		LEAD_WEBHOOK_SECRET: z.string().trim().optional(),

		INDEXNOW_KEY: z.string().trim().optional(),
		INDEXNOW_ENDPOINT: optionalUrl,
		INDEXNOW_FALLBACK_ENDPOINTS: z.string().trim().optional(),

		// Reserved for VertaFlow redirect targets if we ever need to override
		// the hard-coded admin/accounts hostnames in `src/proxy.ts`.
		ADMIN_UPSTREAM_URL: optionalUrl,
		ACCOUNTS_UPSTREAM_URL: optionalUrl,
	})
	.passthrough();

export type MarketingEnv = z.infer<typeof marketingSchema>;

export function validateMarketingEnv(
	env: NodeJS.ProcessEnv = process.env,
): MarketingEnv {
	return validateEnv("marketing (Next.js)", marketingSchema, env);
}

export { marketingSchema };
