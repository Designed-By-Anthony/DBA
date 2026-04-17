import { test, expect } from "@playwright/test";
import { signClickTarget } from "../src/lib/email-utils";

test.describe("Tracking + compliance endpoints", () => {
  test("open pixel returns a GIF with no-cache headers", async ({ request }) => {
    const res = await request.get("/api/track/open/test-email-123");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/gif");
    expect(res.headers()["cache-control"]).toContain("no-cache");
  });

  test("click tracking redirects when url is signed", async ({ request }) => {
    const emailId = "test-email-123";
    const target = "https://example.com";
    const sig = signClickTarget(emailId, target);
    const res = await request.get(
      `/api/track/click/${emailId}?url=${encodeURIComponent(target)}&sig=${sig}`,
      { maxRedirects: 0 },
    );
    expect([301, 302, 303, 307, 308]).toContain(res.status());
    expect(res.headers()["location"]).toContain("https://example.com");
  });

  test("click tracking rejects an unsigned redirect (open-redirect guard)", async ({ request }) => {
    const res = await request.get(
      "/api/track/click/test-email-123?url=https%3A%2F%2Fexample.com",
      { maxRedirects: 0 },
    );
    expect(res.status()).toBe(400);
  });

  test("click tracking rejects a tampered signature", async ({ request }) => {
    const emailId = "test-email-123";
    const target = "https://example.com";
    const sig = signClickTarget(emailId, target);
    // swap the target but keep the stale signature
    const res = await request.get(
      `/api/track/click/${emailId}?url=${encodeURIComponent("https://attacker.example")}&sig=${sig}`,
      { maxRedirects: 0 },
    );
    expect(res.status()).toBe(400);
  });

  test("click tracking rejects when url missing", async ({ request }) => {
    const res = await request.get("/api/track/click/test-email-123", { maxRedirects: 0 });
    expect(res.status()).toBe(400);
  });

  test("unsubscribe rejects missing parameters", async ({ request }) => {
    const res = await request.get("/api/unsubscribe");
    expect(res.status()).toBe(400);
    expect((await res.text()).toLowerCase()).toContain("invalid");
  });

  test("unsubscribe rejects invalid token", async ({ request }) => {
    const res = await request.get("/api/unsubscribe?id=prospect_123&token=invalid");
    expect(res.status()).toBe(400);
    expect((await res.text()).toLowerCase()).toContain("invalid");
  });
});

