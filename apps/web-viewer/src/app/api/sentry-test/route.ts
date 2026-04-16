import { NextResponse } from "next/server";

export async function GET() {
  // This throws a backend server error for Sentry to capture
  throw new Error("Antigravity Server Error: Sentry Server-Side Tracking is working!");
  
  return NextResponse.json({ success: true });
}
