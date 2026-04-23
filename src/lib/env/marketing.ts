import { z } from "zod";
import { optionalUrl, validateEnv } from "./shared";

/**
 * Marketing site — designedbyanthony.com (Next.js).
 *
 * Marketing is intentionally lean: it only needs to know where to POST
 * leads (`PUBLIC_CRM_LEAD_URL`) and — optionally — where the Lighthouse
 * audit API lives (`PUBLIC_API_URL`).
 *
 * Env-bleed detection: if `CLERK_SECRET_KEY`, `DATABASE_URL`,
 * `STRIPE_SECRET_KEY`, etc. show up on the marketing build, they are
 * secrets that belong to Agency OS / Lighthouse and should not be
 * readable by the marketing site. The original behaviour was to hard-fail
 * the build. In practice this only applies cleanly when the repo is
 * deployed as the 3-Vercel-projects split described in AGENTS.md
 * (marketing / web-viewer / lighthouse as separate projects). When the
 * repo is deployed as a single Vercel project that serves all three
 * apps behind the apex, those same secrets will legitimately be in the
 * marketing build's environment. Hard-failing would break production.
 *
 * Current default: the env-bleed check logs a warning but does NOT
 * abort the build. Opt in to the strict behaviour with
 * `MARKETING_STRICT_ENV_BLEED=1` — recommended only for the 3-project
 * split where marketing truly has its own Vercel project.
 */
const ENV_BLEED_KEYS = [
	"CLERK_SECRET_KEY",
	"DATABASE_URL",
	"STRIPE_SECRET_KEY",
	"STRIPE_WEBHOOK_SECRET",
	"LEAD_WEBHOOK_SECRET",
	"GOOGLE_PAGESPEED_API_KEY",
	"GEMINI_API_KEY",
	"BROWSERBASE_API_KEY",
	"OPENAI_API_KEY",
] as const;

function detectEnvBleed(
	env: Record<string, string | undefined>,
	fallback: NodeJS.ProcessEnv = process.env,
): string[] {
	const out: string[] = [];
	for (const key of ENV_BLEED_KEYS) {
		const value = env[key] ?? fallback[key];
		if (value && value.length > 0) out.push(key);
	}
	return out;
}

