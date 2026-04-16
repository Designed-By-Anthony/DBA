import { test, expect } from '@playwright/test';
import { rejectCookieConsentIfPresent } from './helpers';
import { isConsoleMessageAllowed } from './console-allowlist';

/**
 * Runs only against Firebase Hosting emulator (real CSP headers).
 * Declines analytics so GTM does not load — keeps console closer to "ours only".
 * Third-party widgets (Turnstile) may still log; add allowlist entries only when justified.
 */
test.describe('Console / page errors (Hosting emulator, analytics declined)', () => {
  test.beforeEach(() => {
    test.skip(
      process.env.PLAYWRIGHT_USE_FIREBASE_EMULATOR !== '1',
      'Use: npm run test:security-headers or npm run test:e2e:hosting (playwright.hosting.config.ts)',
    );
  });

  test('critical routes: no uncaught errors; console errors are allowlisted only', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (!isConsoleMessageAllowed(text)) consoleErrors.push(text);
    });

    for (const path of ['/', '/contact', '/free-seo-audit']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await rejectCookieConsentIfPresent(page);
      await page.waitForLoadState('load');
    }

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([]);
    expect(
      consoleErrors,
      `Console errors (not allowlisted): ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });
});
