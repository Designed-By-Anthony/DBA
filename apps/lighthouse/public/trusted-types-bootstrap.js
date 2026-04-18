/**
 * Runs before the Next.js bundle so React can assign innerHTML when the browser
 * enforces Trusted Types (require-trusted-types-for / enterprise policies).
 * Mirrors the inline bootstrap on marketing (Layout.astro).
 */
(function () {
  if (typeof window === "undefined" || !window.trustedTypes || !window.trustedTypes.createPolicy) {
    return;
  }
  try {
    window.trustedTypes.createPolicy("default", {
      createHTML: function (s) {
        return s;
      },
      createScript: function (s) {
        return s;
      },
      createScriptURL: function (s) {
        return s;
      },
    });
  } catch {
    /* duplicate policy name if already registered */
  }
})();
