// Shared color language across the replay page: every event/section gets one
// of these six categories consistently, so a "risk" dot always means the
// same thing whether it's in the Timeline tab or the Decision Inspector.
export const REPLAY_COLORS = {
  market: "#3b82f6",
  trading: "#22c55e",
  risk: "#f97316",
  indicators: "#a78bfa",
  system: "#6b7280",
  error: "#ef4444",
} as const;

export type ReplayColorCategory = keyof typeof REPLAY_COLORS;

export function categoryForEventType(type: string): ReplayColorCategory {
  if (type.endsWith("_REJECTED") || type === "ERROR") return "error";
  if (type === "BAR_CLOSED" || type === "INDICATOR_SNAPSHOT") return "indicators";
  if (
    type === "POLICY_ARMED" ||
    type === "POLICY_TRIGGERED" ||
    type === "LIQUIDATION" ||
    type === "MARGIN_CALL"
  ) {
    return "risk";
  }
  if (type === "PORTFOLIO_SNAPSHOT") return "system";
  if (
    type === "CONDITION_EVALUATED" ||
    type.startsWith("ACTION_") ||
    type.startsWith("ORDER_") ||
    type.startsWith("POSITION_")
  ) {
    return "trading";
  }
  return "system";
}
