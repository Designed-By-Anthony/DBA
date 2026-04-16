import { test, expect } from "@playwright/test";
import { gotoPage } from "../helpers/navigation";

/**
 * These pages are largely server-driven and may depend on server actions/Firestore.
 * For audit coverage, we assert they render a stable shell (no 500 / no Application Error)
 * and expose a primary heading or obvious UI landmark.
 */
test.describe("Admin — Missing page coverage (shell assertions)", () => {
  test("/admin/inbox shows heading", async ({ page }) => {
    const res = await gotoPage(page, "/admin/inbox");
    expect(res?.status()).not.toBe(500);
    await expect(page.locator("text=Application Error")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: /omnichannel inbox/i })).toBeVisible({
      timeout: 20_000,
    });
  });

  test("/admin/reports shows Reports heading", async ({ page }) => {
    const res = await gotoPage(page, "/admin/reports");
    expect(res?.status()).not.toBe(500);
    await expect(page.locator("text=Application Error")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: /^reports$/i })).toBeVisible({ timeout: 20_000 });
  });

  test("/admin/billing shows Billing heading", async ({ page }) => {
    const res = await gotoPage(page, "/admin/billing");
    expect(res?.status()).not.toBe(500);
    await expect(page.locator("text=Application Error")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: /billing/i })).toBeVisible({ timeout: 20_000 });
  });

  test("/admin/pricebook shows Stripe Price Book heading", async ({ page }) => {
    const res = await gotoPage(page, "/admin/pricebook");
    expect(res?.status()).not.toBe(500);
    await expect(page.locator("text=Application Error")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: /price book/i })).toBeVisible({ timeout: 20_000 });
  });

  test("/admin/calendar shows Calendar heading", async ({ page }) => {
    const res = await gotoPage(page, "/admin/calendar");
    expect(res?.status()).not.toBe(500);
    await expect(page.locator("text=Application Error")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: /calendar/i })).toBeVisible({ timeout: 20_000 });
  });

  test("/admin/kds shows KDS heading", async ({ page }) => {
    const res = await gotoPage(page, "/admin/kds");
    expect(res?.status()).not.toBe(500);
    await expect(page.locator("text=Application Error")).not.toBeVisible();
    await expect(page.getByText(/kds/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test("/admin/settings shows Agency Settings heading", async ({ page }) => {
    const res = await gotoPage(page, "/admin/settings");
    expect(res?.status()).not.toBe(500);
    await expect(page.locator("text=Application Error")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: /agency settings/i })).toBeVisible({ timeout: 20_000 });
  });

  test("/admin/settings/business shows Business Settings heading", async ({ page }) => {
    const res = await gotoPage(page, "/admin/settings/business");
    expect(res?.status()).not.toBe(500);
    await expect(page.locator("text=Application Error")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: /business settings/i })).toBeVisible({ timeout: 20_000 });
  });

  test("/admin/billing/upgrade shows Upgrade Required badge", async ({ page }) => {
    const res = await gotoPage(page, "/admin/billing/upgrade");
    expect(res?.status()).not.toBe(500);
    await expect(page.locator("text=Application Error")).not.toBeVisible();
    await expect(page.getByText(/upgrade required/i)).toBeVisible({ timeout: 20_000 });
  });
});

