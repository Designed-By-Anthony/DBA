import { test, expect } from "@playwright/test";
import {
  checkLeadRateLimit,
  isLikelyBotSubmission,
  requireTurnstileInProd,
  resetLeadRateLimitForTests,
  validatePublicLead,
} from "../src/lib/lead-intake/spam-guard";

/**
 * Pure-logic unit tests for the public-lead spam guard.
 *
 * These tests run inside the Playwright project because that is the
 * existing test harness for Agency OS — they do NOT hit a web server.
 * They protect against regressions in the bot-spam defense that sits in
 * front of `POST /api/lead` → Resend "New Lead" emails.
 */
test.describe("lead spam-guard: validatePublicLead", () => {
  test("accepts a realistic lead", () => {
    const issue = validatePublicLead({
      name: "Jane Smith",
      email: "jane@acme.com",
      message: "Interested in a site audit",
    });
    expect(issue).toBeNull();
  });

  test("rejects missing fields", () => {
    expect(validatePublicLead({ name: "", email: "x@y.com" })).toEqual({
      field: "name",
      message: expect.any(String),
    });
    expect(validatePublicLead({ name: "X", email: "" })).toEqual({
      field: "email",
      message: expect.any(String),
    });
  });

  test("rejects malformed email", () => {
    const issue = validatePublicLead({ name: "Jane", email: "not-an-email" });
    expect(issue?.field).toBe("email");
  });

  test("rejects disposable inbox domains", () => {
    const issue = validatePublicLead({ name: "Jane", email: "foo@mailinator.com" });
    expect(issue?.field).toBe("email");
  });

  test("rejects pathologically long values", () => {
    expect(validatePublicLead({ name: "x".repeat(400), email: "x@y.com" })?.field).toBe("name");
    expect(
      validatePublicLead({
        name: "ok",
        email: `${"x".repeat(250)}@y.com`,
      })?.field,
    ).toBe("email");
  });
});

test.describe("lead spam-guard: isLikelyBotSubmission", () => {
  test("passes realistic lead through", () => {
    expect(
      isLikelyBotSubmission({
        name: "Jane Smith",
        email: "jane@acme.com",
        message: "Please audit https://acme.com — thanks!",
      }),
    ).toBe(false);
  });

  test("drops URL-bomb messages", () => {
    expect(
      isLikelyBotSubmission({
        name: "Jane",
        email: "jane@acme.com",
        message: "Visit https://a.com or https://b.com now!",
      }),
    ).toBe(true);
  });

  test("drops cyrillic-only names", () => {
    expect(
      isLikelyBotSubmission({
        name: "Привет Друзья",
        email: "ok@acme.com",
      }),
    ).toBe(true);
  });

  test("drops names containing a URL", () => {
    expect(
      isLikelyBotSubmission({
        name: "Buy now https://spam.tld",
        email: "ok@acme.com",
      }),
    ).toBe(true);
  });

  test("drops name == email (automated scrapers)", () => {
    expect(
      isLikelyBotSubmission({
        name: "spammer@bot.tld",
        email: "spammer@bot.tld",
      }),
    ).toBe(true);
  });

  test("drops website fields with whitespace / angle brackets", () => {
    expect(
      isLikelyBotSubmission({
        name: "Jane",
        email: "jane@acme.com",
        website: "https://a.com <script>alert(1)</script>",
      }),
    ).toBe(true);
  });
});

test.describe("lead spam-guard: checkLeadRateLimit", () => {
  test.beforeEach(() => {
    resetLeadRateLimitForTests();
  });

  test("allows submissions up to the configured limit", () => {
    for (let i = 0; i < 3; i++) {
      const result = checkLeadRateLimit("1.2.3.4", { limit: 3, windowMs: 60_000 });
      expect(result.allowed).toBe(true);
    }
  });

  test("blocks the Nth+1 submission and reports retry-after", () => {
    const opts = { limit: 2, windowMs: 60_000 };
    checkLeadRateLimit("9.9.9.9", opts);
    checkLeadRateLimit("9.9.9.9", opts);
    const blocked = checkLeadRateLimit("9.9.9.9", opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  test("per-IP isolation (one spammer does not block another user)", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    checkLeadRateLimit("5.5.5.5", opts);
    const otherIp = checkLeadRateLimit("6.6.6.6", opts);
    expect(otherIp.allowed).toBe(true);
  });

  test("releases the slot after the window expires (virtual clock)", () => {
    let fakeNow = 0;
    const opts = { limit: 1, windowMs: 1_000, now: () => fakeNow };
    expect(checkLeadRateLimit("time-test", opts).allowed).toBe(true);
    expect(checkLeadRateLimit("time-test", opts).allowed).toBe(false);
    fakeNow += 1_500;
    expect(checkLeadRateLimit("time-test", opts).allowed).toBe(true);
  });

  test("empty client id degrades open (avoids blocking legitimate traffic when IP missing)", () => {
    const result = checkLeadRateLimit("", { limit: 1, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
  });
});

test.describe("lead spam-guard: requireTurnstileInProd", () => {
  test("true when VERCEL_ENV=production", () => {
    expect(requireTurnstileInProd({ VERCEL_ENV: "production" } as NodeJS.ProcessEnv)).toBe(true);
  });

  test("true when NODE_ENV=production on a Vercel build", () => {
    expect(
      requireTurnstileInProd({ NODE_ENV: "production", VERCEL: "1" } as NodeJS.ProcessEnv),
    ).toBe(true);
  });

  test("false for local dev / preview / CI", () => {
    expect(requireTurnstileInProd({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).toBe(false);
    expect(requireTurnstileInProd({ VERCEL_ENV: "preview" } as NodeJS.ProcessEnv)).toBe(false);
    expect(requireTurnstileInProd({} as NodeJS.ProcessEnv)).toBe(false);
  });

  test("PUBLIC_LEAD_DISABLE_TURNSTILE overrides to false (documented escape hatch)", () => {
    expect(
      requireTurnstileInProd({
        VERCEL_ENV: "production",
        PUBLIC_LEAD_DISABLE_TURNSTILE: "true",
      } as NodeJS.ProcessEnv),
    ).toBe(false);
  });
});
