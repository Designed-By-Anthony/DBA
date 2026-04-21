#!/usr/bin/env node
/**
 * Print HMAC signature for embed script URL (requires LEAD_EMBED_WIDGET_SECRET in env).
 *
 * Usage (from apps/vertaflow-crm):
 *   LEAD_EMBED_WIDGET_SECRET=... node tooling/embed-widget/print-embed-widget-signature.mjs org_xxx
 */
import { createHmac } from "crypto";

const tenant = process.argv[2]?.trim();
const secret = process.env.LEAD_EMBED_WIDGET_SECRET?.trim();
const base =
	process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
	"https://admin.vertaflow.io";

if (!tenant) {
	console.error(
		"Usage: LEAD_EMBED_WIDGET_SECRET=... node tooling/embed-widget/print-embed-widget-signature.mjs <clerk_org_id>",
	);
	process.exit(1);
}
if (!secret) {
	console.error(
		"Set LEAD_EMBED_WIDGET_SECRET (same value as Vercel / .env.local).",
	);
	process.exit(1);
}

const msg = `v1|${tenant}`;
const sig = createHmac("sha256", secret).update(msg, "utf8").digest("hex");

console.log("tenant:", tenant);
console.log("sig:   ", sig);
console.log("");
console.log(
	'Script tag (place before </body>, or next to <div id="dba-lead-form"></div>):',
);
console.log(
	`<script src="${base}/widgets/lead-form.js?tenant=${encodeURIComponent(tenant)}&sig=${sig}" async></script>`,
);
