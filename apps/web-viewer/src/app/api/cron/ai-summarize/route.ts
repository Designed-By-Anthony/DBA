import { type NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function GET(req: NextRequest) {
  const auth = verifyCronAuth(req);
  if (!auth.ok) {
    return new NextResponse(auth.message, { status: auth.status });
  }

  try {
    // TODO: this route was shipped as a placeholder in PR #3; the real
    // summarization loop is commented out pending LLM-provider wiring.
    // Keeping the handler so the Vercel cron entry remains valid but
    // documenting that nothing happens yet.
    console.info("[AI Cron] Summarization loop executed successfully.");
    return NextResponse.json({ success: true, processedCount: 0 });
  } catch (error) {
    console.error("[AI Cron Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
