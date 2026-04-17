import { z } from "zod";
import { optionalUrl, validateEnv } from "./shared";

/**
 * Marketing (`apps/marketing`) — designedbyanthony.com (Astro v6).
 *
 * Marketing is intentionally lean: it only needs to know where to POST
 * leads (`PUBLIC_CRM_LEAD_URL`) and — optionally — where the Lighthouse
 * audit API lives (`PUBLIC_API_URL`). Secret keys belonging to Agency OS
 * (DATABASE_URL, CLERK_SECRET_KEY, STRIPE_*) must NOT be present here;
 * they would indicate an env-bleed between subdomains.
 */
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

    // Apex Vercel project also ships the host-based middleware. These
    // upstreams are allowed to be unset (middleware falls through) but
    // if present they must be valid URLs.
    ADMIN_UPSTREAM_URL: optionalUrl,
    ACCOUNTS_UPSTREAM_URL: optionalUrl,
    LIGHTHOUSE_UPSTREAM_URL: optionalUrl,
  })
  .passthrough()
  .superRefine((env, ctx) => {
    // Env-bleed guard — fail loudly if a web-viewer or lighthouse secret
    // ended up on the marketing Vercel project by mistake. Only applies
    // when:
    //   1. We are on Vercel (`VERCEL=1`), AND
    //   2. The three-project split is actually in effect — signalled by
    //      `ADMIN_UPSTREAM_URL` being present on the apex project (set
    //      per the deploy model in README.md / turbo.json).
    //
    // In a single-project Turborepo build (one Vercel project builds
    // every app via turbo), CRM secrets are expected to coexist with
    // the marketing build — the guard would fire a false positive.
    // Local / cloud-agent machines already share one env, so they are
    // exempt by the VERCEL check.
    if (env.VERCEL !== "1" && process.env.VERCEL !== "1") return;
    const hasThreeProjectSplit =
      typeof (env.ADMIN_UPSTREAM_URL ?? process.env.ADMIN_UPSTREAM_URL) ===
        "string" &&
      ((env.ADMIN_UPSTREAM_URL ?? process.env.ADMIN_UPSTREAM_URL) as string)
        .length > 0;
    if (!hasThreeProjectSplit) return;

    const forbidden = [
      "CLERK_SECRET_KEY",
      "DATABASE_URL",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "LEAD_WEBHOOK_SECRET",
      "GOOGLE_PAGESPEED_API_KEY",
      "GEMINI_API_KEY",
    ] as const;
    const source = env as unknown as Record<string, string | undefined>;
    for (const key of forbidden) {
      const value = source[key] ?? process.env[key];
      if (value && value.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} must not be set on the marketing project — it belongs to Agency OS / Lighthouse (env-bleed detected).`,
        });
      }
    }
  });

export type MarketingEnv = z.infer<typeof marketingSchema>;

export function validateMarketingEnv(env: NodeJS.ProcessEnv = process.env): MarketingEnv {
  return validateEnv("marketing (Astro)", marketingSchema, env);
}

export { marketingSchema };
