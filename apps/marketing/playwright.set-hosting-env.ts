/**
 * Side-effect module: must load before `playwright.config.ts` so emulator flags are set
 * when using `playwright.hosting.config.ts` (import order is deterministic).
 */
process.env.PLAYWRIGHT_USE_FIREBASE_EMULATOR = '1';
