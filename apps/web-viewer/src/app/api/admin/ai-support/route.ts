import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { chat, shouldEscalate, type ChatMessage } from "@/lib/ai-agent";
import { z } from "zod";

const bodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "model"]),
      content: z.string().min(1).max(5000),
    })
  ).min(1).max(50),
  vertical: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { orgId } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { messages, vertical } = parsed.data;

  try {
    const response = await chat(messages as ChatMessage[], vertical);
    const escalate = shouldEscalate(messages as ChatMessage[]);

    return NextResponse.json({
      message: response,
      shouldEscalate: escalate,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "AI service unavailable";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
