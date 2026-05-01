import { expect, test } from "@playwright/test";
import { XSS_INJECTION_PAYLOADS } from "./helpers/audit-constants";

const TRACKING_COOKIE_MARKERS = ["_ga=", "_gid=", "__utm"];

test.describe("OWASP ZAP security carrier (report-only)", () => {
	test.describe.configure({ timeout: 120_000 });

	test("[HIGH] Form fuzz — SalesforceContactForm + lead-email JSON (AuditForm contract; traffic via ZAP when enabled)", async ({
		page,
		request,
		baseURL,
	}) => {
		await page.route("https://webto.salesforce.com/**", (route) =>
			route.fulfill({ status: 204, body: "" }),
		);
		await page.route("**/api/lead-email", (route) =>
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ ok: true }),
			}),
		);

		const fuzz = XSS_INJECTION_PAYLOADS.join("\n");

		await page.goto("/contact", {
			waitUntil: "networkidle",
			timeout: 120_000,
		});

		const cookieReject = page.locator("#cookie-consent-reject");
		if (await cookieReject.isVisible().catch(() => false)) {
			await cookieReject.click();
		}

		await page
			.locator("#main-content form")
			.first()
			.getByLabel(/^First Name$/i)
			.fill(fuzz);
		await page
			.locator("#main-content form")
			.first()
			.getByLabel(/^Email$/i)
			.fill("audit+fuzz@designedbyanthony.com");
		await page
			.locator("#main-content form")
			.first()
			.getByLabel(/^Phone$/i)
			.fill(fuzz);
		await page
			.locator("#main-content form")
			.first()
			.getByLabel(/^Website$/i)
			.fill(`https://example.com/${fuzz}`);
		await page
			.locator("#main-content form")
			.first()
			.getByLabel(/^Message$/i)
			.fill(fuzz);
		await page
			.locator("#main-content form")
			.first()
			.getByRole("button", { name: /submit|send/i })
			.click();

		/* Marketing `AuditForm` (`data-audit-form`) is not currently mounted on any route — same JSON contract as POST /api/lead-email (apps/web/src/components/marketing/AuditForm.tsx, apps/api/src/routes/leadEmail.ts). Use same origin as the webServer so fuzz traffic is never sent to production. */
		const leadUrl = new URL(
			"/api/lead-email",
			baseURL ?? "http://127.0.0.1:3001",
		).toString();
		const leadRes = await request.post(leadUrl, {
			headers: { "Content-Type": "application/json" },
			data: {
				first_name: fuzz,
				email: "audit+fuzz@designedbyanthony.com",
				website: `https://example.com/${fuzz}`,
				biggest_issue: fuzz,
				phone: fuzz,
				cta_source: "playwright_security_probe",
				page_context: "security-zap-audit.spec.ts",
				offer_type: "audit_request",
				lead_source: "playwright",
			},
		});
		expect(
			leadRes.status(),
			"[HIGH] lead-email probe should return a response",
		).toBeLessThan(600);

		await expect(page.locator("body")).toBeAttached();
	});

	test("[HIGH/MEDIUM] Header forensic — HSTS + CSP + X-Content-Type-Options", async ({
		request,
		baseURL,
	}, testInfo) => {
		const origin = baseURL ?? "http://127.0.0.1:3001";
		const res = await request.get(origin, { maxRedirects: 5 });
		const h = res.headers();

		const failures: string[] = [];
		const sts =
			h["strict-transport-security"] ?? h["Strict-Transport-Security"];
		if (!sts) {
			failures.push(
				"[MEDIUM] Missing Strict-Transport-Security — check static headers / middleware (apps/web/static-headers.json, middleware)",
			);
		} else {
			const l = sts.toLowerCase();
			if (!l.includes("preload")) {
				failures.push(
					`[MEDIUM] Strict-Transport-Security missing preload — got "${sts}"`,
				);
			}
		}

		const csp = h["content-security-policy"] ?? h["Content-Security-Policy"];
		if (!csp) {
			testInfo.annotations.push({
				type: "csp",
				description:
					"Missing Content-Security-Policy on this origin (expected for local next start; CSP is served at the Cloudflare edge via static-headers.json — apps/web/build/csp.mjs / sync:static-headers)",
			});
		}

		const xcto = h["x-content-type-options"] ?? h["X-Content-Type-Options"];
		if (!xcto || xcto.toLowerCase().trim() !== "nosniff") {
			failures.push(
				`[MEDIUM] X-Content-Type-Options not nosniff — got "${xcto ?? ""}"`,
			);
		}

		expect(
			failures.join("\n"),
			`Header forensic failures:\n${failures.join("\n")}`,
		).toBe("");
	});

	test("[HIGH] Privacy firewall — gtag consent denied + no tracking cookies until Accept", async ({
		browser,
		baseURL,
	}) => {
		const origin = baseURL ?? "http://127.0.0.1:3001";
		const ctx = await browser.newContext();
		const page = await ctx.newPage();

		await page.goto(origin, { waitUntil: "networkidle", timeout: 120_000 });

		const deniedOk = await page.evaluate(() => {
			const w = window as Window & {
				__dbaAnalyticsEnabled?: boolean;
				dataLayer?: unknown[];
				gtag?: (...a: unknown[]) => void;
			};
			if (w.__dbaAnalyticsEnabled !== false) return false;
			if (typeof w.gtag !== "function") return false;
			return true;
		});
		expect(
			deniedOk,
			"[HIGH] Pre-consent: window.__dbaAnalyticsEnabled must stay false and gtag must exist — apps/web/src/components/marketing/MarketingChrome.tsx:63-110",
		).toBe(true);

		const cookieStr = await page.evaluate(() => document.cookie);
		const leaked = TRACKING_COOKIE_MARKERS.filter((m) => cookieStr.includes(m));
		expect(
			leaked.join(", "),
			`[HIGH] Tracking cookies before Accept — MarketingChrome cookie banner — got cookies: ${cookieStr.slice(0, 200)}`,
		).toBe("");

		await page.locator("#cookie-consent-accept").click();
		await page.waitForTimeout(300);

		const enabled = await page.evaluate(() => {
			const w = window as Window & { __dbaAnalyticsEnabled?: boolean };
			return w.__dbaAnalyticsEnabled === true;
		});
		expect(
			enabled,
			"[LOGIC] After Accept, analytics enable hook should run — MarketingChrome.tsx cookie-consent-boot",
		).toBe(true);

		await ctx.close();
	});
});
