/**
 * First-party cookie / storage consent for this app (replaces third-party CMP).
 * Preference is stored in localStorage only (no CookieYes).
 */

export const COOKIE_CONSENT_STORAGE_KEY = "dba_cookie_consent_v1";

export type StoredCookieConsent = {
  /** Optional analytics & monitoring (e.g. Sentry replay, traces, logs). */
  analytics: boolean;
  decidedAt: string;
};

export function readStoredConsent(): StoredCookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<StoredCookieConsent>;
    if (typeof p.analytics !== "boolean" || typeof p.decidedAt !== "string") {
      return null;
    }
    return { analytics: p.analytics, decidedAt: p.decidedAt };
  } catch {
    return null;
  }
}

export function writeConsent(analytics: boolean): void {
  const payload: StoredCookieConsent = {
    analytics,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(payload));
}

/** Whether the user has completed the consent prompt at least once. */
export function hasConsentDecision(): boolean {
  return readStoredConsent() !== null;
}

/** Analytics / monitoring features (non-essential) are allowed. */
export function analyticsAllowed(): boolean {
  return readStoredConsent()?.analytics === true;
}
