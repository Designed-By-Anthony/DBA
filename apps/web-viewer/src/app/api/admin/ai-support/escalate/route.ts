import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb, withTenantContext, tickets } from "@dba/database";
import { z } from "zod";

const escalateSchema = z.object({
  summary: z.string().min(1).max(500),
  transcript: z.array(
    z.object({
      role: z.enum(["user", "model"]),
      content: z.string(),
    })
  ),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export async function POST(req: NextRequest) {
  const { orgId, userId } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = escalateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { summary, transcript, priority } = parsed.data;
  const now = new Date().toISOString();

  const transcriptText = transcript
    .map((m) => `${m.role === "user" ? "Customer" : "AI"}: ${m.content}`)
    .join("\n\n");

  const ticket = await withTenantContext(db, orgId, async (tx) => {
    const [t] = await tx
      .insert(tickets)
      .values({
        tenantId: orgId,
        leadId: userId ?? "ai-escalation",
        leadEmail: "ai-escalation@system.internal",
        leadName: "AI Escalation",
        subject: `[AI Escalation] ${summary}`,
        description: `Auto-created from AI support conversation.\n\n--- Transcript ---\n${transcriptText}`,
        status: "open",
        priority,
        messages: [{
          id: crypto.randomUUID(),
          from: "client" as const,
          content: `AI Escalation:\n${transcriptText}`,
          createdAt: now,
        }],
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return t;
  });

  return NextResponse.json({ ok: true, ticketId: ticket.id });
}
