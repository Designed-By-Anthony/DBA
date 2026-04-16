import type { Page } from '@playwright/test';

/** In-house consent banner; must be dismissed before clicking lower-z elements (e.g. reach-out sticky). */
export async function dismissCookieConsentIfPresent(page: Page): Promise<void> {
  const accept = page.locator('#cookie-consent-accept');
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
    await page.locator('#cookie-consent-root').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  }
}

/** Decline analytics so GTM does not load — use for CSP/console tests to reduce third-party noise. */
export async function rejectCookieConsentIfPresent(page: Page): Promise<void> {
  const reject = page.locator('#cookie-consent-reject');
  if (await reject.isVisible().catch(() => false)) {
    await reject.click();
    await page.locator('#cookie-consent-root').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  }
}
