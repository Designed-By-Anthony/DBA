"use server";

import {
  getDb,
  setTenantContext,
  automations,
  type AutomationRow,
} from "@dba/database";
import { eq, and, desc } from "drizzle-orm";
import { verifyAuth } from "@/app/admin/actions";
import type {
  AutomationRule,
  AutomationTrigger,
  AutomationAction,
} from "@/lib/types";

/**
 * Maps database AutomationRow to API AutomationRule type
 */
function rowToRule(row: AutomationRow): AutomationRule {
  return {
    id: row.id,
    agencyId: row.tenantId,
    name: row.name,
    trigger: row.trigger as AutomationTrigger,
    action: (row.action as Record<string, unknown>) as AutomationAction,
    isActive: row.isActive,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.createdAt,
  };
}

/**
 * Retrieves all active and inactive automations for the authenticated tenant
 */
export async function getAutomations(): Promise<AutomationRule[]> {
  const session = await verifyAuth();
  const tenantId = session.user.agencyId;
  const db = getDb();

  if (!db) {
    throw new Error("Database not configured");
  }

  await setTenantContext(db, tenantId);

  const rows = await db
    .select()
    .from(automations)
    .where(eq(automations.tenantId, tenantId))
    .orderBy(desc(automations.createdAt));

  return rows.map(rowToRule);
}

/**
 * Toggles automation active/inactive state
 */
export async function toggleAutomation(
  id: string,
  isActive: boolean
): Promise<void> {
  const session = await verifyAuth();
  const tenantId = session.user.agencyId;
  const db = getDb();

  if (!db) {
    throw new Error("Database not configured");
  }

  await setTenantContext(db, tenantId);

  // Verify ownership before update
  const existing = await db
    .select()
    .from(automations)
    .where(
      and(eq(automations.tenantId, tenantId), eq(automations.id, id))
    )
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Automation not found or not authorized");
  }

  await db
    .update(automations)
    .set({ isActive, updatedAt: new Date().toISOString() })
    .where(and(eq(automations.tenantId, tenantId), eq(automations.id, id)));
}

/**
 * Creates a new automation rule for the tenant
 */
export async function createAutomation(
  name: string,
  trigger: AutomationTrigger,
  action: AutomationAction
): Promise<string> {
  const session = await verifyAuth();
  const tenantId = session.user.agencyId;
  const db = getDb();

  if (!db) {
    throw new Error("Database not configured");
  }

  await setTenantContext(db, tenantId);

  const now = new Date().toISOString();
  const automationId = crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15);

  await db.insert(automations).values({
    id: automationId,
    tenantId,
    name,
    trigger,
    action: action as Record<string, unknown>,
    condition: {},
    metadata: {},
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  return automationId;
}

/**
 * Deletes an automation rule
 */
export async function deleteAutomation(id: string): Promise<void> {
  const session = await verifyAuth();
  const tenantId = session.user.agencyId;
  const db = getDb();

  if (!db) {
    throw new Error("Database not configured");
  }

  await setTenantContext(db, tenantId);

  // Verify ownership before delete
  const existing = await db
    .select()
    .from(automations)
    .where(
      and(eq(automations.tenantId, tenantId), eq(automations.id, id))
    )
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Automation not found or not authorized");
  }

  await db
    .delete(automations)
    .where(and(eq(automations.tenantId, tenantId), eq(automations.id, id)));
}

/**
 * Updates automation fields (name, trigger, action, condition)
 */
export async function updateAutomation(
  id: string,
  fields: Partial<{
    name: string;
    trigger: AutomationTrigger;
    action: AutomationAction;
    condition: Record<string, unknown>;
  }>
): Promise<void> {
  const session = await verifyAuth();
  const tenantId = session.user.agencyId;
  const db = getDb();

  if (!db) {
    throw new Error("Database not configured");
  }

  await setTenantContext(db, tenantId);

  // Verify ownership before update
  const existing = await db
    .select()
    .from(automations)
    .where(
      and(eq(automations.tenantId, tenantId), eq(automations.id, id))
    )
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Automation not found or not authorized");
  }

  const payload: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (fields.name !== undefined) payload.name = fields.name;
  if (fields.trigger !== undefined) payload.trigger = fields.trigger;
  if (fields.action !== undefined)
    payload.action = fields.action as Record<string, unknown>;
  if (fields.condition !== undefined) payload.condition = fields.condition;

  await db
    .update(automations)
    .set(payload)
    .where(and(eq(automations.tenantId, tenantId), eq(automations.id, id)));
}
