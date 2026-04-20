import { z } from "zod";
import {
  booleanFromString,
  optionalPostgresUrl,
  optionalUrl,
  validateEnv,
} from "./shared";
import { hydrateWebViewerEnvAliases } from "./web-viewer-aliases";

/**
 * Auth env alias hydration lives in `web-viewer-aliases.ts` (Vercel may use
 * `admin_*` / `NEXT_PUBLIC_admin_*` names — they map to canonical keys before Zod).
 *
 * Agency OS (`apps/web-viewer`) — admin.* + accounts.* (Next.js 16).
 *
 * Required for the admin surface to function:
 *   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` (auth).
 *   - `DATABASE_URL` or `DATABASE_URL_UNPOOLED` (Drizzle / Postgres) —
 *     tenant-scoped queries depend on it.
 *
 * Everything else is optional at build time but validated so that a
 * misconfigured prod deploy surfaces during build instead of producing
 * a runtime stack trace on first request.
 */
const webViewerSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),

    // Legacy Stytch vars — accepted only so old project envs do not fail parsing.
    NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN: z.string().trim().optional(),
    STYTCH_PROJECT_ID: z.string().trim().optional(),
    STYTCH_SECRET: z.string().trim().optional(),
    STYTCH_PROJECT_ENV: z.enum(["test", "live"]).optional(),

    // Clerk auth — required in production; alias hydration handles Vercel-prefixed names.
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().trim().optional(),
    NEXT_PUBLIC_CLERK_DOMAIN: z.string().trim().optional(),
    NEXT_PUBLIC_CLERK_PROXY_URL: z.string().trim().optional(),
    NEXT_PUBLIC_CLERK_JS_URL: z.string().trim().optional(),
    NEXT_PUBLIC_CLERK_UI_URL: z.string().trim().optional(),
    CLERK_FAPI_UPSTREAM: optionalUrl,
    CLERK_SECRET_KEY: z.string().trim().optional(),
    CLERK_WEBHOOK_SIGNING_SECRET: z.string().trim().optional(),

    // Postgres — required in production; optional in dev so devs can boot without a DB.
    DATABASE_URL: optionalPostgresUrl,
    DATABASE_URL_UNPOOLED: optionalPostgresUrl,
    DATABASE_SSL: booleanFromString,

    // Default tenant for lead intake + Calendly when the webhook URL has no ?tenant=.
    // Multi-tenant: prefer /api/webhooks/calendly?tenant=<org_id> per Calendly subscription.
    LEAD_WEBHOOK_DEFAULT_AGENCY_ID: z.string().trim().optional(),
    LEAD_WEBHOOK_SECRET: z.string().trim().optional(),
    /** HMAC secret for embedded `public/widgets/lead-form.js` (?tenant=&sig=). */
    LEAD_EMBED_WIDGET_SECRET: z.string().trim().optional(),
    LEAD_WEBHOOK_CORS_ORIGINS: z.string().trim().optional(),

    // Transactional email.
    RESEND_API_KEY: z.string().trim().optional(),
    RESEND_DOMAIN_TEST_MODE: booleanFromString,
    RESEND_DOMAIN_TEST_VERIFIED: booleanFromString,
    /** Svix signing secret from Resend Dashboard → Webhooks (inbound `email.received`, etc.). */
    RESEND_WEBHOOK_SECRET: z.string().trim().optional(),
    DISCORD_WEBHOOK_URL: optionalUrl,
    DISCORD_TEST_MODE: booleanFromString,
    EMAIL_TEST_MODE: booleanFromString,
    IS_TEST: booleanFromString,

    // App URL used in outbound emails + auth redirect URLs.
    NEXT_PUBLIC_APP_URL: optionalUrl,
    /** Optional Calendly embed URL for admin calendar (strategy: iframe + existing webhooks). */
    NEXT_PUBLIC_CALENDLY_EMBED_URL: optionalUrl,

    // Turnstile (anti-bot) — optional; Agency OS degrades to "no verification".
    TURNSTILE_SECRET_KEY: z.string().trim().optional(),
    /** Site key for Turnstile (browser). Exposed to embed widget skin JSON. */
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().trim().optional(),

    // Stripe (Billing module — `planSuite=full`).
    STRIPE_SECRET_KEY: z.string().trim().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().trim().optional(),
    STRIPE_AGENCY_PRO_PRICE_ID: z.string().trim().optional(),

    // Sentry (optional — build still succeeds without it).
    NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
    /** Set to "1" to load Vercel Web Analytics + Speed Insights on custom domains (e.g. admin.*). */
    NEXT_PUBLIC_VERCEL_WEB_ANALYTICS: z.string().trim().optional(),
    /** Set to "1" to enable Session Replay sampling (HIPAA: may capture PHI in DOM). */
    NEXT_PUBLIC_SENTRY_REPLAY: z.string().trim().optional(),
    SENTRY_DSN: optionalUrl,
    SENTRY_AUTH_TOKEN: z.string().trim().optional(),
    SENTRY_ORG: z.string().trim().optional(),
    SENTRY_PROJECT: z.string().trim().optional(),

    // Stagehand (Browserbase + Gemini)
    GEMINI_API_KEY: z.string().trim().optional(),
    BROWSERBASE_API_KEY: z.string().trim().optional(),

    // Cloudflare R2 — asset storage (images, PDFs, docs).
    R2_ACCOUNT_ID: z.string().trim().optional(),
    R2_ACCESS_KEY_ID: z.string().trim().optional(),
    R2_SECRET_ACCESS_KEY: z.string().trim().optional(),
    R2_BUCKET_NAME: z.string().trim().optional(),

    // PrintNode — cloud receipt/kitchen printing.
    PRINTNODE_API_KEY: z.string().trim().optional(),
  })
  .superRefine((env, ctx) => {
    // Hard requirements only apply to production Vercel deploys
    // (`VERCEL_ENV === "production"`). Local builds + Preview deploys
    // stay bootable without the full secret bundle.
    if (env.VERCEL_ENV !== "production") return;

    if (!env.DATABASE_URL && !env.DATABASE_URL_UNPOOLED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message:
          "DATABASE_URL or DATABASE_URL_UNPOOLED is required in production (Postgres 18 — see AGENTS.md > Infrastructure Context).",
      });
    }
    if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"],
        message:
          "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required in production (Clerk dashboard).",
      });
    }
    if (!env.CLERK_SECRET_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CLERK_SECRET_KEY"],
        message:
          "CLERK_SECRET_KEY is required in production (Clerk dashboard).",
      });
    }
  });

export type WebViewerEnv = z.infer<typeof webViewerSchema>;

export function validateWebViewerEnv(env: NodeJS.ProcessEnv = process.env): WebViewerEnv {
  hydrateWebViewerEnvAliases(env);
  return validateEnv("web-viewer (Agency OS)", webViewerSchema, env);
}

export { webViewerSchema };
