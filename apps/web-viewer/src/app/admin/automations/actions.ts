"use server";

import {
  getDb,
  withTenantContext,
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
    action: row.action as unknown as AutomationAction,
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

  return await withTenantContext(db, tenantId, async (tx) => {
    const rows = await tx
      .select()
      .from(automations)
      .where(eq(automations.tenantId, tenantId))
      .orderBy(desc(automations.createdAt));

    return rows.map(rowToRule);
  });
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

  await withTenantContext(db, tenantId, async (tx) => {
    // Verify ownership before update
    const existing = await tx
      .select()
      .from(automations)
      .where(
        and(eq(automations.tenantId, tenantId), eq(automations.id, id))
      )
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Automation not found or not authorized");
    }

    await tx
      .update(automations)
      .set({ isActive, updatedAt: new Date().toISOString() })
      .where(and(eq(automations.tenantId, tenantId), eq(automations.id, id)));
  });
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

  return await withTenantContext(db, tenantId, async (tx) => {
    const now = new Date().toISOString();
    const automationId = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15);

    await tx.insert(automations).values({
      id: automationId,
      tenantId,
      name,
      trigger: trigger as any,
      action: action as any,
      condition: {},
      metadata: {},
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return automationId;
  });
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

  await withTenantContext(db, tenantId, async (tx) => {
    // Verify ownership before delete
    const existing = await tx
      .select()
      .from(automations)
      .where(
        and(eq(automations.tenantId, tenantId), eq(automations.id, id))
      )
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Automation not found or not authorized");
    }

    await tx
      .delete(automations)
      .where(and(eq(automations.tenantId, tenantId), eq(automations.id, id)));
  });
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

  await withTenantContext(db, tenantId, async (tx) => {
    // Verify ownership before update
    const existing = await tx
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
      payload.action = fields.action as any;
    if (fields.condition !== undefined) payload.condition = fields.condition;

    await tx
      .update(automations)
      .set(payload)
      .where(and(eq(automations.tenantId, tenantId), eq(automations.id, id)));
  });
}
