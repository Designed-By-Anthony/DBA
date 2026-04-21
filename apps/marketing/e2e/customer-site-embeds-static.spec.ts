import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Page, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appsRoot = path.join(__dirname, "..", "..");
const embedPackRoot = path.join(appsRoot, "customer-site-embeds");
const vertaflowEmbedPath = path.join(
	appsRoot,
	"vertaflow",
	"embed",
	"lead-form.html",
);

function loadPortableHtml(relativePath: string, crmOrigin: string): string {
	const full = path.join(embedPackRoot, relativePath);
	const raw = readFileSync(full, "utf8");
	return raw
		.replaceAll("REPLACE_CRM_ORIGIN", crmOrigin)
		.replaceAll("REPLACE_AGENCY_ID", "org_e2e_portable_embed")
		.replaceAll(
			"REPLACE_TURNSTILE_SITE_KEY",
			"1x0000000000000000000000000000000AA",
		);
}

async function mockTurnstileApiJs(page: Page): Promise<void> {
	await page.route("**/turnstile/v0/api.js*", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/javascript",
			body: "",
		});
	});
}

/**
 * Portable HTML loads Turnstile from a stubbed `api.js`; install the mock **after**
 * `setContent` so it wins over any late script evaluation order.
 */
async function installTurnstileMockAfterContent(page: Page): Promise<void> {
	await page.evaluate(() => {
		const win = window as unknown as Window &
			Record<string, (t: string) => void>;
		win.turnstile = {
			execute(el: Element) {
				window.queueMicrotask(() => {
					const name = el.getAttribute("data-callback");
					const fn = name ? win[name] : undefined;
					if (typeof fn === "function") fn("e2e-mock-turnstile-token");
				});
			},
			reset() {},
		};
	});
}

async function armLeadCapture(
	page: Page,
): Promise<{ body: () => Promise<Record<string, unknown> | null> }> {
	let posted: Record<string, unknown> | null = null;
	await page.route(
		(url) => url.pathname.endsWith("/api/lead"),
		async (route) => {
			if (route.request().method() !== "POST") {
				await route.fallback();
				return;
			}
			try {
				posted = route.request().postDataJSON() as Record<string, unknown>;
			} catch {
				posted = null;
			}
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					success: true,
					ok: true,
					prospectId: "e2e-prospect",
				}),
			});
		},
	);
	return {
		body: async () => posted,
	};
}

test.describe("Customer-site embed pack — static studio portable form", () => {
	test("submits JSON with studio lane + fingerprint wrapper in DOM", async ({
		page,
	}) => {
		const crm = "https://e2e-lead.test";
		const html = loadPortableHtml(
			"designed-by-anthony-studio/lead-form-portable.html",
			crm,
		);
		await mockTurnstileApiJs(page);
		const cap = await armLeadCapture(page);
		await page.setContent(html, { waitUntil: "load" });
		await installTurnstileMockAfterContent(page);

		const root = page.locator("#dba-portable-lead");
		await expect(root).toHaveAttribute(
			"data-dba-embed-pack",
			"dba-customer-embed-pack-v1",
		);
		await expect(root).toHaveAttribute("data-embed-lane", "dba_studio");

		await page.locator('input[name="name"]').fill("E2E Studio");
		await page
			.locator('input[name="email"]')
			.fill(`e2e-studio-${Date.now()}@example.com`);
		await page
			.locator('textarea[name="message"]')
			.fill("Playwright portable embed — studio lane.");
		await page.locator("#dba-portable-submit").click();

		await expect.poll(async () => cap.body()).not.toBeNull();
		const payload = (await cap.body())!;
		expect(payload.offer_type).toBe("dba_studio_portable_embed");
		expect(payload.agencyId).toBe("org_e2e_portable_embed");
		expect(payload.cta_source).toBe("customer_site_embed");
		expect(payload.cfTurnstileResponse).toBe("e2e-mock-turnstile-token");

		const sig = await page.evaluate(
			() =>
				(
					window as unknown as {
						__DBA_CUSTOMER_EMBED_SIGNAL__?: { lane?: string };
					}
				).__DBA_CUSTOMER_EMBED_SIGNAL__?.lane,
		);
		expect(sig).toBe("dba_studio_portable_embed");
	});
});

test.describe("Customer-site embed pack — static VertaFlow portable form", () => {
	test("submits JSON with product lane + vertical in source", async ({
		page,
	}) => {
		const crm = "https://e2e-lead.test";
		const html = loadPortableHtml(
			"vertaflow-product/lead-form-portable.html",
			crm,
		);
		await mockTurnstileApiJs(page);
		const cap = await armLeadCapture(page);
		await page.setContent(html, { waitUntil: "load" });
		await installTurnstileMockAfterContent(page);

		const root = page.locator("#vf-portable-lead");
		await expect(root).toHaveAttribute("data-embed-lane", "vertaflow_product");

		await page.locator('input[name="name"]').fill("E2E VertaFlow");
		await page
			.locator('input[name="email"]')
			.fill(`e2e-vf-${Date.now()}@example.com`);
		await page.locator('select[name="vertical"]').selectOption("restaurant");
		await page
			.locator('textarea[name="message"]')
			.fill("Playwright portable embed — product lane.");
		await page.locator("#vf-portable-submit").click();

		await expect.poll(async () => cap.body()).not.toBeNull();
		const payload = (await cap.body())!;
		expect(payload.offer_type).toBe("vertaflow_product_portable_embed");
		expect(String(payload.source)).toContain("vertaflow_product");
		expect(String(payload.source)).toContain("restaurant");

		const sig = await page.evaluate(
			() =>
				(
					window as unknown as {
						__DBA_CUSTOMER_EMBED_SIGNAL__?: { lane?: string };
					}
				).__DBA_CUSTOMER_EMBED_SIGNAL__?.lane,
		);
		expect(sig).toBe("vertaflow_product_portable_embed");
	});
});

