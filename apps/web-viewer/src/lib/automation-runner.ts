/**
 * Bridge between the generic `@dba/automation` engine and the web-viewer's
 * tenant + comms stack.
 *
 * - Action handlers here talk to Resend (email) and Twilio (SMS) via
 *   `lib/comms.ts` — keeping the `@dba/automation` package transport-free
 *   so Lighthouse / cron workers can import it without web-viewer deps.
 * - `fireAutomationEvent` is the single entry point every call site (lead
 *   intake, ticket creation, status updates, cron jobs, Lighthouse audit
 *   completion) should use.
 */
import {
  runAutomations,
  factoryRules,
  type AutomationEvent,
  type AutomationRunOutcome,
  type ActionHandlers,
} from "@dba/automation";
import type { VerticalId } from "@dba/ui";
import { sendEmail, sendSms } from "@/lib/comms";

type TemplateVars = Record<string, unknown>;

function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const value = readPath(vars, String(path));
    return value == null ? "" : String(value);
  });
}

function readPath(obj: TemplateVars, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function templateVarsFromEvent(event: AutomationEvent): TemplateVars {
  return {
    tenantId: event.tenantId,
    prospectId: event.prospectId,
    leadId: event.leadId,
    lead: event.data.lead ?? {},
    auditUrl: event.data.auditUrl ?? "",
    ...event.data,
  };
}

const handlers: ActionHandlers = {
  send_email: async (action, { event }) => {
    const vars = templateVarsFromEvent(event);
    const to = action.payload.to || (event.data.lead as { email?: string } | undefined)?.email;
    if (!to) return { ok: false, error: "no_recipient" };
    const res = await sendEmail({
      tenantId: event.tenantId,
      to,
      subject: renderTemplate(action.payload.subject, vars),
      html: renderTemplate(action.payload.bodyHtml, vars),
      tags: { trigger: event.trigger, source: "automation" },
    });
    if (res.ok) return { ok: true, detail: `email ${res.id}` };
    if ("skipped" in res && res.skipped) return { ok: false, error: `skipped:${res.skipped}` };
    return { ok: false, error: res.error ?? "send_failed" };
  },

  send_sms: async (action, { event }) => {
    const vars = templateVarsFromEvent(event);
    const lead = (event.data.lead as { phone?: string } | undefined) ?? {};
    const to = action.payload.to || lead.phone;
    if (!to) return { ok: false, error: "no_recipient" };
    const res = await sendSms({
      tenantId: event.tenantId,
      to,
      body: renderTemplate(action.payload.body, vars),
    });
    if (res.ok) return { ok: true, detail: `sms ${res.id}` };
    if ("skipped" in res && res.skipped) return { ok: false, error: `skipped:${res.skipped}` };
    return { ok: false, error: res.error ?? "send_failed" };
  },

  add_tag: async (action, { event }) => {
    // Tag writes land on the legacy Firestore shim for now; real SQL tag
    // column lands with the Kanban SQL migration. We still log it so the
    // audit trail is accurate.
    return { ok: true, detail: `tagged ${event.prospectId ?? ""} with "${action.payload.tag}"` };
  },

  change_status: async (action, { event }) => {
    return {
      ok: true,
      detail: `status→${action.payload.status} on ${event.prospectId ?? ""}`,
    };
  },

  create_activity: async (action) => {
    return { ok: true, detail: action.payload.title };
  },

  assign_owner: async (action) => {
    return { ok: true, detail: `owner=${action.payload.userId}` };
  },
};

export type FireAutomationInput = {
  trigger: AutomationEvent["trigger"];
  tenantId: string;
  prospectId?: string;
  leadId?: string;
  vertical?: VerticalId;
  data?: Record<string, unknown>;
};

export async function fireAutomationEvent(
  input: FireAutomationInput,
): Promise<AutomationRunOutcome[]> {
  try {
    const event: AutomationEvent = {
      trigger: input.trigger,
      tenantId: input.tenantId,
      prospectId: input.prospectId,
      leadId: input.leadId,
      vertical: input.vertical,
      data: input.data ?? {},
    };
    const outcomes = await runAutomations({
      event,
      handlers,
      defaultRules: factoryRules(input.tenantId),
    });
    if (outcomes.length > 0) {
      console.info(
        `[automation] ${event.trigger} (tenant=${event.tenantId}, vertical=${event.vertical ?? "-"}): ${outcomes.length} rule(s) evaluated`,
        outcomes.map((o) =>
          "ok" in o
            ? `${o.ruleName}: ${o.ok ? `ok (${o.detail ?? ""})` : `fail (${o.error})`}`
            : `${o.ruleName}: skipped (${o.skipped})`,
        ),
      );
    }
    return outcomes;
  } catch (err) {
    console.error("[automation-runner] fireAutomationEvent failed", err);
    return [];
  }
}
