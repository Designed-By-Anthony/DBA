import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const defaultZapBase = "http://127.0.0.1:8080";
const defaultAllowedTargets = new Set([
	"localhost",
	"127.0.0.1",
	"designedbyanthony.com",
	"www.designedbyanthony.com",
]);

function isLoopbackHost(hostname: string): boolean {
	return (
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		hostname === "::1"
	);
}

function zapBaseUrl(): string {
	const raw = (process.env.ZAP_BASE_URL ?? defaultZapBase).replace(/\/$/, "");
	const parsed = new URL(raw);
	if (
		process.env.ZAP_ALLOW_REMOTE !== "true" &&
		!isLoopbackHost(parsed.hostname)
	) {
		throw new Error(
			`Unsafe ZAP_BASE_URL host "${parsed.hostname}". Set ZAP_ALLOW_REMOTE=true to override.`,
		);
	}
	return parsed.toString().replace(/\/$/, "");
}

async function zapJson<T>(
	path: string,
	params: Record<string, string>,
): Promise<T> {
	const key = process.env.ZAP_API_KEY;
	if (!key) {
		throw new Error("ZAP_API_KEY is required when PLAYWRIGHT_ZAP=1");
	}
	const u = new URL(path, `${zapBaseUrl()}/`);
	u.searchParams.set("apikey", key);
	for (const [k, v] of Object.entries(params)) {
		u.searchParams.set(k, v);
	}
	const res = await fetch(u);
	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(
			`ZAP request failed ${res.status} ${u.pathname}: ${body.slice(0, 400)}`,
		);
	}
	return res.json() as Promise<T>;
}

async function zapOther(
	path: string,
	params: Record<string, string>,
): Promise<string> {
	const key = process.env.ZAP_API_KEY;
	if (!key) {
		throw new Error("ZAP_API_KEY is required when PLAYWRIGHT_ZAP=1");
	}
	const u = new URL(path, `${zapBaseUrl()}/`);
	u.searchParams.set("apikey", key);
	for (const [k, v] of Object.entries(params)) {
		u.searchParams.set(k, v);
	}
	const res = await fetch(u);
	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(`ZAP report failed ${res.status}: ${body.slice(0, 400)}`);
	}
	return res.text();
}

async function waitSpiderComplete(scanId: string): Promise<void> {
	const deadline = Date.now() + 300_000;
	while (Date.now() < deadline) {
		const key = process.env.ZAP_API_KEY;
		if (!key) throw new Error("ZAP_API_KEY is required when PLAYWRIGHT_ZAP=1");
		const u = new URL("/JSON/spider/view/status/", `${zapBaseUrl()}/`);
		u.searchParams.set("apikey", key);
		u.searchParams.set("scanId", scanId);
		const res = await fetch(u);
		if (!res.ok) throw new Error(`ZAP spider status ${res.status}`);
		const data = (await res.json()) as { status?: string };
		const pct = Number(data.status ?? "0");
		if (pct >= 100) return;
		await new Promise((r) => setTimeout(r, 1500));
	}
	throw new Error("ZAP spider timed out after 5 minutes");
}

async function waitPassiveScanIdle(): Promise<void> {
	const deadline = Date.now() + 300_000;
	while (Date.now() < deadline) {
		const data = await zapJson<{ recordsToScan?: string }>(
			"/JSON/pscan/view/recordsToScan/",
			{},
		);
		const left = Number(data.recordsToScan ?? "0");
		if (left <= 0) return;
		await new Promise((r) => setTimeout(r, 2000));
	}
	throw new Error("ZAP passive scan timed out after 5 minutes");
}

/**
 * After Playwright has driven the app through a proxy, extend coverage with a
 * ZAP spider from the same origin and write HTML + JSON reports under test-results/zap/.
 */
export async function runZapSpiderAndReport(seedUrl: string): Promise<void> {
	const seed = new URL(seedUrl);
	if (seed.protocol !== "http:" && seed.protocol !== "https:") {
		throw new Error(`Unsupported crawl protocol: ${seed.protocol}`);
	}
	const allowedTargets = new Set(defaultAllowedTargets);
	const configuredTargets = process.env.ZAP_ALLOWED_TARGET_HOSTS ?? "";
	for (const host of configuredTargets.split(",")) {
		const normalized = host.trim().toLowerCase();
		if (normalized) allowedTargets.add(normalized);
	}
	if (!allowedTargets.has(seed.hostname.toLowerCase())) {
		throw new Error(
			`Refusing to spider unapproved host "${seed.hostname}". Add it to ZAP_ALLOWED_TARGET_HOSTS.`,
		);
	}

	const maxChildren = process.env.ZAP_SPIDER_MAX_CHILDREN ?? "12";
	const spiderStart = await zapJson<{ scan?: string }>(
		"/JSON/spider/action/scan/",
		{
			url: seedUrl,
			maxChildren,
		},
	);
	const scanId = spiderStart.scan;
	if (scanId === undefined) {
		throw new Error(
			`Unexpected ZAP spider response: ${JSON.stringify(spiderStart)}`,
		);
	}
	await waitSpiderComplete(scanId);
	await waitPassiveScanIdle();

	const outDir = join(process.cwd(), "test-results", "zap");
	await mkdir(outDir, { recursive: true });
	const html = await zapOther("/OTHER/core/other/htmlreport/", {});
	await writeFile(join(outDir, "report.html"), html, "utf8");
	const json = await zapOther("/OTHER/core/other/jsonreport/", {});
	await writeFile(join(outDir, "report.json"), json, "utf8");
}
