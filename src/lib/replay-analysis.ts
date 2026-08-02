// Pure derivation helpers shared by the Decision Inspector and Analysis
// Console — no React, no fabricated data. Every function here either reads a
// real field straight off an engine event/payload, or computes a value whose
// formula is documented in its own comment (heuristics are labeled as such,
// never presented as engine-provided truth).
//
// Tree-flattening, position/latency, and event-presentation logic have moved
// to lib/trading/ — those pieces are generic over any RuntimeEvent[] stream
// (no backtest-chunk-store dependency) and are now shared with the Live tab.
// Re-exported here so no existing import site in this codebase needed to
// change; only genuinely backtest-specific derivations stay in this file.

import {
  isEvalGroup,
  type ConditionEvent,
  type EvalTreeNode,
  type PolicyEvent,
  type PortfolioSnapshotEventType,
  type MarginCallEventType,
  type ReplayCandle,
  type ReplayEventNode,
} from "@/types/replay";

export {
  flattenCandleTree,
  flattenAllTrees,
  buildCandleTrees,
} from "@/lib/trading/candle-tree";
export { computeCurrentPosition, computeFillLatencyMs } from "@/lib/trading/position-and-latency";
export type { CurrentPosition } from "@/lib/trading/position-and-latency";
export { presentEvent } from "@/lib/trading/event-presentation";
export type { EventPresentation } from "@/lib/trading/event-presentation";

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
