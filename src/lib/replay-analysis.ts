// Pure derivation helpers shared by the Decision Inspector and Analysis
// Console — no React, no fabricated data. Every function here either reads a
// real field straight off an engine event/payload, or computes a value whose
// formula is documented in its own comment (heuristics are labeled as such,
// never presented as engine-provided truth).

import {
  isEvalGroup,
  type CandleTreeGroup,
  type ConditionEvent,
  type EvalTreeNode,
  type PolicyEvent,
  type PortfolioSnapshotEventType,
  type MarginCallEventType,
  type ReplayCandle,
  type ReplayEventNode,
} from "@/types/replay";

// ─── Tree flattening ───────────────────────────────────────────────────────

/** Recursively flattens one candle's nested event tree (events + orphans)
 * into a flat list. Shared by the Decision Inspector, Analysis Console, and
 * chart marker logic — previously duplicated per-file. */
export function flattenCandleTree(tree: CandleTreeGroup): ReplayEventNode[] {
  const out: ReplayEventNode[] = [];
  const walk = (nodes: ReplayEventNode[]) => {
    for (const node of nodes) {
      out.push(node);
      if (node.children.length > 0) walk(node.children);
    }
  };
  walk(tree.events);
  walk(tree.orphans);
  return out;
}

/** Flattens every candle tree in a window into one flat event list, sorted
 * by sequence number. Used where a component needs events across the whole
 * loaded window, not just the current bar (e.g. chart markers). */
export function flattenAllTrees(trees: CandleTreeGroup[]): ReplayEventNode[] {
  return trees.flatMap(flattenCandleTree).sort((a, b) => a.sequence_number - b.sequence_number);
}

// ─── Decision quality + reason tags ───────────────────────────────────────

export interface DecisionQuality {
  pct: number;
  passed: number;
  total: number;
  label: "Strong" | "Moderate" | "Weak" | "N/A";
}

function isConditionEvent(node: ReplayEventNode): node is ReplayEventNode & ConditionEvent {
  return node.type === "CONDITION_EVALUATED";
}

/** All CONDITION_EVALUATED events at the current bar — a strategy typically
 * fires several named conditions per bar (e.g. "cond-long", "cond-short",
 * filter conditions), not one big tree, so this reads across all of them. */
export function findConditionEvents(flatEvents: ReplayEventNode[]): ConditionEvent[] {
  return flatEvents.filter(isConditionEvent);
}

export function computeDecisionQuality(conditionEvents: ConditionEvent[]): DecisionQuality {
  const total = conditionEvents.length;
  if (total === 0) return { pct: 0, passed: 0, total: 0, label: "N/A" };
  const passed = conditionEvents.filter((c) => c.payload.passed).length;
  const pct = Math.round((passed / total) * 100);
  const label = pct >= 80 ? "Strong" : pct >= 50 ? "Moderate" : "Weak";
  return { pct, passed, total, label };
}

const REASON_KEYWORDS: [RegExp, string][] = [
  [/EMA|SMA|WMA|VWMA/i, "Trend"],
  [/RSI|MACD/i, "Momentum"],
  [/ATR/i, "Volatility"],
  [/size|margin|exposure|leverage/i, "Risk"],
];

function collectLeafOperandNames(node: EvalTreeNode, out: string[]): void {
  if (isEvalGroup(node)) {
    for (const child of node.children) collectLeafOperandNames(child, out);
    return;
  }
  if (node.name) out.push(node.name);
  if (node.left) out.push(node.left.name);
  if (node.right) out.push(node.right.name);
}

/** Heuristic: infers a coarse semantic category per condition from which
 * indicator types its operands reference. The engine doesn't tag conditions
 * with a category — this is a best-effort client-side inference. */
