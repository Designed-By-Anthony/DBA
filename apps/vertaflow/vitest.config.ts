import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		setupFiles: "./src/test/setup.ts",
		include: [
			"src/**/*.test.ts",
			"src/**/*.test.tsx",
			"src/**/*.spec.ts",
			"src/**/*.spec.tsx",
		],
		pool: "forks",
		maxWorkers: 1,
		minWorkers: 1,
		globals: true,
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
});
