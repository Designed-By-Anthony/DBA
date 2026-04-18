import { z } from "zod";
import { optionalUrl, validateEnv } from "./shared";

/**
 * Lighthouse (`apps/lighthouse`) — lighthouse.designedbyanthony.com (Next.js 16).
 *
 * Lighthouse runs the audit API + report viewer. It forwards qualified
 * leads to Agency OS via `AGENCY_OS_WEBHOOK_URL`.
 */
const lighthouseSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
    VERCEL: z.string().optional(),

    GOOGLE_PAGESPEED_API_KEY: z.string().trim().optional(),
    GEMINI_API_KEY: z.string().trim().optional(),
    GEMINI_MODEL: z.string().trim().optional(),
    TURNSTILE_SECRET_KEY: z.string().trim().optional(),

    GMAIL_SERVICE_ACCOUNT_KEY: z.string().trim().optional(),
    SHEETS_ID: z.string().trim().optional(),
    DRIVE_PROJECTS_FOLDER_ID: z.string().trim().optional(),

    MOZ_API_CREDENTIALS: z.string().trim().optional(),
    GOOGLE_PLACES_API_KEY: z.string().trim().optional(),
    GOOGLE_CLOUD_PROJECT: z.string().trim().optional(),
    GOOGLE_CLOUD_LOCATION: z.string().trim().optional(),
    ALLOWED_ORIGINS: z.string().trim().optional(),

    AGENCY_OS_WEBHOOK_URL: optionalUrl,
    AGENCY_OS_WEBHOOK_SECRET: z.string().trim().optional(),
    REPORT_PUBLIC_BASE_URL: optionalUrl,

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
    // `ADMIN_UPSTREAM_URL` is documented for the apex (marketing) project
    // only — it is never set on the standalone lighthouse Vercel project.
    // When it *is* present here, we are building lighthouse as part of a
    // deployment that also ships the apex middleware (shared monorepo env with
    // Agency OS) — skip to avoid false positives. When absent, this is an
    // isolated lighthouse project: forbid CRM secrets (env-bleed guard).
    if (env.VERCEL !== "1" && process.env.VERCEL !== "1") return;
    const apexMiddlewareEnvPresent =
      typeof (env.ADMIN_UPSTREAM_URL ?? process.env.ADMIN_UPSTREAM_URL) ===
        "string" &&
      ((env.ADMIN_UPSTREAM_URL ?? process.env.ADMIN_UPSTREAM_URL) as string)
        .length > 0;
    if (apexMiddlewareEnvPresent) return;

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
          message: `${key} must not be set on the lighthouse project — it belongs to Agency OS (env-bleed detected).`,
        });
      }
    }
  });

export type LighthouseEnv = z.infer<typeof lighthouseSchema>;

export function validateLighthouseEnv(env: NodeJS.ProcessEnv = process.env): LighthouseEnv {
  return validateEnv("lighthouse", lighthouseSchema, env);
}

export { lighthouseSchema };
