import { NextResponse } from "next/server";
import { webAppManifest } from "@/lib/web-app-manifest";

/** Legacy path — browsers and hosts still request `/site.webmanifest`. */
export async function GET() {
	return NextResponse.json(webAppManifest, {
		headers: {
			"Content-Type": "application/manifest+json; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
