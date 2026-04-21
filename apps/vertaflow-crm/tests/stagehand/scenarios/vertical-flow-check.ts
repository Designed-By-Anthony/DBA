import { z } from "zod";
import { runQAScenario } from "../qa-bot";

// This runs a Stagehand session to verify that different verticals (e.g. Service Pro vs Restaurant)
// render the correct UI patterns and correctly map data.
async function runVerticalFlowCheck() {
	await runQAScenario("Vertical Flow Check", async (bot) => {
		const baseUrl =
			process.env.NODE_ENV === "production"
				? "https://admin.vertaflow.io"
				: "http://localhost:3000";

		// Access Playwright's page object via bot.page
		await bot.page.goto(`${baseUrl}/admin`);

		// 1. We assume the dev environment has a tenant switcher or we can navigate to a specific tenant.
		// For this test, we instruct the bot to look at the UI and determine what vertical it's currently in.
		const verticalExtraction = await bot.extract(
			`Analyze the dashboard. What vertical template is currently active? 
      Clues: 
      - If it says 'Agency' or shows API metrics, it's 'Agency'.
      - If it shows 'Kitchen display' or 'menu', it's 'Restaurant'.
      - If it shows a Kanban board for home services, it's 'Service Pro'.
      - If it shows 'Florist' or retail items, it's 'Retail'.`,
			{
				schema: z.object({
					detectedVertical: z.string(),
					confidence: z.number(),
				}),
			},
		);

		console.log(
			`[QA Bot] Detected Vertical: ${verticalExtraction.detectedVertical} (Confidence: ${verticalExtraction.confidence})`,
		);

		// 2. Instruct the bot to try and change the vertical (if the UI allows it) or verify specific CRM elements
		await bot.act(
			`Navigate through the CRM sections. Look for a way to add a lead, ticket, or order depending on the vertical.`,
		);

		const uiCheck = await bot.extract(
			`Did the CRM flow make sense for the detected vertical? 
      For example, if it's a Restaurant, were there orders/tickets instead of long-term sales pipelines? 
      If it's Service Pro, was there a Kanban board?`,
			{
				schema: z.object({
					flowIsCorrectForVertical: z.boolean(),
					reasoning: z.string(),
				}),
			},
		);

		if (!uiCheck.flowIsCorrectForVertical) {
			throw new Error(`Vertical Flow failed: ${uiCheck.reasoning}`);
		}

		console.log(
			`✅ Vertical Flow Check Passed: UI behaves correctly for ${verticalExtraction.detectedVertical}.`,
		);
		console.log(`   Bot Reasoning: ${uiCheck.reasoning}`);
		return true;
	});
}

// Run if executed directly
if (require.main === module) {
	runVerticalFlowCheck().catch(console.error);
}
