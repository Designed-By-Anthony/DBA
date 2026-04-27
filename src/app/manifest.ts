import type { MetadataRoute } from "next";
import { webAppManifest } from "@/lib/web-app-manifest";

/** PWA manifest — served at `/manifest.webmanifest` (Next file convention). */
export default function manifest(): MetadataRoute.Manifest {
	return webAppManifest;
}
