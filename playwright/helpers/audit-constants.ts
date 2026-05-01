/**
 * Substrings from `apps/web/src/design-system/buttons.ts` — used to classify
 * computed `background` / `box-shadow` without importing app code into Playwright.
 */
export const BTN_PRIMARY_MARKERS = [
	"rgba(181, 138, 20, 1)",
	"rgba(181,138,20,1)",
	"rgb(181, 138, 20)",
	"rgb(181,138,20)",
] as const;

/** btnOutline — translucent dark + light border */
export const BTN_OUTLINE_MARKERS = [
	"rgba(9, 15, 28, 0.35)",
	"rgba(9,15,28,0.35)",
] as const;

/** btnSecondary — transparent */
export const BTN_SECONDARY_MARKERS = [
	"rgba(0, 0, 0, 0)",
	"transparent",
] as const;

export const SLATE_FORBIDDEN_MARKERS = [
	"rgba(11, 17, 30)",
	"rgba(11,17,30)",
	"rgb(11, 17, 30)",
	"rgb(11,17,30)",
] as const;

export const XSS_INJECTION_PAYLOADS = [
	`<script>alert(1)</script>`,
	`"><img src=x onerror=alert(1)>`,
	`'; DROP TABLE users; --`,
	`{{7*7}}`,
	`javascript:alert(1)`,
	`<svg/onload=alert(1)>`,
] as const;
