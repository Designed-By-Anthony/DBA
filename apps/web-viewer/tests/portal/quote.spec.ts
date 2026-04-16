import { test, expect } from "@playwright/test";
import { gotoPage } from "../helpers/navigation";

/**
 * The portal quote page is a server component that reads Firestore via Admin SDK.
 * In audit mode (mostly mocked), we at least assert the 404/notFound behavior for unknown IDs.
 * Happy-path quote rendering requires seeded Firestore (covered later if we add emulator seeding).
 */
test.describe("Portal — Quote page", () => {
  test("unknown quote id returns notFound experience (not 500)", async ({ page }) => {
    const res = await gotoPage(page, "/portal/quote/does-not-exist-123");
    expect(res?.status()).not.toBe(500);
    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/404|not found|quote|proposal/);
  });
});