const marketingSchema = z
	.object({
		NODE_ENV: z.enum(["development", "test", "production"]).optional(),
		VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
		VERCEL: z.string().optional(),

		PUBLIC_CRM_LEAD_URL: optionalUrl,
		PUBLIC_API_URL: optionalUrl,
		PUBLIC_TURNSTILE_SITE_KEY: z.string().trim().optional(),
		PUBLIC_SENTRY_DSN: optionalUrl,

		INDEXNOW_KEY: z.string().trim().optional(),
		INDEXNOW_ENDPOINT: optionalUrl,
		INDEXNOW_FALLBACK_ENDPOINTS: z.string().trim().optional(),

		SENTRY_AUTH_TOKEN: z.string().trim().optional(),
		SENTRY_ORG: z.string().trim().optional(),
		SENTRY_PROJECT: z.string().trim().optional(),

		MARKETING_STRICT_ENV_BLEED: z.string().trim().optional(),

		/**
		 * Legacy override: treat as single-project deploy for env-bleed rules.
		 * Default is inferred: if `LIGHTHOUSE_UPSTREAM_URL` is unset, this build
		 * is expected to serve Lighthouse itself (same as unified).
		 */
		DBA_UNIFIED_WEB: z.string().trim().optional(),

		// Apex Vercel project also ships the host-based middleware. These
		// upstreams are allowed to be unset (middleware falls through) but
		// if present they must be valid URLs.
		ADMIN_UPSTREAM_URL: optionalUrl,
		ACCOUNTS_UPSTREAM_URL: optionalUrl,
		LIGHTHOUSE_UPSTREAM_URL: optionalUrl,

		/** GetStream Chat — marketing site widget (optional; off unless PUBLIC_ENABLE_STREAM_CHAT=1) */
		PUBLIC_ENABLE_STREAM_CHAT: z.string().trim().optional(),
		PUBLIC_STREAM_CHAT_API_KEY: z.string().trim().optional(),
		STREAM_CHAT_SECRET: z.string().trim().optional(),
		STREAM_CHAT_INBOX_USER_ID: z.string().trim().optional(),
		STREAM_CHAT_INBOX_NAME: z.string().trim().optional(),
	})
	.passthrough()
	.superRefine((env, ctx) => {
		// Only on Vercel builds; local / cloud-agent machines share one env.
		if (env.VERCEL !== "1" && process.env.VERCEL !== "1") return;

		const lighthouseUpstreamSet = Boolean(
			(
				env.LIGHTHOUSE_UPSTREAM_URL ??
				process.env.LIGHTHOUSE_UPSTREAM_URL ??
				""
			).trim(),
		);
		const unifiedExplicit =
			env.DBA_UNIFIED_WEB === "1" ||
			env.DBA_UNIFIED_WEB === "true" ||
			process.env.DBA_UNIFIED_WEB === "1" ||
			process.env.DBA_UNIFIED_WEB === "true";
		// One Next app: no lighthouse upstream on apex ⇒ Lighthouse code + secrets may live here.
		if (unifiedExplicit || !lighthouseUpstreamSet) return;

		// Fail-hard when either:
		//   a) MARKETING_STRICT_ENV_BLEED=1 (explicit opt-in), OR
		//   b) ADMIN_UPSTREAM_URL is present — the 3-Vercel-project split is
		//      in effect, so CRM secrets must NOT be on the marketing build.
		const strict =
			env.MARKETING_STRICT_ENV_BLEED === "1" ||
			env.MARKETING_STRICT_ENV_BLEED === "true" ||
			process.env.MARKETING_STRICT_ENV_BLEED === "1" ||
			process.env.MARKETING_STRICT_ENV_BLEED === "true";
		const hasThreeProjectSplit =
			typeof (env.ADMIN_UPSTREAM_URL ?? process.env.ADMIN_UPSTREAM_URL) ===
				"string" &&
			((env.ADMIN_UPSTREAM_URL ?? process.env.ADMIN_UPSTREAM_URL) as string)
				.length > 0;
		if (!strict && !hasThreeProjectSplit) return;

		const source = env as unknown as Record<string, string | undefined>;
		for (const key of detectEnvBleed(source)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: [key],
				message: `${key} must not be set on the marketing project — it belongs to Agency OS / Lighthouse (env-bleed detected). Remove it from this project's Vercel env, or unset MARKETING_STRICT_ENV_BLEED if the single-project deploy is intentional.`,
			});
		}
	});

export type MarketingEnv = z.infer<typeof marketingSchema>;

export function validateMarketingEnv(
	env: NodeJS.ProcessEnv = process.env,
): MarketingEnv {
	const result = validateEnv("marketing (Next.js)", marketingSchema, env);

	// Non-strict path: still log the bleed so it isn't silently ignored.
	const onVercel = env.VERCEL === "1" || process.env.VERCEL === "1";
	const strict =
		env.MARKETING_STRICT_ENV_BLEED === "1" ||
		env.MARKETING_STRICT_ENV_BLEED === "true";
	if (onVercel && !strict) {
		const bleed = detectEnvBleed(
			env as unknown as Record<string, string | undefined>,
			env,
		);
		if (bleed.length > 0) {
			console.warn(
				`[marketing (Next.js)] env-bleed: ${bleed.join(", ")} ${
					bleed.length === 1 ? "is" : "are"
				} set on this build. If you run the 3-Vercel-project split (marketing / web-viewer / lighthouse), remove these from the marketing project. If you run a single Vercel project, this warning is informational — set MARKETING_STRICT_ENV_BLEED=1 to fail the build loudly instead.`,
			);
		}
	}

	return result;
}

export { marketingSchema };
