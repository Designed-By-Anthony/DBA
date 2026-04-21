import { expect, test } from "@playwright/test";

test("free audit page does not expose unlabeled inline SVGs", async ({
	page,
}) => {
	await page.goto("/free-seo-audit", { waitUntil: "domcontentloaded" });

	const unlabeledSvgCount = await page.evaluate(() => {
		const root = document.querySelector("[data-lh-audit]");
		if (!root) return 0;
		return Array.from(root.querySelectorAll("svg")).filter((svg) => {
			if (svg.closest(".cf-turnstile")) return false;
			const ariaHidden = svg.getAttribute("aria-hidden") === "true";
			const ariaLabel = svg.getAttribute("aria-label");
			const hasTitle = !!svg.querySelector("title");
			return !ariaHidden && !ariaLabel && !hasTitle;
		}).length;
	});

	expect(unlabeledSvgCount).toBe(0);
});
