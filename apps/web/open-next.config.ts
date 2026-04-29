import {
	defineCloudflareConfig,
	type OpenNextConfig,
} from "@opennextjs/cloudflare";

export default {
	...defineCloudflareConfig(),
	buildCommand: "bun run build:next",
} satisfies OpenNextConfig;
