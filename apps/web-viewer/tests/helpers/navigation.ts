import type { Page } from '@playwright/test';

/**
 * Next.js dev (Turbopack/HMR) keeps network connections open, so
 * `networkidle` often never resolves and can contribute to aborted navigations.
 * First compile on a cold server can exceed 30s — allow a generous timeout.
 */
/** Stable navigation for Next.js dev (admin, portal, marketing). Avoid `networkidle`. */
export async function gotoPage(
  page: Page,
  path: string,
  options?: { timeout?: number }
) {
  const timeout = options?.timeout ?? 180_000;
  return page.goto(path, {
    waitUntil: 'domcontentloaded',
    timeout,
  });
}

