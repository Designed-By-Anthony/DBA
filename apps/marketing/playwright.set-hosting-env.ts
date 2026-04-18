/**
 * Side-effect module: must load before `playwright.config.ts` so parity-header flags are set
 * when using `playwright.hosting.config.ts` (import order is deterministic).
 */
process.env.PLAYWRIGHT_USE_STATIC_PARITY_SERVER = '1';
