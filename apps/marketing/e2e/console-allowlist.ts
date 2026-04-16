/**
 * Console messages that are ignored in e2e/console-hosting.spec.ts (third-party or benign).
 * Tighten this list as you remove sources of noise; do not blanket-ignore all errors.
 */
export const CONSOLE_ALLOWLIST: RegExp[] = [
  /Failed to load resource.*(favicon|\.woff2)/i,
  /ResizeObserver loop/i,
];

export function isConsoleMessageAllowed(text: string): boolean {
  return CONSOLE_ALLOWLIST.some((re) => re.test(text));
}
