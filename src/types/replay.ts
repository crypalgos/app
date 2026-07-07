// ─── Engine event stream (schema v3 / ADR-008) ────────────────────────────────
//
// Every row in runtime_events.arrow / decision_traces.arrow / execution_logs.arrow
// shares this flat shape. There is no `id`, `correlation_id`, or `parent_event_id`
// (those were legacy Engine v1 fields, deleted in the Engine v2 purge). Causal
// chains are reconstructed via `parent_sequence` (immediate cause) and
// `root_sequence` (the bar that ultimately triggered the chain).

export interface EngineEventBase {
  sequence_number: number;
  timestamp: number;
  candle_index: number;
  symbol_id: string | null;
  parent_sequence: number | null;
  root_sequence: number | null;
  node_id: string | null;
  run_id: string;
  strategy_id: string;
}

// ─── Condition evaluation tree (ADR-008) ──────────────────────────────────────
//
// `evaluation` is a recursive tree mirroring the condition's AST:
//   - a group node has operator "AND" | "OR" and `children`
//   - a leaf node has a comparison operator (">", "<", "CROSSES_ABOVE", ...)
//     and `left`/`right` operands
//   - hand-written (non-compiled) strategies get a degenerate single-leaf
//     fallback: { operator: null, name, passed } — never absent, never empty.

export interface EvalOperand {
  name: string;
  value: unknown;
}

export interface EvalTreeGroup {
  operator: "AND" | "OR";
  children: EvalTreeNode[];
  passed: boolean;
}

export interface EvalTreeLeaf {
  operator: string | null;
  left?: EvalOperand;
  right?: EvalOperand;
  name?: string; // present only on the degenerate hand-written fallback
  passed: boolean;
}

export type EvalTreeNode = EvalTreeGroup | EvalTreeLeaf;

export function isEvalGroup(node: EvalTreeNode): node is EvalTreeGroup {
  return Array.isArray((node as EvalTreeGroup).children);
}

export interface ConditionEvaluatedPayload {
  condition_id: string;
  passed: boolean;
  inputs: Record<string, unknown>;
  expression: string;
  evaluation: EvalTreeNode;
}

export interface ConditionEvent extends EngineEventBase {
  type: "CONDITION_EVALUATED";
  payload: ConditionEvaluatedPayload;
}

export interface ActionEvent extends EngineEventBase {
  type: "ACTION_TRIGGERED" | "ACTION_SKIPPED" | "ACTION_REJECTED";
  payload: {
    action_id?: string;
    action_type?: string;
    size?: number;
    reason?: string;
  };
}

export interface OrderEvent extends EngineEventBase {
  type:
    | "ORDER_CREATED"
    | "ORDER_FILLED"
    | "ORDER_REJECTED"
    | "ORDER_CANCELLED";
  payload: {
    order_id?: string;
    side?: "BUY" | "SELL" | string;
    order_type?: string;
    price?: number;
    fill_price?: number;
    fill_quantity?: number;
    fee?: number;
    reason?: string;
  };
}

// Position/portfolio/policy events and anything else in the stream — kept
// generic since the UI mostly just needs `type` + a pretty-printed payload.
export interface GenericEngineEvent extends EngineEventBase {
  type: string;
  payload: Record<string, unknown>;
}

export type RuntimeEvent = ConditionEvent | ActionEvent | OrderEvent | GenericEngineEvent;

export interface ReplayManifest {
  workspace_version: number;
  schema_version: number;
  datasets: string[];
  bar_count: number;
}

export interface IndicatorSnapshotRecord {
  timestamp: number;
  symbol: string;
  timeframe: string;
  bar_index: number;
  datasource: string;
  values: Record<string, number>;
}
