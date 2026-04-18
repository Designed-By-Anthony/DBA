import { Resend } from "resend";
import type {
  CreateDomainResponseSuccess,
  DomainRecords,
  DomainStatus,
  GetDomainResponseSuccess,
} from "resend";
import type { TenantDomainDnsRecord } from "@dba/database";
import { TenantTransactionalEmail } from "./email-templates";

type ResendDomainPayload = Pick<
  CreateDomainResponseSuccess | GetDomainResponseSuccess,
  "id" | "name" | "status" | "records"
>;

export type RegisterTenantDomainResult = {
  resendId: string;
  domainName: string;
  status: DomainStatus;
  records: TenantDomainDnsRecord[];
};

export type SendTransactionalEmailPayload = {
  to: string | string[];
  subject: string;
  heading: string;
  message: string;
  fromDomain: string;
  fromName?: string;
  replyTo?: string;
  preview?: string;
  tenantName?: string;
};

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing RESEND_API_KEY");
  }

  if (!resendClient) {
    resendClient = new Resend(key);
  }

  return resendClient;
}

function isResendTestMode(): boolean {
  if (process.env.RESEND_DOMAIN_TEST_MODE === "true") return true;
  if (process.env.EMAIL_TEST_MODE === "true") return true;
  if (process.env.NEXT_PUBLIC_IS_TEST === "true") return true;
  if (process.env.NODE_ENV === "test") return true;
  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production") return true;
  return false;
}

function normalizeRecord(record: DomainRecords): TenantDomainDnsRecord {
  const group: TenantDomainDnsRecord["group"] =
    record.record === "DKIM"
      ? "dkim"
      : record.record === "Receiving"
        ? "receiving"
        : "verification";

  return {
    group,
    record: record.record,
    name: record.name,
    type: record.type,
    value: record.value,
    ttl: record.ttl,
    status: record.status,
    priority: "priority" in record ? record.priority : undefined,
  };
}

function normalizeDomainPayload(payload: ResendDomainPayload): RegisterTenantDomainResult {
  return {
    resendId: payload.id,
    domainName: payload.name,
    status: payload.status,
    records: payload.records.map(normalizeRecord),
  };
}

function mockDomainPayload(domainName: string): RegisterTenantDomainResult {
  const normalized = domainName.trim().toLowerCase();
  return {
    resendId: `mock_resend_${normalized.replace(/[^a-z0-9]+/g, "_")}`,
    domainName: normalized,
    status: "pending",
    records: [
      {
        group: "verification",
        record: "SPF",
        name: normalized,
        type: "TXT",
        value: "v=spf1 include:amazonses.com ~all",
        ttl: "Auto",
        status: "pending",
      },
      {
        group: "dkim",
        record: "DKIM",
        name: `resend._domainkey.${normalized}`,
        type: "CNAME",
        value: "resend._domainkey.resend.com",
        ttl: "Auto",
        status: "pending",
      },
    ],
  };
}

export async function registerTenantDomain(
  domainName: string,
): Promise<RegisterTenantDomainResult> {
  if (isResendTestMode()) {
    return mockDomainPayload(domainName);
  }

  const client = getResendClient();
  const response = await client.domains.create({
    name: domainName,
    capabilities: { sending: "enabled" },
  });

  if (response.error) {
    throw new Error(response.error.message);
  }
  if (!response.data) {
    throw new Error("Resend did not return domain data");
  }

  return normalizeDomainPayload(response.data);
}

export async function checkDomainStatus(
  resendId: string,
): Promise<RegisterTenantDomainResult> {
  if (isResendTestMode()) {
    const domainName = resendId.replace(/^mock_resend_/, "").replace(/_/g, ".");
    const payload = mockDomainPayload(domainName);
    return {
      ...payload,
      resendId,
      status: process.env.RESEND_DOMAIN_TEST_VERIFIED === "true" ? "verified" : "pending",
      records: payload.records.map((record) => ({
        ...record,
        status: process.env.RESEND_DOMAIN_TEST_VERIFIED === "true" ? "verified" : "pending",
      })),
    };
  }

  const client = getResendClient();
  const response = await client.domains.get(resendId);

  if (response.error) {
    throw new Error(response.error.message);
  }
  if (!response.data) {
    throw new Error("Resend did not return domain status");
  }

  return normalizeDomainPayload(response.data);
}

export async function sendTransactionalEmail(
  tenantId: string,
  payload: SendTransactionalEmailPayload,
): Promise<{ ok: true; id: string | null } | { ok: false; error: string }> {
  if (isResendTestMode()) {
    return { ok: true, id: `mock_email_${tenantId}_${Date.now()}` };
  }

  const client = getResendClient();
  const fromName = payload.fromName || payload.tenantName || "Agency OS";
  const from = `${fromName} <notifications@${payload.fromDomain}>`;
  const response = await client.emails.send({
    from,
    to: payload.to,
    subject: payload.subject,
    replyTo: payload.replyTo,
    react: TenantTransactionalEmail({
      preview: payload.preview || payload.subject,
      heading: payload.heading,
      message: payload.message,
      tenantName: payload.tenantName || tenantId,
    }),
    tags: [
      { name: "tenantId", value: tenantId },
      { name: "workflow", value: "tenant_transactional" },
    ],
  });

  if (response.error) {
    return { ok: false, error: response.error.message };
  }

  return { ok: true, id: response.data?.id ?? null };
}
