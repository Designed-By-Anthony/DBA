import { type NextRequest, NextResponse } from "next/server";
import "@dba/env/web-viewer-aliases";
import { auth } from "@clerk/nextjs/server";
import { getDb, contracts, estimates, withTenantContext, withBypassRls } from "@dba/database";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { apiError } from "@/lib/api-error";
import { createHash } from "crypto";

const createContractSchema = z.object({
  estimateId: z.string().uuid().optional(),
  prospectId: z.string().optional(),
  htmlContent: z.string().min(1),
});

const signContractSchema = z.object({
  id: z.string().uuid(),
  signerName: z.string().min(1),
  signerEmail: z.string().email(),
  signatureData: z.string().min(1),
  consentGiven: z.literal(true, { message: "Electronic signature consent is required" }),
});

/**
 * GET /api/admin/contracts — list contracts.
 */
export async function GET() {
  try {
    const { orgId, userId } = await auth();
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ contracts: [] });

    const rows = await withTenantContext(db, orgId, async (tx) => {
      return tx
        .select()
        .from(contracts)
        .where(eq(contracts.tenantId, orgId))
        .orderBy(desc(contracts.createdAt))
        .limit(100);
    });

    return NextResponse.json({ contracts: rows });
  } catch (error: unknown) {
    return apiError("admin/contracts/GET", error);
  }
}

/**
 * POST /api/admin/contracts — create a new contract.
 */
export async function POST(req: NextRequest) {
  try {
    const { orgId, userId } = await auth();
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = createContractSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    const now = new Date().toISOString();

    const result = await withTenantContext(db, orgId, async (tx) => {
      // Auto-number
      const existing = await tx
        .select()
        .from(contracts)
        .where(eq(contracts.tenantId, orgId))
        .orderBy(desc(contracts.createdAt))
        .limit(1);

      const nextNum = existing.length > 0
        ? parseInt(existing[0].contractNumber.replace(/\D/g, "") || "0", 10) + 1
        : 1;
      const contractNumber = `CTR-${String(nextNum).padStart(4, "0")}`;

      const [row] = await tx
        .insert(contracts)
        .values({
          tenantId: orgId,
          contractNumber,
          estimateId: body.data.estimateId ?? null,
          prospectId: body.data.prospectId ?? null,
          htmlContent: body.data.htmlContent,
          createdBy: userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // If from estimate, update estimate status
      if (body.data.estimateId) {
        await tx
          .update(estimates)
          .set({ status: "accepted", updatedAt: now })
          .where(
            and(
              eq(estimates.id, body.data.estimateId),
              eq(estimates.tenantId, orgId),
            ),
          );
      }

      return row;
    });

    return NextResponse.json({ contract: result }, { status: 201 });
  } catch (error: unknown) {
    return apiError("admin/contracts/POST", error);
  }
}

/**
 * PATCH /api/admin/contracts — sign a contract (ESIGN audit trail).
 */
export async function PATCH(req: NextRequest) {
  try {
    const raw = await req.json();

    // Simple status updates (send, etc.)
    if (raw.status && !raw.signatureData) {
      const { orgId, userId } = await auth();
      if (!orgId || !userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const db = getDb();
      if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

      const now = new Date().toISOString();
      const updates: Record<string, unknown> = { updatedAt: now, status: raw.status };
      if (raw.status === "sent") updates.sentAt = now;

      await withTenantContext(db, orgId, async (tx) => {
        await tx
          .update(contracts)
          .set(updates)
          .where(and(eq(contracts.id, raw.id), eq(contracts.tenantId, orgId)));
      });
      return NextResponse.json({ ok: true });
    }

    // E-Signature flow — no auth() required (prospect signs via portal link)
    const body = signContractSchema.safeParse(raw);
    if (!body.success) {
      return NextResponse.json({ error: "Invalid signature payload", details: body.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    const now = new Date().toISOString();
    const signerIp = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const signerUserAgent = req.headers.get("user-agent") ?? "unknown";

    const result = await withBypassRls(db, async (tx) => {
      // Fetch the contract to get htmlContent for the hash
      const [existing] = await tx
        .select()
        .from(contracts)
        .where(eq(contracts.id, body.data.id))
        .limit(1);

      if (!existing) {
        return { error: "Contract not found", status: 404 } as const;
      }
      if (existing.status === "signed") {
        return { error: "Contract already signed", status: 409 } as const;
      }

      // Generate SHA-256 certificate hash (ESIGN compliance)
      const hashInput = [
        existing.htmlContent,
        body.data.signatureData,
        now,
        signerIp,
      ].join("|");
      const certificateHash = createHash("sha256").update(hashInput).digest("hex");

      await tx
        .update(contracts)
        .set({
          status: "signed",
          signerName: body.data.signerName,
          signerEmail: body.data.signerEmail,
          signatureData: body.data.signatureData,
          signerIp,
          signerUserAgent,
          certificateHash,
          signedAt: now,
          consentGiven: true,
          updatedAt: now,
        })
        .where(eq(contracts.id, body.data.id));

      return { ok: true, certificateHash } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, certificateHash: result.certificateHash });
  } catch (error: unknown) {
    return apiError("admin/contracts/PATCH", error);
  }
}
