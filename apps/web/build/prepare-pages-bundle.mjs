import { constants } from "node:fs";
import {
	access,
	cp,
	mkdir,
	readdir,
	rename,
	rm,
	stat,
	unlink,
} from "node:fs/promises";
import { join, relative } from "node:path";

/** Cloudflare Pages rejects individual static files larger than this (deploy validation). */
const PAGES_MAX_STATIC_ASSET_BYTES = 25 * 1024 * 1024;

const appRoot = process.cwd();
const openNextDir = join(appRoot, ".open-next");
const workerEntry = join(openNextDir, "worker.js");
const pagesOutputDir = join(appRoot, ".vercel/output/static");
const pagesWorkerDest = join(pagesOutputDir, "_worker.js");

async function assertExists(path) {
	await access(path, constants.F_OK);
}

/**
 * Remove files over the Pages static asset cap so `wrangler pages deploy` can validate the bundle.
 * Large media should be hosted on R2, Stream, or another origin — not copied as Pages assets.
 */
async function dropOversizedPagesAssets(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			await dropOversizedPagesAssets(fullPath);
			continue;
		}
		if (!entry.isFile()) continue;

		const { size } = await stat(fullPath);
		if (size <= PAGES_MAX_STATIC_ASSET_BYTES) continue;

		const rel = relative(appRoot, fullPath);
		console.warn(
			`[prepare-pages-bundle] Dropping ${rel} (${(size / (1024 * 1024)).toFixed(1)} MiB): exceeds Cloudflare Pages ${PAGES_MAX_STATIC_ASSET_BYTES / (1024 * 1024)} MiB limit`,
		);
		await unlink(fullPath);
	}
}

async function main() {
	await assertExists(workerEntry);
	await assertExists(openNextDir);

	await rm(pagesOutputDir, { recursive: true, force: true });
	await mkdir(pagesOutputDir, { recursive: true });

	/**
	 * Copy the full OpenNext output tree. `_worker.js` imports `./cloudflare/*`,
	 * `./middleware/*`, `./server-functions/*`, and `./.build/*` — those paths must exist
	 * next to the worker entry or Wrangler's bundler fails at deploy time.
	 */
	await cp(openNextDir, pagesOutputDir, { recursive: true });

	await rename(join(pagesOutputDir, "worker.js"), pagesWorkerDest);

	await dropOversizedPagesAssets(pagesOutputDir);
}

main().catch((error) => {
	console.error(
		"[prepare-pages-bundle] Failed to prepare Cloudflare Pages bundle.",
	);
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
