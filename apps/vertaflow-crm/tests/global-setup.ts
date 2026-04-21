import type { FullConfig } from "@playwright/test";

/**
 * When SKIP_WEBSERVER=1, Playwright does not start emulator + Next.
 * Fail fast with a clear message instead of ERR_CONNECTION_REFUSED on page.goto.
 */
export default async function globalSetup(config: FullConfig) {
	if (process.env.SKIP_WEBSERVER !== "1") return;

	const base =
		config.projects[0]?.use?.baseURL?.toString().replace(/\/$/, "") ??
		"http://localhost:3001";

	// Cold-start compiles (especially with Turbopack) can exceed 8s while the TCP listener is up.
	// When users run SKIP_WEBSERVER=1 they *expect* slow local boot to be tolerated.
	const maxWaitMs = 180_000;
	const perAttemptTimeoutMs = 30_000;
	const startedAt = Date.now();

	// Prefer a lightweight endpoint when present, but accept any successful TCP response.
	const probeUrls = [`${base}/manifest.webmanifest`, `${base}/`];

	while (Date.now() - startedAt < maxWaitMs) {
		for (const url of probeUrls) {
			try {
				const res = await fetch(url, {
					redirect: "manual",
					signal: AbortSignal.timeout(perAttemptTimeoutMs),
				});
				void res;
				return;
			} catch {
				// keep trying other probe URLs / retry loop
			}
		}
		await new Promise((r) => setTimeout(r, 2_000));
	}

	throw new Error(
		[
			`SKIP_WEBSERVER=1 but nothing is responding at ${base}.`,
			"Remove SKIP_WEBSERVER and run `pnpm test` (starts Next on :3001),",
			"or start manually with `NODE_ENV=test` and `.env.test`: `pnpm exec next dev -p 3001`.",
		].join(" "),
	);
}
