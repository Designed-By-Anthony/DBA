/**
 * First-response SLA targets (business hours not modeled — wall-clock hours from ticket creation).
 */
export const SLA_HOURS_BY_PRIORITY: Record<"urgent" | "high" | "medium" | "low", number> = {
  urgent: 4,
  high: 24,
  medium: 48,
  low: 72,
};

export type SlaUiState =
  | { kind: "met"; respondedAt: string }
  | { kind: "ok"; hoursRemaining: number; deadline: Date }
  | { kind: "warning"; hoursRemaining: number; deadline: Date }
  | { kind: "breach"; hoursOver: number; deadline: Date };

function hoursBetween(a: number, b: number): number {
  return (b - a) / (1000 * 60 * 60);
}

export function getTicketSlaState(
  createdAt: string,
  priority: string,
  firstResponseAt?: string | null,
  nowMs: number = Date.now(),
): SlaUiState {
  if (firstResponseAt) {
    return { kind: "met", respondedAt: firstResponseAt };
  }
  const p = (["urgent", "high", "medium", "low"].includes(priority)
    ? priority
    : "medium") as keyof typeof SLA_HOURS_BY_PRIORITY;
  const hours = SLA_HOURS_BY_PRIORITY[p] ?? 48;
  const created = new Date(createdAt).getTime();
  const deadline = created + hours * 60 * 60 * 1000;
  const remain = hoursBetween(nowMs, deadline);

  if (remain < 0) {
    return { kind: "breach", hoursOver: -remain, deadline: new Date(deadline) };
  }
  if (remain <= Math.min(2, hours * 0.1)) {
    return { kind: "warning", hoursRemaining: remain, deadline: new Date(deadline) };
  }
  return { kind: "ok", hoursRemaining: remain, deadline: new Date(deadline) };
}
