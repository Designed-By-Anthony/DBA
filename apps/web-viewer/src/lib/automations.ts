import { db } from "@/lib/firebase";
import type { AutomationAction, AutomationTrigger } from "./types";
import { sendProspectEmailFromTemplate } from "@/lib/prospect-email";

/**
 * Automations Core Engine
 * Listens to lifecycle events and blindly executes "If X -> Then Y" logic.
 */
export async function processAutomations(
  agencyId: string,
  prospectId: string,
  trigger: AutomationTrigger,
  triggerData: Record<string, unknown> = {}
): Promise<void> {
  try {
    // 1. Load active workflow rules for this tenant
    const rulesSnap = await db.collection("automations")
      .where("agencyId", "==", agencyId)
      .where("isActive", "==", true)
      .where("trigger", "==", trigger)
      .get();
      
    if (rulesSnap.empty) return;
    
    // 2. Process all triggered actions contextually
    for (const doc of rulesSnap.docs) {
      const rule = doc.data();
      await executeRuleAction(agencyId, prospectId, rule.action as AutomationAction, triggerData, rule.name);
    }
  } catch (err) {
    console.error(`[Automations] Engine evaluation failed for prospect ${prospectId}:`, err);
  }
}

async function executeRuleAction(
  agencyId: string, 
  prospectId: string, 
  action: AutomationAction, 
  contextData: Record<string, unknown>,
  ruleName: string
) {
  try {
    const prospectRef = db.collection("prospects").doc(prospectId);
    
    switch (action.type) {
      case 'add_tag': {
        const tag = String(action.payload.tag);
        const snapshot = await prospectRef.get();
        const snapshotData = snapshot.data();
        const currentTags = Array.isArray(snapshotData?.tags)
          ? (snapshotData.tags as string[])
          : [];
        await prospectRef.update({
          tags: Array.from(new Set([...currentTags, tag])),
        });
        await logAutomationActivity(agencyId, prospectId, ruleName, `Added tag: ${tag}`);
        break;
      }
      case 'change_status': {
        const newStatus = String(action.payload.status);
        await prospectRef.update({ status: newStatus });
        await logAutomationActivity(agencyId, prospectId, ruleName, `Changed status to: ${newStatus}`);
        break;
      }
      case 'create_activity': {
        const title = String(action.payload.title || 'System Task');
        await db.collection("activities").add({
          agencyId,
          prospectId,
          type: "note_added",
          title,
          description: `Spawned by Automation Rules Engine`,
          metadata: { ruleName },
          createdAt: new Date().toISOString(),
        });
        break;
      }
      case 'send_email': {
        const subject = String(action.payload.subject || "Hello");
        const bodyHtml = String(
          action.payload.bodyHtml || action.payload.body || "<p>Hello {{name}},</p>",
        );
        const result = await sendProspectEmailFromTemplate({
          agencyId,
          prospectId,
          subject,
          bodyHtml,
        });
        await logAutomationActivity(
          agencyId,
          prospectId,
          ruleName,
          result.ok ? `Email sent: ${subject}` : `Email failed: ${result.error || "unknown"}`,
        );
        break;
      }
      default:
        console.warn(`[Automations] Unrecognized action type: ${action.type}`);
    }
  } catch (err) {
    console.error(`[Automations] Failed to execute action ${action.type}:`, err);
  }
}

// Utility to keep an audit trail of robotic actions
async function logAutomationActivity(agencyId: string, prospectId: string, ruleName: string, detail: string) {
  await db.collection("activities").add({
    agencyId,
    prospectId,
    type: "note_added",
    title: `⚡ Workflow Executed: ${ruleName}`,
    description: detail,
    metadata: { isAutomated: true },
    createdAt: new Date().toISOString(),
  });
}
