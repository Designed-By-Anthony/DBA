import { constants } from "node:fs";
import { access, cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const appRoot = process.cwd();
const openNextDir = join(appRoot, ".open-next");
const workerEntry = join(openNextDir, "worker.js");
const assetsDir = join(openNextDir, "assets");
const pagesOutputDir = join(appRoot, ".pages-output");

async function assertExists(path) {
	await access(path, constants.F_OK);
}

async function main() {
	await assertExists(workerEntry);
	await assertExists(assetsDir);

	await rm(pagesOutputDir, { recursive: true, force: true });
	await mkdir(pagesOutputDir, { recursive: true });
	await cp(assetsDir, pagesOutputDir, { recursive: true });
	await cp(workerEntry, join(pagesOutputDir, "_worker.js"));
}

main().catch((error) => {
	console.error("[prepare-pages-bundle] Failed to prepare Cloudflare Pages bundle.");
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
