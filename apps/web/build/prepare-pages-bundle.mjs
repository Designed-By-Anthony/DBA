import { constants } from "node:fs";
import { access, cp, mkdir, rename, rm } from "node:fs/promises";
import { join } from "node:path";

const appRoot = process.cwd();
const openNextDir = join(appRoot, ".open-next");
const workerEntry = join(openNextDir, "worker.js");
const pagesOutputDir = join(appRoot, ".vercel/output/static");

async function assertExists(path) {
	await access(path, constants.F_OK);
}

async function main() {
	await assertExists(workerEntry);
	await assertExists(join(openNextDir, "assets"));

	// Cloudflare Pages expects `_worker.js` next to every module it imports.
	// Copy the full OpenNext bundle (not only `assets/`), then rename the worker entry.
	await rm(pagesOutputDir, { recursive: true, force: true });
	await mkdir(pagesOutputDir, { recursive: true });
	await cp(openNextDir, pagesOutputDir, { recursive: true });
	await rename(
		join(pagesOutputDir, "worker.js"),
		join(pagesOutputDir, "_worker.js"),
	);
}

main().catch((error) => {
	console.error(
		"[prepare-pages-bundle] Failed to prepare Cloudflare Pages bundle.",
	);
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
