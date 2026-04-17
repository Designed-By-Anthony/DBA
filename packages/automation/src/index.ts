export {
  AUTOMATION_TRIGGERS,
  AUTOMATION_ACTION_TYPES,
  automationTriggerSchema,
  automationActionSchema,
  automationConditionSchema,
  automationRuleSchema,
  automationEventSchema,
  type AutomationTrigger,
  type AutomationAction,
  type AutomationCondition,
  type AutomationRule,
  type AutomationEvent,
  type AutomationRunOutcome,
} from "./types";

export {
  runAutomations,
  loadActiveRules,
  type ActionHandlers,
  type ActionHandlerContext,
  type RunAutomationsOptions,
} from "./engine";

export { factoryRules } from "./defaults";
export { evaluateCondition } from "./condition";
