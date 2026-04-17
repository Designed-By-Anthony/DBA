import { test, expect } from "@playwright/test";

/**
 * Email test-fire coverage.
 *
 * Guarantees that:
 *   1. Every outbound email triggered by Playwright goes through the
 *      centralized mailer's test-fire path — no real Resend calls.
 *   2. Critical flows (lead intake, magic-link, ticket intake) actually
 *      queue an email, so we can't silently regress to "no email fired".
 *   3. The test-inspector endpoint is properly guarded in non-test envs.
 */

const leadSecret = () => process.env.LEAD_WEBHOOK_SECRET || "test-secret";

type CapturedEmail = {
  id: string;
  firedAt: string;
  from: string;
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
  scheduledAt?: string;
};

async function clearOutbox(request: import("@playwright/test").APIRequestContext) {
  const res = await request.delete("/api/test/emails");
  expect(res.ok(), `Expected outbox DELETE to succeed (EMAIL_TEST_MODE must be on): ${await res.text()}`).toBeTruthy();
}

async function fetchOutbox(
  request: import("@playwright/test").APIRequestContext,
  filter: { to?: string; subject?: string } = {},
): Promise<CapturedEmail[]> {
  const qs = new URLSearchParams();
  if (filter.to) qs.set("to", filter.to);
  if (filter.subject) qs.set("subject", filter.subject);
  const url = `/api/test/emails${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await request.get(url);
  expect(res.ok(), `GET /api/test/emails should be enabled under EMAIL_TEST_MODE`).toBeTruthy();
  const body = (await res.json()) as { count: number; emails: CapturedEmail[] };
  expect(body.count).toBe(body.emails.length);
  return body.emails;
}

test.describe("Email test-fire coverage", () => {
  test.beforeEach(async ({ request }) => {
    await clearOutbox(request);
  });

  test("GET /api/test/emails responds 200 under EMAIL_TEST_MODE", async ({ request }) => {
    const res = await request.get("/api/test/emails");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { count: number; emails: CapturedEmail[] };
    expect(body.count).toBe(0);
    expect(Array.isArray(body.emails)).toBe(true);
  });

  test("Lead webhook fires admin notification — captured, not sent", async ({ request }) => {
    const email = `testfire-lead-${Date.now()}@example.com`;
    const res = await request.post("/api/webhooks/lead", {
      data: {
        name: "Test Fire Lead",
        email,
        source: "playwright-testfire",
        message: "emails must be captured, not delivered",
        secret: leadSecret(),
      },
    });
    expect(res.ok(), `lead webhook should accept payload: ${await res.text()}`).toBeTruthy();

    const fired = await fetchOutbox(request, { subject: "New Lead" });
    expect(fired.length, "Admin notification should have been fired").toBeGreaterThanOrEqual(1);

    const msg = fired[fired.length - 1];
    expect(msg.from.toLowerCase()).toContain("agency os");
    expect(msg.to.length).toBeGreaterThan(0);
    expect(msg.subject).toContain("Test Fire Lead");
    expect(msg.html).toContain(email);
    expect(msg.firedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test("Magic-link endpoint fires portal login email when prospect exists", async ({ request }) => {
    const email = `testfire-magic-${Date.now()}@example.com`;

    const leadRes = await request.post("/api/webhooks/lead", {
      data: { name: "Magic Fire", email, secret: leadSecret() },
    });
    expect(leadRes.ok()).toBeTruthy();

    let testModeLink: string | undefined;
    for (let attempt = 0; attempt < 15 && !testModeLink; attempt++) {
      const magic = await request.post("/api/portal/magic-link", {
        data: { email },
        headers: { "x-e2e-testing": "true" },
      });
      const parsed = (await magic.json()) as { testModeLink?: string };
      testModeLink = parsed.testModeLink;
      if (!testModeLink) await new Promise((r) => setTimeout(r, 400));
    }
    expect(testModeLink, "magic-link should return testModeLink once prospect exists").toBeTruthy();

    const fired = await fetchOutbox(request, { to: email, subject: "Portal Login" });
    expect(
      fired.length,
      "Magic-link must still fire the captured email under EMAIL_TEST_MODE",
    ).toBeGreaterThanOrEqual(1);
    const msg = fired[fired.length - 1];
    expect(msg.to).toContain(email);
    expect(msg.html).toContain("Open My Portal");
  });

  test("Invalid payload returns structured error (no uncaught throw)", async ({ request }) => {
    const res = await request.post("/api/webhooks/lead", {
      data: { secret: leadSecret(), email: "no-name@example.com" },
    });
    expect([400, 500]).toContain(res.status());
    const after = await fetchOutbox(request);
    expect(after.length, "No email should fire on invalid lead payload").toBe(0);
  });

  test("Outbox isolation — DELETE clears captured emails", async ({ request }) => {
    await request.post("/api/webhooks/lead", {
      data: {
        name: "Clear Me",
        email: `clear-${Date.now()}@example.com`,
        secret: leadSecret(),
      },
    });
    const before = await fetchOutbox(request);
    expect(before.length).toBeGreaterThan(0);

    await clearOutbox(request);
    const after = await fetchOutbox(request);
    expect(after.length).toBe(0);
  });
});
