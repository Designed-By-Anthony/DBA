"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  getDb,
  withTenantContext,
  menuCategories,
  menuItems,
  menuModifiers,
  type MenuItemRow,
  type MenuCategoryRow,
} from "@dba/database";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";

function requireDb() {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  return db;
}

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).default(0),
});

const menuItemSchema = z.object({
  categoryId: z.string().uuid().optional(),
  inventoryItemId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priceCents: z.number().int().min(0),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

const modifierSchema = z.object({
  menuItemId: z.string().uuid(),
  name: z.string().min(1).max(100),
  priceCents: z.number().int().min(0).default(0),
  isDefault: z.boolean().default(false),
});

// ── Categories ──

export async function createMenuCategory(data: z.infer<typeof categorySchema>) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  const parsed = categorySchema.parse(data);
  const now = new Date().toISOString();

  return withTenantContext(db, orgId, async (tx) => {
    const [cat] = await tx
      .insert(menuCategories)
      .values({ tenantId: orgId, ...parsed, isActive: true, createdAt: now, updatedAt: now })
      .returning();

    revalidatePath("/admin/menu");
    return cat;
  });
}

export async function listMenuCategories(): Promise<MenuCategoryRow[]> {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) =>
    tx
      .select()
      .from(menuCategories)
      .where(and(eq(menuCategories.tenantId, orgId), eq(menuCategories.isActive, true)))
      .orderBy(asc(menuCategories.sortOrder))
  );
}

// ── Menu Items ──

export async function createMenuItem(data: z.infer<typeof menuItemSchema>) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  const parsed = menuItemSchema.parse(data);
  const now = new Date().toISOString();

  return withTenantContext(db, orgId, async (tx) => {
    const [item] = await tx
      .insert(menuItems)
      .values({ tenantId: orgId, ...parsed, isAvailable: true, createdAt: now, updatedAt: now })
      .returning();

    revalidatePath("/admin/menu");
    return item;
  });
}

export async function updateMenuItem(
  itemId: string,
  data: Partial<z.infer<typeof menuItemSchema>> & { isAvailable?: boolean }
) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) => {
    const [item] = await tx
      .update(menuItems)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(menuItems.id, itemId), eq(menuItems.tenantId, orgId)))
      .returning();

    revalidatePath("/admin/menu");
    return item;
  });
}

export async function listMenuItems(categoryId?: string): Promise<MenuItemRow[]> {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) => {
    const conditions = [eq(menuItems.tenantId, orgId)];
    if (categoryId) conditions.push(eq(menuItems.categoryId, categoryId));

    return tx.select().from(menuItems).where(and(...conditions)).orderBy(asc(menuItems.sortOrder));
  });
}

/** Get full menu: categories with items nested. */
export async function getFullMenu() {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) => {
    const cats = await tx
      .select()
      .from(menuCategories)
      .where(and(eq(menuCategories.tenantId, orgId), eq(menuCategories.isActive, true)))
      .orderBy(asc(menuCategories.sortOrder));

    const items = await tx
      .select()
      .from(menuItems)
      .where(eq(menuItems.tenantId, orgId))
      .orderBy(asc(menuItems.sortOrder));

    return cats.map((cat) => ({
      ...cat,
      items: items.filter((i) => i.categoryId === cat.id),
    }));
  });
}

// ── Modifiers ──

export async function createMenuModifier(data: z.infer<typeof modifierSchema>) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  const parsed = modifierSchema.parse(data);
  const now = new Date().toISOString();

  return withTenantContext(db, orgId, async (tx) => {
    const [mod] = await tx
      .insert(menuModifiers)
      .values({ tenantId: orgId, ...parsed, createdAt: now })
      .returning();

    revalidatePath("/admin/menu");
    return mod;
  });
}

export async function listMenuModifiers(menuItemId: string) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) =>
    tx
      .select()
      .from(menuModifiers)
      .where(and(eq(menuModifiers.menuItemId, menuItemId), eq(menuModifiers.tenantId, orgId)))
  );
}