test.describe("Customer-site embed pack — Calendly wrappers", () => {
	test("studio calendar iframe carries UTM + fingerprint data attributes", async ({
		page,
	}) => {
		const html = readFileSync(
			path.join(embedPackRoot, "calendar/calendly-web-design-consult.html"),
			"utf8",
		);
		await page.setContent(`<!DOCTYPE html><html><body>${html}</body></html>`, {
			waitUntil: "load",
		});
		const wrap = page.locator(".dba-calendly-embed");
		await expect(wrap).toHaveAttribute("data-dba-embed-kind", "calendly");
		await expect(wrap).toHaveAttribute(
			"data-dba-embed-pack",
			"dba-customer-embed-pack-v1",
		);
		const iframe = wrap.locator("iframe");
		await expect(iframe).toHaveAttribute(
			"src",
			/calendly\.com\/anthony-designedbyanthony\/web-design-consult/,
		);
		await expect(iframe).toHaveAttribute(
			"src",
			/utm_source=customer_site_embed/,
		);
		const fp = await page.evaluate(
			() =>
				(
					window as unknown as {
						__DBA_CUSTOMER_EMBED_SIGNAL__?: { lane?: string };
					}
				).__DBA_CUSTOMER_EMBED_SIGNAL__?.lane,
		);
		expect(fp).toBe("calendly_dba_studio");
	});

	test("VertaFlow placeholder calendar keeps fingerprint + placeholder slug in src", async ({
		page,
	}) => {
		const html = readFileSync(
			path.join(
				embedPackRoot,
				"calendar/calendly-vertaflow-intro-placeholder.html",
			),
			"utf8",
		);
		await page.setContent(`<!DOCTYPE html><html><body>${html}</body></html>`, {
			waitUntil: "load",
		});
		await expect(page.locator(".vf-calendly-embed")).toHaveAttribute(
			"data-dba-product",
			"VertaFlow",
		);
		const src = await page
			.locator(".vf-calendly-embed iframe")
			.getAttribute("src");
		expect(src).toContain("YOUR_CALENDLY_USER");
		expect(src).toContain("utm_campaign=vertaflow_portable_pack");
		const fp = await page.evaluate(
			() =>
				(
					window as unknown as {
						__DBA_CUSTOMER_EMBED_SIGNAL__?: { lane?: string };
					}
				).__DBA_CUSTOMER_EMBED_SIGNAL__?.lane,
		);
		expect(fp).toBe("calendly_vertaflow_product");
	});
});

test.describe("VertaFlow repo canonical embed (lead-form.html)", () => {
	test("DOM fingerprints + submit posts vertaflow_embed contract to CRM endpoint", async ({
		page,
	}) => {
		const raw = readFileSync(vertaflowEmbedPath, "utf8");
		const html = raw.replaceAll(
			"REPLACE_CLERK_ORG_FOR_VERTAFLOW_MASTER",
			"org_e2e_vf_repo_embed",
		);
		const cap = await armLeadCapture(page);
		await page.setContent(html, { waitUntil: "load" });

		const root = page.locator("#vf-lead-form");
		await expect(root).toHaveAttribute(
			"data-dba-embed-pack",
			"dba-customer-embed-pack-v1",
		);
		await expect(root).toHaveAttribute("data-vertaflow-form", "lead-capture");

		await page.locator("#vf-name").fill("E2E VertaFlow embed");
		await page
			.locator("#vf-email")
			.fill(`e2e-vf-embed-${Date.now()}@example.com`);
		await page.locator("#vf-service").selectOption("crm-setup");
		await page.locator("#vf-submit-btn").click();

		await expect.poll(async () => cap.body()).not.toBeNull();
		const payload = (await cap.body())!;
		expect(payload.offer_type).toBe("vertaflow_embed_lead_form");
		expect(payload.agencyId).toBe("org_e2e_vf_repo_embed");
		expect(payload.cta_source).toBe("third_party_site_embed");

		const fp = await page.evaluate(
			() =>
				(
					window as unknown as {
						__DBA_CUSTOMER_EMBED_SIGNAL__?: { lane?: string };
					}
				).__DBA_CUSTOMER_EMBED_SIGNAL__?.lane,
		);
		expect(fp).toBe("vertaflow_repo_embed");
	});
});

test.describe("Customer-site embed pack — tech-trace head snippet", () => {
	test("exposes meta fingerprint, JSON-LD, and window signal when mounted in head", async ({
		page,
	}) => {
		const head = readFileSync(
			path.join(embedPackRoot, "tech-trace-snippet.html"),
			"utf8",
		);
		const doc = `<!DOCTYPE html><html><head>${head}</head><body><p>trace</p></body></html>`;
		await page.setContent(doc, { waitUntil: "load" });
		await expect(
			page.locator('meta[name="dba-embed-pack-fingerprint"]'),
		).toHaveAttribute("content", "dba-customer-embed-pack-v1");
		await expect(page.locator('meta[name="generator"]')).toHaveAttribute(
			"content",
			/Designed by Anthony/,
		);
		const ldRaw = await page
			.locator('script[type="application/ld+json"]')
			.textContent();
		expect(ldRaw).toContain("dba-customer-embed-pack-v1");
		expect(ldRaw).toContain("VertaFlow");
		const sig = await page.evaluate(
			() =>
				(
					window as unknown as {
						__DBA_CUSTOMER_EMBED_SIGNAL__?: { stack?: string[] };
					}
				).__DBA_CUSTOMER_EMBED_SIGNAL__?.stack,
		);
		expect(sig).toContain("Calendly");
	});
});
