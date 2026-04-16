import { test, expect } from "@playwright/test";

test.describe("Tracking + compliance endpoints", () => {
  test("open pixel returns a GIF with no-cache headers", async ({ request }) => {
    const res = await request.get("/api/track/open/test-email-123");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/gif");
    expect(res.headers()["cache-control"]).toContain("no-cache");
  });

  test("click tracking redirects when url provided", async ({ request }) => {
    const res = await request.get("/api/track/click/test-email-123?url=https%3A%2F%2Fexample.com", {
      maxRedirects: 0,
    });
    // NextResponse.redirect typically uses 307
    expect([301, 302, 303, 307, 308]).toContain(res.status());
    expect(res.headers()["location"]).toContain("https://example.com");
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

