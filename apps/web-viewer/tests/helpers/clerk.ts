import type { Page } from "@playwright/test";

/**
 * Clerk keyless / dev can stack modals (claim keys, Organizations required for
 * `useOrganization`, etc.). Dismiss them so E2E can interact with the page.
 */
export async function dismissClerkModals(page: Page): Promise<void> {
  for (let i = 0; i < 12; i++) {
    const removeSelf = page.locator("button").filter({ hasText: /remove it myself/i }).first();
    if (await removeSelf.isVisible().catch(() => false)) {
      await removeSelf.click({ timeout: 5_000 });
      await page.waitForTimeout(150);
      continue;
    }

    const backdrop = page.locator(".cl-modalBackdrop").first();
    if ((await backdrop.count()) === 0) break;

    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
  }
}

/** Re-run dismissal until `predicate` is true or `timeoutMs` elapses (async Clerk modals). */
export async function dismissClerkModalsUntil(
  page: Page,
  predicate: () => Promise<boolean>,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await dismissClerkModals(page);
    await page.waitForTimeout(250);
  }
}
