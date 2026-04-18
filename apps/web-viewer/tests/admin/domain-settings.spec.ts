import { expect, test } from "@playwright/test";
import { dismissClerkModals, dismissClerkModalsUntil } from "../helpers/clerk";
import { gotoPage } from "../helpers/navigation";

const hasDatabaseUrl = Boolean(
  process.env.DATABASE_URL?.trim() || process.env.DATABASE_URL_UNPOOLED?.trim(),
);

test.describe("Domain Settings", () => {
  test.beforeEach(async ({ request }) => {
    await request.delete("/api/test/discord");
  });

  test("registers a tenant domain and records the admin notification", async ({ page, request }) => {
    test.skip(
      !hasDatabaseUrl,
      "Set DATABASE_URL (or DATABASE_URL_UNPOOLED) so tenant_domains can be written; apply drizzle/0002_tenant_email_domains.sql on the DB.",
    );

    await gotoPage(page, "/admin/settings/domains");

    await expect(page.getByRole("heading", { name: /domain settings/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Database not configured|unavailable/i)).not.toBeVisible();

    // Drizzle surfaces failed SELECTs as "Failed query: …" in loadError when the table
    // or RLS is missing — skip until migration is applied on this DATABASE_URL.
    const failedQuery = page.getByText(/^Failed query:/i);
    if (await failedQuery.isVisible().catch(() => false)) {
      test.skip(
        true,
        "tenant_domains is not queryable on this DB — apply packages/database/drizzle/0002_tenant_email_domains.sql (or sql/2026-04-18-tenant-email-domains.sql) and re-run.",
      );
    }

    await dismissClerkModals(page);

    const domain = `playwright-${Date.now()}.example.com`;
    await page.getByLabel(/add sending domain/i).fill(domain);
    await page.getByRole("button", { name: /register domain/i }).click();

    // Server action + revalidation can surface Clerk modals asynchronously (e.g. Organizations).
    const heading = page.getByRole("heading", { name: domain });
    await dismissClerkModalsUntil(
      page,
      async () => heading.isVisible().catch(() => false),
      22_000,
    );

    await expect(heading).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/Verification/i).first()).toBeVisible();
    await expect(page.getByText(/DKIM/i).first()).toBeVisible();
    await expect(page.getByText("v=DMARC1; p=none;").first()).toBeVisible();

    const response = await request.get("/api/test/discord");
    expect(response.ok()).toBe(true);
    const payload = (await response.json()) as {
      count: number;
      notifications: Array<{ kind: string; payload: { domainName: string } }>;
    };
    expect(payload.count).toBeGreaterThan(0);
    expect(payload.notifications.some((item) => item.payload.domainName === domain)).toBe(true);
  });
});
