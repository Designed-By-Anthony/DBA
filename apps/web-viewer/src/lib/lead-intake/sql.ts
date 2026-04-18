/**
 * Augusta lead intake — SQL-backed prospect creation.
 *
 * Zero-Trust Multi-Tenancy: every query filters on `tenantId`
 * (Drizzle field) / `tenant_id` (SQL column) / the Clerk `orgId`.
 */
import { eq, and, desc } from "drizzle-orm";
import { getDb, leads, type LeadRow } from "@dba/database";
import { generateClientId, getIdSource } from "@/lib/client-id";

export type SqlLeadInsertInput = {
  agencyId: string;
  name: string;
  /** Optional split-name fields (Phase 7 global lead contract). */
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  source?: string;
  message?: string;
  auditUrl?: string;
  /** Vertical-specific payload — lands in `leads.metadata` JSONB. */
  metadata?: Record<string, unknown>;
};

export type SqlLeadInsertResult = {
  prospectId: string;
  isNew: boolean;
};

/**
 * Upserts a `leads` row (tenant-scoped on `clerk_org_id`). Matches existing
 * leads by normalized email within the same tenant so re-submits don't
 * duplicate prospects in the Kanban board. On a re-submit, the metadata
 * JSONB is shallow-merged so partial updates don't clobber existing
 * vertical-specific fields.
 */
export async function insertSqlLead(input: SqlLeadInsertInput): Promise<SqlLeadInsertResult | null> {
  const db = getDb();
  if (!db) return null;

  const agencyId = input.agencyId.trim();
  if (!agencyId) throw new Error("agencyId (Clerk org id) is required for SQL lead intake");

  const emailNormalized = input.email.trim().toLowerCase();
  const nowIso = new Date().toISOString();
  /** Fold top-level CRM fields into JSONB so `/api/lead` and webhooks persist full context. */
  const incomingMetadata: Record<string, unknown> = {
    ...(input.metadata ?? {}),
    ...(input.company?.trim() ? { company: input.company.trim() } : {}),
    ...(input.website?.trim() ? { website: input.website.trim() } : {}),
    ...(input.message?.trim() ? { message: input.message.trim() } : {}),
    ...(input.auditUrl?.trim() ? { auditUrl: input.auditUrl.trim() } : {}),
  };

  const existing: LeadRow[] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.tenantId, agencyId), eq(leads.emailNormalized, emailNormalized)))
    .limit(1);

  if (existing[0]) {
    const merged = {
      ...((existing[0].metadata as Record<string, unknown>) ?? {}),
      ...incomingMetadata,
    };
    await db
      .update(leads)
      .set({
        updatedAt: nowIso,
        metadata: merged,
        // Fill in any global-core fields that weren't on the original row.
        firstName: existing[0].firstName ?? input.firstName ?? null,
        lastName: existing[0].lastName ?? input.lastName ?? null,
        phone: existing[0].phone ?? input.phone ?? null,
        source: existing[0].source ?? input.source ?? null,
      })
      .where(and(eq(leads.tenantId, agencyId), eq(leads.id, existing[0].id)));
    return { prospectId: existing[0].prospectId, isNew: false };
  }

  const prospectId = await generateClientId(
    getIdSource(input.company, input.name),
    agencyId,
  );

  await db.insert(leads).values({
    tenantId: agencyId,
    prospectId,
    name: input.name.trim(),
    firstName: input.firstName?.trim() ?? null,
    lastName: input.lastName?.trim() ?? null,
    email: input.email.trim(),
    emailNormalized,
    phone: input.phone?.trim() ?? null,
    source: input.source?.trim() ?? null,
    status: "new",
    metadata: incomingMetadata,
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  return { prospectId, isNew: true };
}

/**
 * Tenant-scoped Kanban / prospects list. Returns newest first.
 */
export async function listSqlLeads(agencyId: string, limit = 200): Promise<LeadRow[]> {
  const db = getDb();
  if (!db) return [];
  const tenantId = agencyId.trim();
  if (!tenantId) return [];
  return db
    .select()
    .from(leads)
    .where(eq(leads.tenantId, tenantId))
    .orderBy(desc(leads.createdAt))
    .limit(limit);
}

/**
 * Fetch a single lead by public `prospectId` (e.g. desi0001), tenant-scoped.
 */
export async function getSqlLeadByProspectId(
  agencyId: string,
  prospectId: string,
): Promise<LeadRow | null> {
  const db = getDb();
  if (!db) return null;
  const tenantId = agencyId.trim();
  const pid = prospectId.trim();
  if (!tenantId || !pid) return null;
  const rows = await db
    .select()
    .from(leads)
    .where(and(eq(leads.tenantId, tenantId), eq(leads.prospectId, pid)))
    .limit(1);
  return rows[0] ?? null;
}
