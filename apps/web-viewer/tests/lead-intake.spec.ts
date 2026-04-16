import { test, expect } from "@playwright/test";

/**
 * Lead intake — public `/api/lead` + secret `/api/webhooks/lead`.
 * Uses LEAD_WEBHOOK_SECRET from .env.test / .env.local (see playwright.config dotenv).
 */
const leadSecret = () => process.env.LEAD_WEBHOOK_SECRET || "dba-lead-hook-2026";

test.describe("Lead intake API", () => {
  test("GET /api/lead describes public ingest", async ({ request }) => {
    const res = await request.get("/api/lead");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.endpoint).toBe("public-lead-ingest");
  });

  test("OPTIONS /api/lead returns 204 with CORS headers", async ({ request }) => {
    const res = await request.fetch("/api/lead", { method: "OPTIONS" });
    expect(res.status()).toBe(204);
    expect(res.headers()["access-control-allow-origin"]).toBeDefined();
  });

  test("POST /api/lead creates prospect (no client secret)", async ({ request }) => {
    const email = `e2e-public-${Date.now()}@example.com`;
    const res = await request.post("/api/lead", {
      data: {
        name: "E2E Public Lead",
        email,
        source: "playwright",
        message: "public ingest test",
        _hp: "",
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.prospectId).toBeTruthy();
    expect(data.agencyId).toBeDefined();
  });

  test("POST /api/lead returns 400 without name", async ({ request }) => {
    const res = await request.post("/api/lead", {
      data: { email: "only@example.com", _hp: "" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/lead honeypot _hp non-empty returns 200 without throwing", async ({
    request,
  }) => {
    const res = await request.post("/api/lead", {
      data: {
        name: "Bot",
        email: "bot@example.com",
        _hp: "filled-by-bot",
      },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test("GET /api/webhooks/lead without secret: secretOk false", async ({ request }) => {
    const res = await request.get("/api/webhooks/lead");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.secretOk).toBe(false);
  });

  test("GET /api/webhooks/lead with secret: secretOk and resolvedAgencyId", async ({
    request,
  }) => {
    const res = await request.get("/api/webhooks/lead", {
      headers: { "x-webhook-secret": leadSecret() },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.secretOk).toBe(true);
    expect(data.resolvedAgencyId).toBeDefined();
  });

  test("POST /api/webhooks/lead without secret returns 401", async ({ request }) => {
    const res = await request.post("/api/webhooks/lead", {
      data: { name: "X", email: "x@y.com" },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/webhooks/lead ping does not create prospect", async ({ request }) => {
    const res = await request.post("/api/webhooks/lead", {
      data: { ping: true, secret: leadSecret() },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.ping).toBe(true);
    expect(data.ok).toBe(true);
  });

  test("POST /api/webhooks/lead with secret creates prospect (audit-style payload)", async ({
    request,
  }) => {
    const email = `e2e-webhook-${Date.now()}@example.com`;
    const res = await request.post("/api/webhooks/lead", {
      data: {
        name: "E2E Webhook Lead",
        email,
        source: "playwright_webhook",
        secret: leadSecret(),
        auditUrl: "https://example.com/report/test",
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.prospectId).toBeTruthy();
  });
});
