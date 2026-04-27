/**
 * Serves `dist/` with headers from `static-headers.json` (URL-path rules).
 * Used by Playwright "parity headers" runs.
 */

import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve as pathResolve } from "node:path";
import { fileURLToPath } from "node:url";
import { minimatch } from "minimatch";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");
const configPath = join(root, "static-headers.json");

const config = JSON.parse(readFileSync(configPath, "utf8"));
const hosting = config.hosting ?? {};
const redirects = Array.isArray(hosting.redirects) ? hosting.redirects : [];
const rewrites = Array.isArray(hosting.rewrites) ? hosting.rewrites : [];
const headerBlocks = Array.isArray(hosting.headers) ? hosting.headers : [];

const MIME = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".xml": "application/xml; charset=utf-8",
	".webp": "image/webp",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".svg": "image/svg+xml",
	".woff2": "font/woff2",
};

function applyRedirect(pathname) {
	for (const rule of redirects) {
		const src = rule.source?.replace(/^\//, "") ?? "";
		const dest = rule.destination;
		const type = typeof rule.type === "number" ? rule.type : 301;
		if (!src || !dest) continue;
		const noSlash = pathname.replace(/^\//, "");
		if (noSlash === src) {
			const location = dest.startsWith("/") ? dest : `/${dest}`;
			return { location, statusCode: type };
		}
	}
	return null;
}

function applyRewrite(pathname) {
	for (const rule of rewrites) {
		const src = rule.source;
		if (!src || !rule.destination) continue;
		if (src.endsWith("/**")) {
			const prefix = src.slice(0, -3);
			if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
				let dest = rule.destination;
				if (!dest.startsWith("/")) dest = `/${dest}`;
				return dest;
			}
		}
	}
	return pathname;
}

function resolveFile(pathname) {
	const clean = pathname.replace(/\/$/, "") || "/";
	if (clean === "/") {
		const idx = join(dist, "index.html");
		return existsSync(idx) ? idx : null;
	}

	const noSlash = clean.slice(1);
	const asFile = join(dist, `${noSlash}.html`);
	if (existsSync(asFile)) return pathResolve(asFile);
	const asIndex = join(dist, noSlash, "index.html");
	if (existsSync(asIndex)) return pathResolve(asIndex);

	const direct = join(dist, noSlash);
	if (existsSync(direct) && statSync(direct).isFile()) {
		const p = pathResolve(direct);
		if (!p.startsWith(pathResolve(dist))) return null;
		return p;
	}

	return null;
}

function pathMatchesBlock(pathname, block) {
	if (block.regex) {
		try {
			// nosemgrep: eslint.detect-non-literal-regexp
			return new RegExp(block.regex).test(pathname);
		} catch {
			return false;
		}
	}
	if (block.source) {
		return minimatch(pathname, block.source, { dot: true });
	}
	return false;
}

function headersForPath(pathname) {
	const out = {};
	for (const block of headerBlocks) {
		if (!pathMatchesBlock(pathname, block)) continue;
		const list = block.headers;
		if (!Array.isArray(list)) continue;
		for (const { key, value } of list) {
			if (key && value !== undefined) out[key] = value;
		}
	}
	return out;
}

const port = Number(process.env.PORT ?? "5500");
const host = process.env.HOST ?? "127.0.0.1";

createServer((req, res) => {
	try {
		const url = new URL(req.url ?? "/", `http://${host}`);
		let pathname = normalize(url.pathname);
		if (!pathname.startsWith("/")) pathname = `/${pathname}`;

		const redir = applyRedirect(pathname);
		if (redir) {
			res.writeHead(redir.statusCode, { Location: redir.location });
			res.end();
			return;
		}

		pathname = applyRewrite(pathname);

		const filePath = resolveFile(pathname);
		const extra = headersForPath(pathname);

		if (!filePath) {
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("Not Found");
			return;
		}

		const st = statSync(filePath);
		const ext = extname(filePath);
		const headers = {
			...extra,
			"Content-Length": st.size,
			"Content-Type": MIME[ext] ?? "application/octet-stream",
		};

		res.writeHead(200, headers);
		createReadStream(filePath).pipe(res);
	} catch (e) {
		res.writeHead(500, { "Content-Type": "text/plain" });
		res.end(String(e));
	}
}).listen(port, host, () => {
	console.error(`static-parity-server: http://${host}:${port} → ${dist}`);
});
