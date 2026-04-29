import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const requiredWorkspaceBins = [
	"node_modules/.bin/esbuild",
	"node_modules/.bin/next",
	"node_modules/.bin/opennextjs-cloudflare",
].map((path) => join(repoRoot, path));

if (requiredWorkspaceBins.every((path) => existsSync(path))) {
	process.exit(0);
}

const install = spawnSync("bun", ["install", "--frozen-lockfile"], {
	cwd: repoRoot,
	stdio: "inherit",
	shell: process.platform === "win32",
});

process.exit(install.status ?? 1);
