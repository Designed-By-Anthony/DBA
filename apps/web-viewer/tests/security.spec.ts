import { test, expect } from "@playwright/test";

/**
 * Contract tests for auth boundaries and transport hardening.
 *
 * Known gaps (enforce in app code, not only here):
 * - `GET/PATCH /api/admin/tickets` — Firestore-backed; currently no Clerk check (see launch security audit).
 * - E2E runs with `SKIP_ENV_VALIDATION` / emulators; production uses Clerk + Cloud SQL as documented in the launch plan.
 *
 * Webhook signing for Clerk/Stripe/Calendly lives in `tests/webhooks.spec.ts` (run `test:e2e:smoke` to include it).
 */
test.describe("Security — Clerk-protected admin APIs", () => {
  test("GET /api/admin/tenant-vertical returns 401 without a session", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/tenant-vertical");
    expect(res.status()).toBe(401);
    await expect(res.json()).resolves.toEqual({ vertical: null });
  });

  test("GET /api/admin/domains returns 401 without a session", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/domains");
    expect(res.status()).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});

test.describe("Security — authenticated webhooks", () => {
  test("POST /api/webhooks/lead rejects missing/invalid secret", async ({
    request,
  }) => {
    const res = await request.post("/api/webhooks/lead", {
      data: { name: "x", email: "x@y.com" },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: "Unauthorized" });
  });

});

test.describe("Security — public ingest hardening", () => {
  test("POST /api/lead rejects empty body without 500", async ({
    request,
  }) => {
    const res = await request.post("/api/lead", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).not.toBe(500);
    expect([400, 403, 404]).toContain(res.status());
  });

  test("GET /api/webhooks/lead does not expose agency resolution without secret", async ({
    request,
  }) => {
    const res = await request.get("/api/webhooks/lead");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.secretOk).toBe(false);
    expect(body).not.toHaveProperty("resolvedAgencyId");
  });
});

test.describe("Security — HTTP response baseline", () => {
  test("document HTML responses include core hardening headers", async ({
    request,
  }) => {
    const res = await request.get("/");
    expect(res.status()).not.toBe(500);
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    const xfo = res.headers()["x-frame-options"];
    expect(xfo?.toLowerCase()).toMatch(/sameorigin|deny/);
    const csp = res.headers()["content-security-policy"];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
  });

  test("public branding JSON does not echo credential-like strings", async ({
    request,
  }) => {
    const res = await request.get("/api/portal/branding");
    expect(res.status()).toBe(200);
    const raw = await res.text();
    expect(raw).not.toMatch(/sk_live_[a-zA-Z0-9]+/);
    expect(raw).not.toMatch(/sk_test_[a-zA-Z0-9]{10,}/);
    expect(raw.toLowerCase()).not.toContain("database_url");
  });
});
