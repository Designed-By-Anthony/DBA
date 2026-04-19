import { runQAScenario } from "../qa-bot";
import { z } from "zod";

// This runs a "Red Team" Stagehand session specifically looking for data leaks across tenants.
async function runTenantLeakCheck() {
  await runQAScenario("Tenant Leak Check", async (bot) => {
    const baseUrl = process.env.NODE_ENV === "production" 
      ? "https://admin.designedbyanthony.com" 
      : "http://localhost:3000";

    // Access Playwright's page object via bot.page
    await bot.page.goto(`${baseUrl}/admin`);

    const leadName = `LeakTest Lead ${Date.now()}`;
    
    await bot.act(`Navigate to the leads or CRM section. Click 'Add Lead' or 'New Prospect'. Create a new lead with the name '${leadName}' and email 'leaktest@example.com'. Submit the form.`);

    // 3. Verify it was created
    const createdExtraction = await bot.extract(
      `Check if a lead named '${leadName}' is visible on the screen. Return true if visible, false otherwise.`,
      { schema: z.object({ isVisible: z.boolean() }) }
    );

    if (!createdExtraction.isVisible) {
      throw new Error("Failed to create the test lead. The initial tenant workflow might be broken.");
    }

    // 4. Log out and switch to Tenant B
    await bot.act(`Log out of the current account. Then log back in using the credentials for Tenant B (if prompted, use the testing credentials or tenant switcher). Navigate back to the leads/CRM section.`);

    // 5. Look for the leak
    const leakExtraction = await bot.extract(
      `Analyze the entire screen, including all rows, tables, and cards in the CRM. Is there ANY mention of a lead named '${leadName}' or email 'leaktest@example.com'? Return true if you see it anywhere.`,
      { schema: z.object({ hasLeakedData: z.boolean() }) }
    );

    if (leakExtraction.hasLeakedData) {
      throw new Error(`[DATA LEAK DETECTED] Tenant B was able to see Tenant A's lead: ${leadName}`);
    }

    console.log("✅ Tenant Leak Check Passed: Multi-tenant data remains isolated.");
    return true;
  });
}

// Run if executed directly
if (require.main === module) {
  runTenantLeakCheck().catch(console.error);
}
