import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { dismissCookieConsentIfPresent } from "./helpers";

async function getBoundaryContrast(page: Page, selector: string) {
	return page.evaluate((target: string) => {
		const parseColor = (input: string | null) => {
			const match = input?.match(/rgba?\(([^)]+)\)/);
			if (!match) return null;
			const parts = match[1].split(",").map((part) => part.trim());
			const [r, g, b] = parts.slice(0, 3).map(Number);
			const a = parts[3] === undefined ? 1 : Number(parts[3]);
			return { r, g, b, a };
		};

		const srgb = (value: number) => {
			const normalized = value / 255;
			return normalized <= 0.03928
				? normalized / 12.92
				: ((normalized + 0.055) / 1.055) ** 2.4;
		};

		const luminance = ({ r, g, b }: { r: number; g: number; b: number }) =>
			0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);

		const blend = (
			foreground: { r: number; g: number; b: number; a?: number },
			background: { r: number; g: number; b: number },
		) => {
			const alpha = foreground.a ?? 1;
			return {
				r: foreground.r * alpha + background.r * (1 - alpha),
				g: foreground.g * alpha + background.g * (1 - alpha),
				b: foreground.b * alpha + background.b * (1 - alpha),
			};
		};

		const contrast = (
			first: { r: number; g: number; b: number },
			second: { r: number; g: number; b: number },
		) => {
			const firstLum = luminance(first);
			const secondLum = luminance(second);
			const lighter = Math.max(firstLum, secondLum);
			const darker = Math.min(firstLum, secondLum);
			return (lighter + 0.05) / (darker + 0.05);
		};

		const element = document.querySelector<HTMLElement>(target);
		if (!element) throw new Error(`Missing selector: ${target}`);

		const border = parseColor(getComputedStyle(element).borderTopColor);
		if (!border) throw new Error(`Missing border color for: ${target}`);

		const parent = element.parentElement ?? document.body;
		const background = parseColor(getComputedStyle(parent).backgroundColor) ??
			parseColor(getComputedStyle(document.body).backgroundColor) ?? {
				r: 15,
				g: 18,
				b: 24,
				a: 1,
			};

		return contrast(blend(border, background), {
			r: background.r,
			g: background.g,
			b: background.b,
		});
	}, selector);
}

test("reach-out sticky and modal controls meet non-text contrast minimum", async ({
	page,
}) => {
	await page.goto("/", { waitUntil: "domcontentloaded" });
	await dismissCookieConsentIfPresent(page);

	await expect(
		getBoundaryContrast(page, ".reach-out-sticky-btn"),
	).resolves.toBeGreaterThanOrEqual(3);

	await page.locator("#reachOutOpenBtn").click();
	await expect(
		getBoundaryContrast(page, ".reach-out-action-icon"),
	).resolves.toBeGreaterThanOrEqual(3);
});

test("report toolbar button boundaries meet non-text contrast minimum", async ({
	page,
}) => {
	await page.goto("/report?id=DBA-DESI6HSF", { waitUntil: "domcontentloaded" });
	await expect(
		getBoundaryContrast(page, ".toolbar-btn"),
	).resolves.toBeGreaterThanOrEqual(3);
});