export function inferReasonTags(conditionEvents: ConditionEvent[]): string[] {
  const tags = new Set<string>();
  for (const ev of conditionEvents) {
    const names: string[] = [];
    collectLeafOperandNames(ev.payload.evaluation, names);
    names.push(ev.payload.expression);
    for (const name of names) {
      for (const [pattern, tag] of REASON_KEYWORDS) {
        if (pattern.test(name)) tags.add(tag);
      }
    }
  }
  return Array.from(tags);
}

// ─── Market layer heuristics ───────────────────────────────────────────────

/** UTC-hour bucket — a rough proxy for which major market is active, not
 * real exchange session data (crypto trades 24/7; this is just a clock read). */
export function deriveSession(timestampMs: number): "Asia" | "London" | "New York" | "Off-hours" {
  const hour = new Date(timestampMs).getUTCHours();
  if (hour >= 0 && hour < 8) return "Asia";
  if (hour >= 8 && hour < 13) return "London";
  if (hour >= 13 && hour < 21) return "New York";
  return "Off-hours";
}

/** Simple close-vs-close-N-bars-back direction — not a trend indicator. */
export function deriveTrend(candles: ReplayCandle[], currentIndex: number, lookback = 10): "Up" | "Down" | "Flat" {
  const current = candles.find((c) => c.candle_index === currentIndex);
  const past = candles.find((c) => c.candle_index === currentIndex - lookback);
  if (current?.close == null || past?.close == null) return "Flat";
  const changePct = ((current.close - past.close) / past.close) * 100;
  if (changePct > 0.1) return "Up";
  if (changePct < -0.1) return "Down";
  return "Flat";
}

// ─── Execution steps, policies, position ──────────────────────────────────

export interface ExecutionStep {
  label: string;
  timestamp: number;
  type: string;
}

/** Maps the real order/position/policy lifecycle to human-readable steps.
 * Only steps this engine actually models are included — there's no
 * "risk approved" or "exchange accepted" event, so those brief-requested
 * steps are intentionally absent rather than invented. */
export function buildExecutionSteps(flatEvents: ReplayEventNode[]): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  for (const ev of flatEvents) {
    switch (ev.type) {
      case "ACTION_TRIGGERED":
        steps.push({ label: "Signal Generated", timestamp: ev.timestamp, type: ev.type });
        break;
      case "ORDER_CREATED":
        steps.push({ label: "Order Created", timestamp: ev.timestamp, type: ev.type });
        break;
      case "ORDER_SUBMITTED":
        steps.push({ label: "Order Submitted", timestamp: ev.timestamp, type: ev.type });
        break;
      case "ORDER_FILLED":
        steps.push({ label: "Filled", timestamp: ev.timestamp, type: ev.type });
        break;
      case "ORDER_REJECTED":
        steps.push({ label: "Rejected", timestamp: ev.timestamp, type: ev.type });
        break;
      case "ORDER_CANCELLED":
        steps.push({ label: "Cancelled", timestamp: ev.timestamp, type: ev.type });
        break;
      case "POSITION_OPENED":
        steps.push({ label: "Position Opened", timestamp: ev.timestamp, type: ev.type });
        break;
      case "POSITION_CLOSED":
        steps.push({ label: "Position Closed", timestamp: ev.timestamp, type: ev.type });
        break;
      case "POLICY_ARMED": {
        const policyType = (ev as ReplayEventNode & PolicyEvent).payload.policy_type;
        const label = policyType === "TAKE_PROFIT" ? "Take Profit Armed" : "Stop Loss Armed";
        steps.push({ label, timestamp: ev.timestamp, type: ev.type });
        break;
      }
    }
  }
  return steps.sort((a, b) => a.timestamp - b.timestamp);
}

/** Fill latency in ms — real timestamp delta between submit and fill, when
 * both events exist for this bar. */
export function computeFillLatencyMs(flatEvents: ReplayEventNode[]): number | null {
  const submitted = flatEvents.find((e) => e.type === "ORDER_SUBMITTED");
  const filled = flatEvents.find((e) => e.type === "ORDER_FILLED");
  if (!submitted || !filled) return null;
  return filled.timestamp - submitted.timestamp;
}

