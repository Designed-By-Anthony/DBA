import { test, expect } from '@playwright/test';

/**
 * Validates security headers from Firebase Hosting (`firebase.json` CSP, HSTS, Trusted Types).
 * Run with hosting config so the emulator starts and headers match production:
 *   npm run test:security-headers
 *   npx playwright test -c playwright.hosting.config.ts e2e/security-headers.spec.ts
 * Default `npm run test:e2e` uses `astro preview`, which does not send these headers — those runs skip this file.
 */
test.describe('Security headers (Firebase Hosting emulator only)', () => {
  test('homepage sends CSP and HSTS from firebase.json', async ({ request }) => {
    test.skip(
      process.env.PLAYWRIGHT_USE_FIREBASE_EMULATOR !== '1',
      'Run: npm run test:security-headers (or any test with -c playwright.hosting.config.ts)',
    );

    const res = await request.get('/');
    expect(res.status()).toBe(200);

    const csp = res.headers()['content-security-policy'] ?? '';
    expect(csp, 'Content-Security-Policy should be set').toMatch(/default-src/i);
    expect(csp).toMatch(/report-uri/i);
    expect(csp, 'Trusted Types should allow third-party policy names').toContain("trusted-types * 'allow-duplicates'");
    expect(csp, 'Trusted Types script sinks should stay enforced').toContain("require-trusted-types-for 'script'");
    expect(csp, 'Audit/lead forms may POST to the Lighthouse API host').toMatch(
      /form-action[^;]*lighthouse-audit--lighthouse-492701\.us-east4\.hosted\.app/,
    );

    const hsts = res.headers()['strict-transport-security'] ?? '';
    expect(hsts, 'HSTS should be set on global ** block').toMatch(/max-age/i);
  });
});
