# `@dba/env` — The "Zod" Environment Guard

Central, **per-app** environment schemas for the Designed by Anthony
monorepo. Each app imports its schema so the build fails fast when a
subdomain is missing a required key (e.g. `CLERK_SECRET_KEY` on
web-viewer) instead of shipping a White Screen of Death to production.

## Why

- **Env-bleed protection.** Marketing (apex) should never carry
  `CLERK_SECRET_KEY` or `DATABASE_URL`; Lighthouse should never carry
  `STRIPE_SECRET_KEY`. Each schema rejects forbidden keys at build time.
- **Hard failures over silent misconfigurations.** Zod throws with a
  human-readable report that names the missing / malformed vars.
- **Single source of truth.** `turbo.json` → `tasks.build.env` decides
  *which* vars flow into the build cache; `@dba/env` decides *whether*
  they are valid for each surface.

## Usage

```ts
// apps/web-viewer/next.config.ts
import "@dba/env/web-viewer"; // side-effect: validates process.env at import time
```

```ts
// apps/marketing/astro.config.mjs — or any pre-build script
import { validateMarketingEnv } from "@dba/env/marketing";
validateMarketingEnv();
```

```ts
// apps/lighthouse/next.config.ts
import "@dba/env/lighthouse";
```

Set `SKIP_ENV_VALIDATION=1` to bypass (local scripts, one-off CLIs).
**Do not** set it in Vercel production environments.
