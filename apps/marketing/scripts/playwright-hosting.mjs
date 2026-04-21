#!/usr/bin/env node
/**
 * Cross-platform: runs Playwright with `playwright.hosting.config.ts` (static parity server + production headers).
 * Use: npm run test:e2e:hosting
 * Extra args: npm run test:e2e:hosting -- e2e/security-headers.spec.ts
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const hostingConfig = "playwright.hosting.config.ts";

const root = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
/** Default to `playwright test -c playwright.hosting.config.ts` */
const pwArgs =
	args.length === 0
		? ["test", "-c", hostingConfig]
		: args[0] === "show-report" || args[0] === "codegen"
			? args
			: args[0] === "test"
				? ["test", "-c", hostingConfig, ...args.slice(1)]
				: ["test", "-c", hostingConfig, ...args];

const child = spawn("npx", ["playwright", ...pwArgs], {
	stdio: "inherit",
	shell: process.platform === "win32",
	env: process.env,
	cwd: join(root, ".."),
});

child.on("exit", (code) => process.exit(code ?? 1));
