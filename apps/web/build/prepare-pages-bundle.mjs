import { constants } from "node:fs";
import {
	access,
	cp,
	mkdir,
	readdir,
	readFile,
	rename,
	rm,
	stat,
	unlink,
	writeFile,
} from "node:fs/promises";
import { dirname, join, relative } from "node:path";

/** Cloudflare Pages rejects individual static files larger than this (deploy validation). */
const PAGES_MAX_STATIC_ASSET_BYTES = 25 * 1024 * 1024;

const appRoot = process.cwd();
const openNextDir = join(appRoot, ".open-next");
const openNextAssetsDir = join(openNextDir, "assets");
const workerEntry = join(openNextDir, "worker.js");
const pagesOutputDir = join(appRoot, ".vercel/output/static");
const pagesWorkerDest = join(pagesOutputDir, "_worker.js");
const staticRouteHandlerPaths = ["rss.xml", "releases.xml", "site.webmanifest"];

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

async function writeTextAsset(path, contents) {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, contents);
}

function routePathFromCacheName(cacheName) {
	const routePath = cacheName.replace(/\.cache$/, "");
	return routePath === "index" ? "" : routePath;
}

async function materializePrerenderCache() {
	const buildId = (
		await readFile(join(openNextAssetsDir, "BUILD_ID"), "utf8")
	).trim();
	const cacheRoot = join(openNextDir, "cache", buildId);

	async function visit(dir) {
		const entries = await readdir(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = join(dir, entry.name);
			if (entry.isDirectory()) {
				await visit(fullPath);
				continue;
			}
			if (!entry.isFile() || !entry.name.endsWith(".cache")) continue;

			const cache = JSON.parse(await readFile(fullPath, "utf8"));
			const routePath = routePathFromCacheName(relative(cacheRoot, fullPath));

			if (cache.type === "app" && typeof cache.html === "string") {
				const htmlPath =
					routePath === ""
						? join(pagesOutputDir, "index.html")
						: join(pagesOutputDir, routePath, "index.html");
				await writeTextAsset(htmlPath, cache.html);

				if (typeof cache.rsc === "string") {
					const rscPath =
						routePath === ""
							? join(pagesOutputDir, "index.rsc")
							: join(pagesOutputDir, `${routePath}.rsc`);
					await writeTextAsset(rscPath, cache.rsc);
				}
				continue;
			}

			if (cache.type === "route" && typeof cache.body === "string") {
				await writeTextAsset(join(pagesOutputDir, routePath), cache.body);
			}
		}
	}

	await visit(cacheRoot);
}

async function materializeStaticRouteHandlers() {
	for (const routePath of staticRouteHandlerPaths) {
		const routeModulePath = new URL(
			`./.next/server/app/${routePath}/route.js`,
			`file://${appRoot}/`,
		);
		const routeModule = await import(routeModulePath.href);
		const handler = routeModule.default?.routeModule?.userland?.GET;
		if (typeof handler !== "function") {
			throw new Error(`Could not find static GET handler for /${routePath}.`);
		}

		const response = await handler();
		if (!(response instanceof Response)) {
			throw new Error(
				`Static GET handler for /${routePath} did not return a Response.`,
			);
		}

		await writeTextAsset(
			join(pagesOutputDir, routePath),
			await response.text(),
		);
	}
}

async function patchPagesWorkerStaticFallback() {
	const source = await readFile(pagesWorkerDest, "utf8");
	const helper = `const PAGES_INTERNAL_ASSET_PREFIXES = [
    "/.build/",
    "/assets/",
    "/cache/",
    "/cloudflare/",
    "/cloudflare-templates/",
    "/dynamodb-provider/",
    "/middleware/",
    "/server-functions/",
];
const PUBLIC_FILE_EXTENSION_PATTERN = /\\/[\\w.-]+\\.[a-z0-9][a-z0-9-]{0,15}$/i;
function isInternalPagesAsset(pathname) {
    if (PAGES_INTERNAL_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return true;
    }
    return false;
}
function staticAssetCandidates(request, includePrerenderedRoutes = false) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") {
        return [];
    }
    if (isInternalPagesAsset(url.pathname)) {
        return [];
    }
    if (url.pathname.startsWith("/_next/static/") || PUBLIC_FILE_EXTENSION_PATTERN.test(url.pathname)) {
        return [url.pathname];
    }
    if (!includePrerenderedRoutes) {
        return [];
    }
    const pathname = url.pathname.replace(/\\/$/, "");
    const routePath = pathname === "" ? "/index" : pathname;
    if (request.headers.get("rsc") === "1" || url.searchParams.has("_rsc")) {
        return [\`\${routePath}.rsc\`];
    }
    return [\`\${routePath}/index.html\`];
}
async function fetchPagesStaticAsset(request, env, assetPath) {
    const assetUrl = new URL(request.url);
    assetUrl.pathname = assetPath;
    assetUrl.search = "";
    return env.ASSETS.fetch(new Request(assetUrl, request));
}
async function maybeServePagesStaticAsset(request, env, includePrerenderedRoutes = false) {
    const candidates = staticAssetCandidates(request, includePrerenderedRoutes);
    if (candidates.length === 0) {
        return null;
    }
    if (typeof env?.ASSETS?.fetch !== "function") {
        return null;
    }
    for (const candidate of candidates) {
        const response = await fetchPagesStaticAsset(request, env, candidate);
        if (response.status !== 404) {
            if (candidate.endsWith(".rsc")) {
                const headers = new Headers(response.headers);
                headers.set("Content-Type", "text/x-component; charset=utf-8");
                headers.append("Vary", "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch");
                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers,
                });
            }
            return response;
        }
    }
    return null;
}
`;
	const withHelper = source.replace(
		"export default {",
		`${helper}export default {`,
	);
	if (withHelper === source) {
		throw new Error(
			"Could not inject Pages static asset helper into _worker.js.",
		);
	}

	const requestContext =
		"const url = new URL(request.url);\n            // Serve images in development.";
	let withFallback = withHelper.replace(
		requestContext,
		`${requestContext}
            const pagesStaticAssetResponse = await maybeServePagesStaticAsset(request, env);
            if (pagesStaticAssetResponse) {
                return pagesStaticAssetResponse;
            }
`,
	);
	if (withFallback === withHelper) {
		throw new Error(
			"Could not inject Pages static asset fallback into _worker.js.",
		);
	}

	const serverFunctionImport =
		'            // @ts-expect-error: resolved by wrangler build\n            const { handler } = await import("./server-functions/default/handler.mjs");';
	withFallback = withFallback.replace(
		serverFunctionImport,
		`            const prerenderedStaticResponse = await maybeServePagesStaticAsset(reqOrResp, env, true);
            if (prerenderedStaticResponse) {
                return prerenderedStaticResponse;
            }
${serverFunctionImport}`,
	);
	if (!withFallback.includes("prerenderedStaticResponse")) {
		throw new Error(
			"Could not inject Pages prerendered route fallback into _worker.js.",
		);
	}

	await writeFile(pagesWorkerDest, withFallback);
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
	await cp(openNextAssetsDir, pagesOutputDir, {
		recursive: true,
		force: true,
	});
	await materializePrerenderCache();
	await materializeStaticRouteHandlers();
	await patchPagesWorkerStaticFallback();

	await dropOversizedPagesAssets(pagesOutputDir);
}

main().catch((error) => {
	console.error(
		"[prepare-pages-bundle] Failed to prepare Cloudflare Pages bundle.",
	);
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
