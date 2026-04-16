import { test, expect } from "@playwright/test";
import { gotoPage } from "./helpers/navigation";

test.describe("Preview — customer web viewer", () => {
  test("demo preview renders without crashing", async ({ page }) => {
    const res = await gotoPage(page, "/preview/demo");
    expect(res?.status()).not.toBe(500);
    await expect(page.locator("text=Application Error")).not.toBeVisible();
  });

  test("unknown customer returns 404-ish experience (not 500)", async ({ page }) => {
    const res = await gotoPage(page, "/preview/this_customer_should_not_exist_123");
    expect(res?.status()).not.toBe(500);
    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/404|not found|preview|viewer/);
  });
});

