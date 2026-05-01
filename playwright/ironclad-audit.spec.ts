import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import {
	BTN_OUTLINE_MARKERS,
	BTN_PRIMARY_MARKERS,
	BTN_SECONDARY_MARKERS,
	SLATE_FORBIDDEN,
} from "./helpers/audit-constants";
import { getAllMarketingPathnames } from "./lib/marketing-paths";

test.describe.configure({ mode: "serial", timeout: 180_000 });

const hammerWidth = 375;
const hammerHeight = 900;
const shotDir = join(process.cwd(), "test-results", "ironclad-screenshots");

function matchesAny(haystack: string, needles: readonly string[]): boolean {
	const h = haystack.replace(/\s+/g, " ");
	return needles.some((n) => h.includes(n.replace(/\s+/g, " ")));
}

test.describe("Ironclad Playwright audit (report-only)", () => {
	test.beforeAll(async () => {
		await mkdir(shotDir, { recursive: true });
	});

	test("Hammer viewport 375px — crawl, mobile nav close control, contact drawer", async ({
		page,
	}, testInfo) => {
		await page.setViewportSize({ width: hammerWidth, height: hammerHeight });

		const paths = getAllMarketingPathnames().filter((p) => p !== "/404");
		for (const path of paths) {
			const res = await page.goto(path, {
				waitUntil: "domcontentloaded",
				timeout: 120_000,
			});
			expect(
				res?.status(),
				`[LOGIC] ${path} navigation should not 5xx`,
			).toBeLessThan(500);
		}

		await page.goto("/", { waitUntil: "networkidle", timeout: 120_000 });

		const cookieReject = page.locator("#cookie-consent-reject");
		if (await cookieReject.isVisible().catch(() => false)) {
			await cookieReject.click();
		}

		const hamburger = page.locator("#hamburger-btn");
		await expect(hamburger).toBeVisible({ timeout: 15_000 });
		await hamburger.click();
		const closeNav = page.locator("#mobile-nav [data-mobile-nav-close]");
		await expect(closeNav).toBeVisible();
		await page.screenshot({
			path: join(shotDir, "mobile-nav-close-morph.png"),
			fullPage: true,
		});

		await closeNav.click();
		await expect(hamburger).toHaveAttribute("aria-expanded", "false");

		const contactTab = page.getByRole("button", { name: /^Contact$/i }).first();
		await contactTab.click();
		await page.waitForTimeout(400);
		await page.screenshot({
			path: join(shotDir, "site-contact-drawer.png"),
			fullPage: true,
		});

		testInfo.attachments.push({
			name: "mobile-nav-close-morph",
			path: join(shotDir, "mobile-nav-close-morph.png"),
			contentType: "image/png",
		});
		testInfo.attachments.push({
			name: "site-contact-drawer",
			path: join(shotDir, "site-contact-drawer.png"),
			contentType: "image/png",
		});
	});

	test("[VISUAL] FoundingPartnerSection background must not contain Slate rgba(11,17,30)", async ({
		page,
	}) => {
		await page.setViewportSize({ width: hammerWidth, height: hammerHeight });
		await page.goto("/", { waitUntil: "networkidle", timeout: 120_000 });

		const section = page.locator(
			'section[aria-labelledby="founding-partner-heading"]',
		);
		await expect(section).toBeVisible({ timeout: 20_000 });

		const stack = await section.evaluate((el) => {
			const own = window.getComputedStyle(el);
			let s = `${own.backgroundColor} ${own.backgroundImage}`;
			const before = window.getComputedStyle(el, "::before");
			s += ` ${before.backgroundColor} ${before.backgroundImage}`;
			const after = window.getComputedStyle(el, "::after");
			s += ` ${after.backgroundColor} ${after.backgroundImage}`;
			return s;
		});
		expect(
			stack.includes(SLATE_FORBIDDEN),
			`[VISUAL] FoundingPartnerSection computed background stack references forbidden Slate at apps/web/src/components/marketing/FoundingPartnerSection.tsx — stack sample: ${stack.slice(0, 280)}`,
		).toBe(false);
	});

	test("[VISUAL] CTA hierarchy — FoundingPartnerSection: only “Audit My Site” is btnPrimary", async ({
		page,
	}) => {
		await page.setViewportSize({ width: hammerWidth, height: hammerHeight });
		await page.goto("/", { waitUntil: "networkidle", timeout: 120_000 });

		const section = page.locator(
			'section[aria-labelledby="founding-partner-heading"]',
		);
		await expect(section).toBeVisible({ timeout: 20_000 });

		const interactive = section.locator("a, button");
		const count = await interactive.count();
		const failures: string[] = [];

		for (let i = 0; i < count; i++) {
			const el = interactive.nth(i);
			if (!(await el.isVisible().catch(() => false))) continue;
			const text = ((await el.innerText()) ?? "").trim();
			if (!text) continue;

			const audit = /audit my site/i.test(text);
			const style = await el.evaluate((node) => {
				const s = window.getComputedStyle(node);
				return `${s.backgroundImage} ${s.backgroundColor} ${s.boxShadow}`;
			});

			const isPrimary = matchesAny(style, BTN_PRIMARY_MARKERS);
			const isOutline = matchesAny(style, BTN_OUTLINE_MARKERS);
			const isSecondary = matchesAny(style, BTN_SECONDARY_MARKERS);

			if (audit && !isPrimary) {
				failures.push(
					`[VISUAL] “Audit My Site” missing btnPrimary markers — apps/web/src/components/marketing/FoundingPartnerSection.tsx — ${style.slice(0, 220)}`,
				);
			}
			if (!audit && isPrimary) {
				failures.push(
					`[VISUAL] Non-audit CTA has btnPrimary bronze stack: “${text.slice(0, 48)}” — apps/web/src/components/marketing/FoundingPartnerSection.tsx:104-110 — ${style.slice(0, 220)}`,
				);
			}
			if (!audit && !(isOutline || isSecondary)) {
				failures.push(
					`[VISUAL] Non-audit CTA is not outline/secondary by heuristic: “${text.slice(0, 48)}” — apps/web/src/components/marketing/FoundingPartnerSection.tsx — ${style.slice(0, 220)}`,
				);
			}
		}

		expect(
			failures.join("\n"),
			`CTA hierarchy failures:\n${failures.join("\n")}`,
		).toBe("");
	});

	test("[LOGIC] Mobile nav ×5 — aria-expanded toggles, no console errors", async ({
		page,
	}) => {
		await page.setViewportSize({ width: hammerWidth, height: hammerHeight });
		const errors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				errors.push(msg.text());
			}
		});
		page.on("pageerror", (err) => {
			errors.push(String(err));
		});

		await page.goto("/", { waitUntil: "networkidle", timeout: 120_000 });
		const hamburger = page.locator("#hamburger-btn");

		for (let n = 0; n < 5; n++) {
			await hamburger.click();
			await expect(hamburger).toHaveAttribute("aria-expanded", "true");
			await page.locator("[data-mobile-nav-close]").first().click();
			await expect(hamburger).toHaveAttribute("aria-expanded", "false");
		}

		expect(
			errors.join("\n"),
			`[LOGIC] Console errors during mobile nav toggles (BrandHeader hamburger apps/web/src/components/brand/BrandHeader.tsx:155-166, mobile-nav.ts): ${errors.join(" | ")}`,
		).toBe("");
	});
});
