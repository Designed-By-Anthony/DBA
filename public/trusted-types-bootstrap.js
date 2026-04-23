/**
 * Runs before the Next.js bundle so React can assign innerHTML when the browser
 * enforces Trusted Types (require-trusted-types-for / enterprise policies).
 * Mirrors the inline bootstrap in the marketing Next.js shell.
 */
(() => {
	if (
		typeof window === "undefined" ||
		!window.trustedTypes ||
		!window.trustedTypes.createPolicy
	) {
		return;
	}
	try {
		window.trustedTypes.createPolicy("default", {
			createHTML: (s) => s,
			createScript: (s) => s,
			createScriptURL: (s) => s,
		});
	} catch {
		/* duplicate policy name if already registered */
	}
})();
