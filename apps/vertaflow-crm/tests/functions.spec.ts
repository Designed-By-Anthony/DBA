import { expect, test } from "@playwright/test";
import { pricingTiers } from "../src/lib/theme.config";

test.describe("⚙️ Function Tests (Core Utilities)", () => {
	test("Slug generation strips special characters and spaces", () => {
		// Replicating the logic from the dashboard
		const generateSlug = (name: string) =>
			name
				.toLowerCase()
				.trim()
				.replace(/[\s_]+/g, "-")
				.replace(/[^a-z0-9-]/g, "");

		expect(generateSlug("Nike Corp")).toBe("nike-corp");
		expect(generateSlug("Tony_Russo Landscaping!!!!")).toBe(
			"tony-russo-landscaping",
		);
		expect(generateSlug("  Whitespace  Company  ")).toBe("whitespace-company");
	});

	test("Pricing tiers exist and map to numeric values", () => {
		// Verifying theme.config.ts export
		expect(pricingTiers.length).toBeGreaterThan(0);

		const standardPricing = pricingTiers.find((t) => t.id === "seo_basic");
		expect(standardPricing).toBeDefined();
		expect(typeof standardPricing?.price).toBe("number");
	});
});
