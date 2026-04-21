import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "VertaFlow Portal",
		short_name: "VertaFlow",
		description:
			"Offline-ready client portal and CRM workspace built for real operators in the field.",
		id: "/portal/dashboard",
		start_url: "/portal/dashboard",
		scope: "/",
		display: "standalone",
		orientation: "any",
		background_color: "#0f1218",
		theme_color: "#2563eb",
		categories: ["business", "productivity"],
		icons: [
			{
				src: "/icons/icon-192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/icons/icon-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
		shortcuts: [
			{
				name: "Point of Sale",
				short_name: "POS",
				url: "/admin/pos",
				description: "Ring up a sale",
				icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
			},
			{
				name: "Clock In",
				short_name: "Clock In",
				url: "/admin/timeclock",
				description: "Start your shift",
				icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
			},
			{
				name: "Calendar",
				short_name: "Calendar",
				url: "/admin/calendar",
				description: "View appointments",
				icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
			},
			{
				name: "Client Portal",
				short_name: "Portal",
				url: "/portal/dashboard",
				description: "Customer self-service",
				icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
			},
		],
		screenshots: [],
	};
}
