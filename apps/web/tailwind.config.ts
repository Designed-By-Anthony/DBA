import type { Config } from "tailwindcss";

/**
 * Tailwind v4 — supplemental JS config for tooling / IDE IntelliSense.
 *
 * **Canonical palette:** `apps/web/src/design-system/tokens.css` (`--accent-bronze`,
 * `--accent-bronze-rgb`). Utilities resolve via `@theme` in
 * `tailwind-v4-bridge.css` (`accent-bronze`, `accent-bronze-dark`, …).
 */
export default {
	content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
	theme: {
		extend: {
			colors: {
				"accent-bronze": "#D4AF37",
			},
		},
	},
} satisfies Config;