export interface ActivePolicies {
  stopLoss?: number;
  takeProfit?: number;
  liquidation?: number;
}

/** Most recent armed policy per type + most recent predictive liquidation
 * price, all from real events within the flattened list passed in. */
export function findActivePolicies(flatEvents: ReplayEventNode[]): ActivePolicies {
  const result: ActivePolicies = {};
  for (const ev of flatEvents) {
    if (ev.type === "POLICY_ARMED") {
      const payload = (ev as ReplayEventNode & PolicyEvent).payload;
      if (payload.policy_type === "TAKE_PROFIT") result.takeProfit = payload.trigger_price;
      else if (payload.policy_type === "STOP_LOSS" || payload.policy_type === "TRAILING_STOP") {
        result.stopLoss = payload.trigger_price;
      }
    } else if (ev.type === "MARGIN_CALL") {
      result.liquidation = (ev as ReplayEventNode & MarginCallEventType).payload.liquidation_price;
    }
  }
  return result;
}

export interface CurrentPosition {
  side: "LONG" | "SHORT" | "FLAT";
  quantity?: number;
  entryPrice?: number;
}

/** Scans for the most recent POSITION_OPENED without a later POSITION_CLOSED,
 * up to and including the given bar's events. */
export function computeCurrentPosition(flatEventsUpToBar: ReplayEventNode[]): CurrentPosition {
  const sorted = [...flatEventsUpToBar].sort((a, b) => a.sequence_number - b.sequence_number);
  let open: { side: string; quantity?: number; entryPrice?: number } | null = null;
  for (const ev of sorted) {
    if (ev.type === "POSITION_OPENED") {
      const payload = ev.payload as Record<string, unknown>;
      open = {
        side: String(payload.side ?? "LONG"),
        quantity: typeof payload.quantity === "number" ? payload.quantity : undefined,
        entryPrice: typeof payload.entry_price === "number" ? payload.entry_price : undefined,
      };
    } else if (ev.type === "POSITION_CLOSED") {
      open = null;
    }
  }
  if (!open) return { side: "FLAT" };
  return {
    side: open.side.toUpperCase().includes("SHORT") || open.side.toUpperCase() === "SELL" ? "SHORT" : "LONG",
    quantity: open.quantity,
    entryPrice: open.entryPrice,
  };
}

// ─── Portfolio ─────────────────────────────────────────────────────────────

export function findPortfolioSnapshot(flatEvents: ReplayEventNode[]): PortfolioSnapshotEventType["payload"] | null {
  const snapshot = flatEvents.find((e) => e.type === "PORTFOLIO_SNAPSHOT");
  return snapshot ? (snapshot as ReplayEventNode & PortfolioSnapshotEventType).payload : null;
}

/** One visited bar's real PORTFOLIO_SNAPSHOT payload, keyed by the bar it was
 * observed at. Accumulated client-side as the user steps through replay —
 * never includes bars ahead of where they've actually scrubbed, so the
 * "equity curve" it feeds is a live-growing view, not a spoiler of the whole
 * run's outcome. */
export interface PortfolioHistoryPoint {
  candleIndex: number;
  cash: number;
  equity: number;
  gross_exposure: number;
  drawdown: number;
}

/** drawdown[i] = (peak-so-far - equity[i]) / peak-so-far — direct derivation
 * from the run's own equity_preview, shared by the Portfolio tab's mini
 * sparkline and Smart Search's "Largest Drawdown" jump target. */
export function computeDrawdownSeries(equityPreview: [number, number][]): [number, number][] {
  let peak = -Infinity;
  return equityPreview.map(([t, equity]) => {
    peak = Math.max(peak, equity);
    const drawdown = peak > 0 ? (peak - equity) / peak : 0;
    return [t, drawdown] as [number, number];
  });
}

