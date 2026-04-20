import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, __dirname, "");
	const vfPublic = JSON.stringify({
		turnstileSiteKey: env.VITE_PUBLIC_TURNSTILE_SITE_KEY ?? "",
		crmDefaultAgencyId: env.VITE_CRM_DEFAULT_AGENCY_ID ?? "",
	});
	const turnstileKey = (env.VITE_PUBLIC_TURNSTILE_SITE_KEY ?? "").replace(/"/g, "");

	return {
		plugins: [
			react(),
			{
				name: "vf-inject-public-config",
				transformIndexHtml(html) {
					return html
						.replace("__VF_PUBLIC_JSON__", vfPublic)
						.replace(/__VF_TURNSTILE_SITE_KEY__/g, turnstileKey);
				},
			},
		],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "src"),
			},
		},
	};
});
