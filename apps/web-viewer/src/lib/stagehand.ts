import { Stagehand } from "@browserbasehq/stagehand";
import { validateWebViewerEnv } from "@dba/env/web-viewer";

/**
 * Initializes a new Stagehand browser automation instance.
 * Stagehand connects to Browserbase to run headless Playwright sessions
 * with AI capabilities (Act, Extract, Observe) powered by Google Gemini.
 *
 * Note: Since Stagehand is a Node environment tool, it should only be
 * initialized inside server actions, API routes, or backend workers.
 */
export async function createStagehandInstance() {
  const env = validateWebViewerEnv();
  if (!env.GEMINI_API_KEY || !env.BROWSERBASE_API_KEY) {
    throw new Error(
      "Missing GEMINI_API_KEY or BROWSERBASE_API_KEY for Stagehand automation."
    );
  }

  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    apiKey: env.BROWSERBASE_API_KEY,
    model: {
      modelName: "gemini-2.0-flash",
      apiKey: env.GEMINI_API_KEY,
    },
  });

  await stagehand.init();

  return stagehand;
}

/**
 * Example wrapper to run a stagehand script and safely clean up resources.
 */
export async function runStagehandScript<T>(
  script: (stagehand: Stagehand) => Promise<T>
): Promise<T> {
  const stagehand = await createStagehandInstance();
  try {
    return await script(stagehand);
  } finally {
    await stagehand.close();
  }
}
