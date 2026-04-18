import { z } from "zod";
import {
  booleanFromString,
  optionalPostgresUrl,
  optionalUrl,
  validateEnv,
} from "./shared";
import { hydrateWebViewerEnvAliases } from "./web-viewer-aliases";

/**
 * Vercel's Clerk integration may prefill env vars with non-standard names:
 * `admin_CLERK_SECRET_KEY`, `NEXT_PUBLIC_admin_CLERK_PUBLISHABLE_KEY`, or
 * `admin_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. The SDK and this repo expect
 * `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — copy known
 * aliases onto the canonical names before Zod runs so production builds do
 * not fail when secrets use the prefixed form.
 */
function hydrateWebViewerEnvAliases(env: NodeJS.ProcessEnv): void {
  const pairs: ReadonlyArray<[canonical: string, aliases: string[]]> = [
    ["CLERK_SECRET_KEY", ["admin_CLERK_SECRET_KEY"]],
    [
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      ["NEXT_PUBLIC_admin_CLERK_PUBLISHABLE_KEY", "admin_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"],
    ],
  ];
  for (const [canonical, aliases] of pairs) {
    if (!env[canonical]?.trim()) {
      for (const alias of aliases) {
        const a = env[alias]?.trim();
        if (a) {
          env[canonical] = a;
          break;
        }
      }
    }
  }
}

/**
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

    // Clerk — required in production; optional in dev/preview so devs can
    // boot the app without a Clerk account. Enforced via superRefine below.
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().trim().optional(),
    /** Satellite / custom domain: without DNS for `clerk.<domain>`, set `NEXT_PUBLIC_CLERK_PROXY_URL` to your `*.clerk.accounts.dev` Frontend API so clerk-js loads. */
    NEXT_PUBLIC_CLERK_DOMAIN: z.string().trim().optional(),
    NEXT_PUBLIC_CLERK_PROXY_URL: z.string().trim().optional(),
    NEXT_PUBLIC_CLERK_JS_URL: z.string().trim().optional(),
    NEXT_PUBLIC_CLERK_UI_URL: z.string().trim().optional(),
    /** Server-only: Frontend API origin (`https://…clerk.accounts.dev`). Enables `/clerk-fapi` rewrite + Clerk `proxyUrl` when custom `clerk.<domain>` DNS is missing. */
    CLERK_FAPI_UPSTREAM: optionalUrl,
    CLERK_SECRET_KEY: z.string().trim().optional(),
    CLERK_WEBHOOK_SIGNING_SECRET: z.string().trim().optional(),

    // Postgres — required in production; optional in dev so devs can boot without a DB.
    DATABASE_URL: optionalPostgresUrl,
    DATABASE_URL_UNPOOLED: optionalPostgresUrl,
    DATABASE_SSL: booleanFromString,

    // Default Clerk org for lead intake + Calendly when the webhook URL has no ?tenant=.
    // Multi-tenant: prefer /api/webhooks/calendly?tenant=<org_id> per Calendly subscription.
    LEAD_WEBHOOK_DEFAULT_AGENCY_ID: z.string().trim().optional(),
    LEAD_WEBHOOK_SECRET: z.string().trim().optional(),
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

    // App URL used in outbound emails + Clerk redirect URLs.
    NEXT_PUBLIC_APP_URL: optionalUrl,
    /** Optional Calendly embed URL for admin calendar (strategy: iframe + existing webhooks). */
    NEXT_PUBLIC_CALENDLY_EMBED_URL: optionalUrl,

    // Turnstile (anti-bot) — optional; Agency OS degrades to "no verification".
    TURNSTILE_SECRET_KEY: z.string().trim().optional(),

    // Stripe (Billing module — `planSuite=full`).
    STRIPE_SECRET_KEY: z.string().trim().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().trim().optional(),
    STRIPE_AGENCY_PRO_PRICE_ID: z.string().trim().optional(),

    // Sentry (optional — build still succeeds without it).
    NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
    /** Set to "1" to enable Session Replay sampling (HIPAA: may capture PHI in DOM). */
    NEXT_PUBLIC_SENTRY_REPLAY: z.string().trim().optional(),
    SENTRY_DSN: optionalUrl,
    SENTRY_AUTH_TOKEN: z.string().trim().optional(),
    SENTRY_ORG: z.string().trim().optional(),
    SENTRY_PROJECT: z.string().trim().optional(),
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
          "CLERK_SECRET_KEY is required in production (Clerk dashboard). Missing this key causes a White Screen of Death on admin. subdomain.",
      });
    }
  });

export type WebViewerEnv = z.infer<typeof webViewerSchema>;

export function validateWebViewerEnv(env: NodeJS.ProcessEnv = process.env): WebViewerEnv {
  hydrateWebViewerEnvAliases(env);
  return validateEnv("web-viewer (Agency OS)", webViewerSchema, env);
}

export { webViewerSchema };
