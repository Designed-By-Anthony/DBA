import { google } from "@ai-sdk/google";
import { Stagehand } from "@browserbasehq/stagehand";
import { loadEnvConfig } from "@next/env";

// Load Next.js environment variables (including .env.local)
const projectDir = process.cwd();
loadEnvConfig(projectDir);

/**
 * Creates an instance of Stagehand specifically configured for QA testing.
 * Uses local browser for 'test' environments so it can reach localhost:3000/3001.
 * Uses Gemini 1.5 Pro via the Vercel AI SDK.
 */
export async function createQABot(options?: { headless?: boolean }) {
	const isLocalTest =
		process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development";

	if (!process.env.GEMINI_API_KEY) {
		throw new Error("GEMINI_API_KEY is required to run Stagehand QA tests.");
	}

	const stagehand = new Stagehand({
		env: isLocalTest ? "LOCAL" : "BROWSERBASE",
		modelClient: google("gemini-1.5-pro-latest"),
		verbose: 1, // Enable logs so we can see the LLM's thought process
	});

	await stagehand.init();
	return stagehand;
}

/**
 * Convenience runner that ensures cleanup happens after a QA scenario completes or fails.
 */
export async function runQAScenario<T>(
	name: string,
	scenario: (bot: Stagehand) => Promise<T>,
): Promise<T> {
	console.log(`[QA Bot] Starting scenario: ${name}...`);
	const bot = await createQABot();

	try {
		const result = await scenario(bot);
		console.log(`[QA Bot] Scenario '${name}' completed successfully.`);
		return result;
	} catch (error) {
		console.error(`[QA Bot] Scenario '${name}' failed:`, error);
		throw error;
	} finally {
		await bot.close();
	}
}
