"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getDb, withTenantContext, giftCards, loyaltyPoints } from "@dba/database";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

function requireDb() {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  return db;
}

// ── Gift Cards ──

const giftCardSchema = z.object({
  code: z.string().min(4).max(50),
  initialBalanceCents: z.number().int().min(100),
  expiresAt: z.string().optional(),
  issuedToProspectId: z.string().optional(),
  issuedToEmail: z.string().email().optional(),
});

export async function createGiftCard(data: z.infer<typeof giftCardSchema>) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  const parsed = giftCardSchema.parse(data);
  const now = new Date().toISOString();

  return withTenantContext(db, orgId, async (tx) => {
    const [card] = await tx
      .insert(giftCards)
      .values({
        tenantId: orgId,
        code: parsed.code.toUpperCase(),
        initialBalanceCents: parsed.initialBalanceCents,
        currentBalanceCents: parsed.initialBalanceCents,
        isActive: true,
        expiresAt: parsed.expiresAt,
        issuedToProspectId: parsed.issuedToProspectId,
        issuedToEmail: parsed.issuedToEmail,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/admin/giftcards");
    return card;
  });
}

/** Redeem an amount from a gift card. Returns remaining balance. */
export async function redeemGiftCard(code: string, amountCents: number) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) => {
    const [card] = await tx
      .select()
      .from(giftCards)
      .where(
        and(eq(giftCards.code, code.toUpperCase()), eq(giftCards.tenantId, orgId), eq(giftCards.isActive, true))
      )
      .limit(1);

    if (!card) throw new Error("Gift card not found or inactive");
    if (card.currentBalanceCents < amountCents) {
      throw new Error(`Insufficient balance. Available: $${(card.currentBalanceCents / 100).toFixed(2)}`);
    }

    const [updated] = await tx
      .update(giftCards)
      .set({
        currentBalanceCents: sql`${giftCards.currentBalanceCents} - ${amountCents}`,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(giftCards.id, card.id), eq(giftCards.tenantId, orgId)))
      .returning();

    return { remainingCents: updated.currentBalanceCents };
  });
}

// ── Loyalty Points ──

/** Award points to a prospect after a purchase. */
export async function awardLoyaltyPoints(data: {
  prospectId: string;
  points: number;
}) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  const now = new Date().toISOString();

  return withTenantContext(db, orgId, async (tx) => {
    // Upsert: increment if exists, insert if not
    const [existing] = await tx
      .select()
      .from(loyaltyPoints)
      .where(and(eq(loyaltyPoints.prospectId, data.prospectId), eq(loyaltyPoints.tenantId, orgId)))
      .limit(1);

    if (existing) {
      const [updated] = await tx
        .update(loyaltyPoints)
        .set({
          points: sql`${loyaltyPoints.points} + ${data.points}`,
          lifetimePoints: sql`${loyaltyPoints.lifetimePoints} + ${data.points}`,
          updatedAt: now,
        })
        .where(and(eq(loyaltyPoints.id, existing.id), eq(loyaltyPoints.tenantId, orgId)))
        .returning();

      revalidatePath("/admin/loyalty");
      return updated;
    }

    const [entry] = await tx
      .insert(loyaltyPoints)
      .values({
        tenantId: orgId,
        prospectId: data.prospectId,
        points: data.points,
        lifetimePoints: data.points,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/admin/loyalty");
    return entry;
  });
}

/** Get total loyalty points for a prospect. */
export async function getProspectLoyaltyBalance(prospectId: string): Promise<number> {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) => {
    const [result] = await tx
      .select({ points: loyaltyPoints.points })
      .from(loyaltyPoints)
      .where(and(eq(loyaltyPoints.prospectId, prospectId), eq(loyaltyPoints.tenantId, orgId)))
      .limit(1);

    return result?.points ?? 0;
  });
}

/** Redeem loyalty points. */
export async function redeemLoyaltyPoints(data: {
  prospectId: string;
  points: number;
}) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  const balance = await getProspectLoyaltyBalance(data.prospectId);
  if (balance < data.points) {
    throw new Error(`Insufficient points. Balance: ${balance}`);
  }

  const now = new Date().toISOString();

  return withTenantContext(db, orgId, async (tx) => {
    const [updated] = await tx
      .update(loyaltyPoints)
      .set({
        points: sql`${loyaltyPoints.points} - ${data.points}`,
        updatedAt: now,
      })
      .where(and(eq(loyaltyPoints.prospectId, data.prospectId), eq(loyaltyPoints.tenantId, orgId)))
      .returning();

    revalidatePath("/admin/loyalty");
    return updated;
  });
}
