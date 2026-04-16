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
    // ended up on the marketing Vercel project by mistake. Only runs on
    // actual Vercel builds (where `VERCEL=1` is injected); on local /
    // cloud-agent machines the whole monorepo shares one env so this
    // check would false-positive.
    if (env.VERCEL !== "1" && process.env.VERCEL !== "1") return;
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
