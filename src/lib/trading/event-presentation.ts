// Shared trading-analysis pipeline stage: one formatter per event type,
// producing a human-readable label/node/details from real fields only (per
// crypalgos_core/events/engine_events.py). A registry instead of parallel
// switch statements: adding a new event type means adding one entry here.
// Generic over ReplayEventNode — used by the Analyse tab's Timeline/Console
// and the Live tab's timeline view alike.

import type { IndicatorValueRecord, ReplayEventNode } from "@/types/replay";

export interface EventPresentation {
  /** Plain-language event name, e.g. "BUY signal generated". */
  label: string;
  /** What the event is "about" — a condition's expression, an order's side,
   * a position's symbol. */
  node: string;
  /** Human-readable outcome, e.g. "Order Filled @ 67,842.5". */
  details: string;
}

function fmt(n: unknown, digits = 2): string {
  return typeof n === "number" ? n.toLocaleString(undefined, { maximumFractionDigits: digits }) : String(n ?? "—");
}

type EventFormatter = (event: ReplayEventNode) => EventPresentation;

const EVENT_FORMATTERS: Record<string, EventFormatter> = {
  BAR_CLOSED: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    return {
      label: "Bar closed",
      node: `${p.symbol ?? ""} ${p.timeframe ?? ""}`.trim() || "—",
      details: `O: ${fmt(p.open)}  H: ${fmt(p.high)}  L: ${fmt(p.low)}  C: ${fmt(p.close)}  V: ${fmt(p.volume)}`,
    };
  },
  INDICATOR_SNAPSHOT: (ev) => {
    const values = (ev.payload as Record<string, unknown>).values as Record<string, unknown> | undefined;
    return {
      label: "Indicator updated",
      node: values ? Object.keys(values)[0] ?? "—" : "—",
      details: values
        ? Object.entries(values)
            .map(([k, v]) => `${k}: ${fmt((v as IndicatorValueRecord)?.value)}`)
            .join("  ")
        : "—",
    };
  },
  CONDITION_EVALUATED: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    return {
      label: "Condition evaluated",
      node: String(p.expression ?? ev.node_id ?? "—"),
      details: `Result: ${p.passed ? "TRUE" : "FALSE"}`,
    };
  },
  ACTION_TRIGGERED: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    const side = String(p.action_type ?? "").toUpperCase();
    return {
      label: side ? `${side} signal generated` : "Signal generated",
      node: side || ev.node_id || "—",
      details: `Signal Generated: ${side} ${fmt(p.size)} Units`,
    };
  },
  ACTION_SKIPPED: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    return { label: "Action skipped", node: String(p.action_type ?? ev.node_id ?? "—"), details: String(p.reason ?? "—") };
  },
  ACTION_REJECTED: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    return { label: "Action rejected", node: String(p.action_type ?? ev.node_id ?? "—"), details: String(p.reason ?? "—") };
  },
  ORDER_CREATED: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    return {
      label: "Order created",
      node: String(p.side ?? "—").toUpperCase(),
      details: `${String(p.order_type ?? "Order")} order created: ${fmt(p.size)} @ ${fmt(p.price)}`,
    };
  },
  ORDER_SUBMITTED: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    return { label: "Order submitted", node: String(p.side ?? "—").toUpperCase(), details: `Order submitted: ${fmt(p.quantity)} @ ${fmt(p.price)}` };
  },
  ORDER_FILLED: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    return {
      label: "Market order filled",
      node: String(p.side ?? "—").toUpperCase(),
      details: `Order Filled @ ${fmt(p.fill_price)}${typeof p.fee === "number" ? ` (fee ${fmt(p.fee)})` : ""}`,
    };
  },
  ORDER_CANCELLED: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    return { label: "Order cancelled", node: String(p.side ?? "—").toUpperCase(), details: String(p.reason ?? "—") };
  },
  ORDER_REJECTED: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    return { label: "Order rejected", node: String(p.side ?? "—").toUpperCase(), details: String(p.reason ?? "—") };
  },
  POSITION_OPENED: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    const side = String(p.side ?? "").toUpperCase();
    return {
      label: side ? `${side} position opened` : "Position opened",
      node: ev.symbol_id ?? "—",
      details: `Position Opened: ${side} ${fmt(p.quantity)} @ ${fmt(p.entry_price)}`,
    };
  },
  POSITION_REDUCED: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    return {
      label: "Position reduced",
      node: ev.symbol_id ?? "—",
      details: `Reduced ${fmt(p.quantity_reduced)}, ${fmt(p.remaining_quantity)} remaining @ ${fmt(p.fill_price)}`,
    };
  },
  POSITION_CLOSED: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    const pnl = Number(p.realized_pnl);
    return {
      label: "Position closed",
      node: ev.symbol_id ?? "—",
      details: `Position Closed @ ${fmt(p.fill_price)} | PnL: ${pnl >= 0 ? "+" : ""}${fmt(p.realized_pnl)}`,
    };
  },
  POLICY_ARMED: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    const policyType = String(p.policy_type ?? "Policy");
    return {
      label: policyType === "TAKE_PROFIT" ? "Take-profit armed" : "Stop-loss armed",
      node: policyType,
      details: `${policyType} armed @ ${fmt(p.trigger_price)}`,
    };
  },
  POLICY_TRIGGERED: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    const policyType = String(p.policy_type ?? "Policy");
    return { label: "Policy triggered", node: policyType, details: `${policyType} triggered @ ${fmt(p.trigger_price)}` };
  },
  MARGIN_CALL: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    return {
      label: "Margin call",
      node: ev.symbol_id ?? "—",
      details: `Liquidation price ${fmt(p.liquidation_price)}, margin used ${fmt(p.margin_used)}`,
    };
  },
  LIQUIDATION: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    return { label: "Liquidation", node: ev.symbol_id ?? "—", details: `Liquidated @ ${fmt(p.fill_price)} | PnL: ${fmt(p.realized_pnl)}` };
  },
  PORTFOLIO_SNAPSHOT: (ev) => {
    const p = ev.payload as Record<string, unknown>;
    return { label: "Portfolio snapshot", node: "—", details: `Cash: ${fmt(p.cash)}  Equity: ${fmt(p.equity)}` };
  },
};

/** Resolves an event's Timeline presentation. The raw `type` string always
 * stays available in the Debug tab for anyone who needs the engine's own
 * vocabulary; unregistered types fall back to it here too. */
export function presentEvent(event: ReplayEventNode): EventPresentation {
  const formatter = EVENT_FORMATTERS[event.type];
  if (formatter) return formatter(event);
  return { label: event.type, node: event.node_id ?? "—", details: "—" };
}