// ─── Event presentation registry ───────────────────────────────────────────
//
// One formatter per event type, each producing everything the Timeline table
// (and anything else) needs — label / node / details — from real fields only
// (per crypalgos_core/events/engine_events.py). A registry instead of parallel
// switch statements: adding a new event type means adding one entry here, not
// touching three different functions.

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
      details: values ? Object.entries(values).map(([k, v]) => `${k}: ${fmt(v)}`).join("  ") : "—",
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

// ─── Metric qualitative labels ─────────────────────────────────────────────

/** Fixed, documented thresholds — not a model. Same spirit as
 * computeDecisionQuality's Strong/Moderate/Weak labeling. */
export function computeMetricLabel(metricName: string, value: number): string {
  switch (metricName) {
    case "sharpe":
      return value >= 2 ? "Excellent" : value >= 1 ? "Good" : "Weak";
    case "max_drawdown_pct":
      return value <= 10 ? "Low Drawdown" : value <= 25 ? "Moderate" : "High";
    case "win_rate":
      return value >= 0.6 ? "Strong" : value >= 0.45 ? "Average" : "Weak";
    case "profit_factor":
      return value >= 2 ? "Excellent" : value >= 1.2 ? "Good" : "Weak";
    default:
      return "";
  }
}

// ─── Trade narrative ("Explain This Trade" / Decision Summary) ────────────

export interface TradeNarrativeContext {
  actionSide: string | null; // "BUY" | "SELL" | null when no action fired
  conditionEvents: ConditionEvent[];
  quality: DecisionQuality;
  executionSteps: ExecutionStep[];
  policies: ActivePolicies;
  portfolio: PortfolioSnapshotEventType["payload"] | null;
}

/** Deterministic template over already-computed real data — not an LLM call.
 * Two branches: a trade fired (action branch) or nothing did (no-action
 * branch, which is just as important for "why didn't it act"). */
export function buildTradeNarrative(ctx: TradeNarrativeContext): string {
  const passedConditions = ctx.conditionEvents.filter((c) => c.payload.passed);
  const failedConditions = ctx.conditionEvents.filter((c) => !c.payload.passed);

  if (!ctx.actionSide) {
    if (ctx.conditionEvents.length === 0) {
      return "No conditions were evaluated at this bar.";
    }
    const passedText = passedConditions.length
      ? `${passedConditions.map((c) => c.payload.expression).join("; ")} passed.`
      : "No conditions passed.";
    const failedText = failedConditions.length
      ? ` ${failedConditions.map((c) => c.payload.expression).join("; ")} did not.`
      : "";
    return `No trade executed. The strategy evaluated all conditions — ${passedText}${failedText} Execution was intentionally skipped.`;
  }

  const parts: string[] = [`${ctx.actionSide} triggered because ${passedConditions.map((c) => c.payload.expression).join("; ") || "conditions were met"}.`];

  const filled = ctx.executionSteps.find((s) => s.label === "Filled");
  const rejected = ctx.executionSteps.find((s) => s.label === "Rejected");
  if (filled) parts.push("The order was submitted and filled.");
  else if (rejected) parts.push("The order was rejected.");

  if (ctx.policies.stopLoss != null || ctx.policies.takeProfit != null) {
    const policyParts: string[] = [];
    if (ctx.policies.stopLoss != null) policyParts.push(`stop-loss armed at ${ctx.policies.stopLoss.toLocaleString()}`);
    if (ctx.policies.takeProfit != null) policyParts.push(`take-profit armed at ${ctx.policies.takeProfit.toLocaleString()}`);
    parts.push(`${policyParts.join(" and ")}.`.replace(/^./, (c) => c.toUpperCase()));
  }

  if (ctx.portfolio) {
    const exposurePct = (ctx.portfolio.gross_exposure * 100).toFixed(0);
    const unrealized = ctx.portfolio.equity - ctx.portfolio.cash;
    parts.push(
      `Position increased exposure to ${exposurePct}%, with unrealized PnL at ${unrealized >= 0 ? "+" : ""}${unrealized.toFixed(2)}.`
    );
  }

  return parts.join(" ");
}
