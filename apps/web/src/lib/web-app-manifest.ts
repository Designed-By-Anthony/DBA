import type { MetadataRoute } from "next";

/** Shared PWA manifest for `/manifest.webmanifest` and legacy `/site.webmanifest`. */
export const webAppManifest: MetadataRoute.Manifest = {
	name: "ANTHONY.",
	short_name: "ANTHONY.",
	description:
		"Custom websites, managed hosting, and local SEO systems for service businesses.",
	start_url: "/",
	scope: "/",
	display: "standalone",
	background_color: "#08111f",
	theme_color: "#08111f",
	icons: [
		{
			src: "/site-icon-192.png",
			sizes: "192x192",
			type: "image/png",
		},
		{
			src: "/site-icon-512.png",
			sizes: "512x512",
			type: "image/png",
		},
		{
			src: "/apple-touch-icon-180.png",
			sizes: "180x180",
			type: "image/png",
		},
	],
};
