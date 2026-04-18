"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  domainNameSchema,
  getTenantDomain,
  listTenantDomains,
  saveTenantDomain,
  updateTenantDomainStatus,
  withCurrentTenant,
} from "@/lib/services/db";
import { checkDomainStatus, registerTenantDomain } from "@/lib/services/resend";
import {
  notifyAdminOfNewTenant,
  notifyAdminOnVerification,
} from "@/lib/services/notifications";
import { tenants, type TenantDomainRow } from "@dba/database";
import { eq } from "drizzle-orm";

export type TenantOnboardingActionResult =
  | { ok: true; domain: TenantDomainRow; warning?: string }
  | { ok: false; error: string };

const onboardTenantDomainSchema = z
  .object({
    domainName: domainNameSchema,
  })
  .strict();

function errorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || "Invalid input";
  }
  return error instanceof Error ? error.message : "Something went wrong";
}

async function getTenantName(tenantId: string): Promise<string> {
  return withCurrentTenant(async (tx) => {
    const rows = await tx
      .select({ name: tenants.name })
      .from(tenants)
      .where(eq(tenants.clerkOrgId, tenantId))
      .limit(1);

    return rows[0]?.name || tenantId;
  });
}

export async function getTenantDomainsAction(): Promise<TenantDomainRow[]> {
  return listTenantDomains();
}

export async function onboardTenantDomainAction(
  input: z.infer<typeof onboardTenantDomainSchema>,
): Promise<TenantOnboardingActionResult> {
  try {
    const parsed = onboardTenantDomainSchema.parse(input);
    const resendDomain = await registerTenantDomain(parsed.domainName);
    const domain = await saveTenantDomain({
      domainName: resendDomain.domainName,
      resendId: resendDomain.resendId,
      status: resendDomain.status,
      records: resendDomain.records,
    });
    const tenantName = await getTenantName(domain.tenantId);
    const notification = await notifyAdminOfNewTenant({
      tenantId: domain.tenantId,
      tenantName,
      domainName: domain.domainName,
      resendId: domain.resendId,
      status: domain.status,
    });

    revalidatePath("/admin/settings/domains");

    return {
      ok: true,
      domain,
      warning: notification.ok ? undefined : notification.error,
    };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function refreshTenantDomainStatusAction(
  domainId: string,
): Promise<TenantOnboardingActionResult> {
  try {
    const domain = await getTenantDomain(domainId);
    if (!domain) {
      return { ok: false, error: "Domain not found" };
    }

    const previousStatus = domain.status;
    const resendDomain = await checkDomainStatus(domain.resendId);
    const updated = await updateTenantDomainStatus(domain.id, {
      status: resendDomain.status,
      records: resendDomain.records,
    });

    let warning: string | undefined;
    if (previousStatus !== "verified" && updated.status === "verified") {
      const tenantName = await getTenantName(updated.tenantId);
      const notification = await notifyAdminOnVerification({ ...updated, tenantName });
      warning = notification.ok ? undefined : notification.error;
    }

    revalidatePath("/admin/settings/domains");
    return { ok: true, domain: updated, warning };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}
