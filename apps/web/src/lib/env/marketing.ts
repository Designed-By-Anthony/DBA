import { z } from "zod";
import { DEFAULT_PUBLIC_API_BASE_URL } from "../publicApi";
import { optionalUrl, validateEnv } from "./shared";

/**
 * Marketing site — designedbyanthony.com (Next.js).
 *
 * Marketing app env surface for the public frontend.
 * Backend APIs are served by the separate `apps/api` Cloudflare Worker.
 */
const marketingSchema = z
	.object({
		NODE_ENV: z.enum(["development", "test", "production"]).optional(),
		NEXT_PUBLIC_API_BASE_URL: optionalUrl,

		PUBLIC_CRM_LEAD_URL: optionalUrl,
		PUBLIC_API_URL: optionalUrl,

		/** Convex HTTP action or Slack webhook for lead ingest. */
		LEAD_WEBHOOK_URL: optionalUrl,
		LEAD_WEBHOOK_SECRET: z.string().trim().optional(),

		INDEXNOW_KEY: z.string().trim().optional(),
		INDEXNOW_ENDPOINT: optionalUrl,
		INDEXNOW_FALLBACK_ENDPOINTS: z.string().trim().optional(),

		/** Stripe webhook secrets — one per endpoint registered in the Stripe dashboard. */
		STRIPE_THIN_WEBHOOK_SECRET: z.string().trim().optional(),
		STRIPE_SNAPSHOT_WEBHOOK_SECRET: z.string().trim().optional(),

		// Reserved for managed console redirect targets if we ever need to override
		// the hard-coded admin/accounts hostnames in `src/middleware.ts`.
		ADMIN_UPSTREAM_URL: optionalUrl,
		ACCOUNTS_UPSTREAM_URL: optionalUrl,
	})
	.passthrough()
	.superRefine((env) => {
		if (env.NODE_ENV === "production" && !env.NEXT_PUBLIC_API_BASE_URL)
			env.NEXT_PUBLIC_API_BASE_URL = DEFAULT_PUBLIC_API_BASE_URL;
	});

export type MarketingEnv = z.infer<typeof marketingSchema>;

export function validateMarketingEnv(
	env: NodeJS.ProcessEnv = process.env,
): MarketingEnv {
	return validateEnv("marketing (Next.js)", marketingSchema, env);
}

export { marketingSchema };
