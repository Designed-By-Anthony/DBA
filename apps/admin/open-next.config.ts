import {
  defineCloudflareConfig,
  type OpenNextConfig,
} from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig(),
  buildCommand: "next build --webpack",
} satisfies OpenNextConfig;
