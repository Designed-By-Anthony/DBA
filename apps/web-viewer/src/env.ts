import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const emptyToUndefined = (val: unknown) =>
  val === "" || val === undefined ? undefined : val;

/**
 * Security gate: missing `DATABASE_URL` or Clerk keys fails `next build` / dev server startup
 * (via `import "./src/env"` in `next.config.ts`) with a clear Zod error — not a silent runtime failure.
 *
 * **Escape hatch (Playwright / CI without secrets):** set `SKIP_ENV_VALIDATION=1` only in those environments.
 */
export const env = createEnv({
  server: {
    DATABASE_URL: z.preprocess(emptyToUndefined, z.url()),
    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_WEBHOOK_SIGNING_SECRET: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),
    DATABASE_SSL: z.preprocess(
      emptyToUndefined,
      z.enum(["true", "false", "0", "1"]).optional(),
    ),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SIGNING_SECRET: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
    DATABASE_SSL: process.env.DATABASE_SSL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",
});
