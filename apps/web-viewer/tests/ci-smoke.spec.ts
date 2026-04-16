import { test, expect } from "@playwright/test";

/**
 * CI-safe smoke: no Firebase emulators required.
 * Use with env: E2E_NO_FIRESTORE_EMULATOR=1
 */
test.describe("CI smoke (no emulators)", () => {
  test.setTimeout(5 * 60 * 1000);

  test("home page responds and includes hardening headers", async ({ request }) => {
    const res = await request.get("/");
    expect(res.status()).not.toBe(500);
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    expect(res.headers()["content-security-policy"]).toContain("default-src 'self'");
  });

  test("admin SQL metadata route is auth-gated", async ({ request }) => {
    const res = await request.get("/api/admin/tenant-vertical");
    expect([401, 503]).toContain(res.status());
  });

  test("admin domains route is auth-gated", async ({ request }) => {
    const res = await request.get("/api/admin/domains");
    expect([401, 503]).toContain(res.status());
  });

  test("public portal branding API responds", async ({ request }) => {
    const res = await request.get("/api/portal/branding");
    expect(res.status()).toBe(200);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data.brandName).toBeTruthy();
    expect(data.verticalTemplate).toBeTruthy();
  });
});

