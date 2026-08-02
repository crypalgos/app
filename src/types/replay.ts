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

export interface PositionOpenedPayload {
  position_id: string;
  side: string;
  quantity: number;
  entry_price: number;
}

export interface PositionEvent extends EngineEventBase {
  type: "POSITION_OPENED" | "POSITION_REDUCED" | "POSITION_CLOSED";
  payload: Partial<PositionOpenedPayload> & {
    order_id?: string | null;
    fill_price?: number;
    realized_pnl?: number;
    quantity_reduced?: number;
    remaining_quantity?: number;
  };
}

export interface PolicyArmedPayload {
  policy_id: string;
  policy_type: string;
  trigger_price: number;
}

export interface PolicyEvent extends EngineEventBase {
  type: "POLICY_ARMED" | "POLICY_TRIGGERED";
  payload: PolicyArmedPayload;
}

export interface PortfolioSnapshotPayload {
  cash: number;
  equity: number;
  gross_exposure: number;
  drawdown: number;
}

export interface PortfolioSnapshotEventType extends EngineEventBase {
  type: "PORTFOLIO_SNAPSHOT";
  payload: PortfolioSnapshotPayload;
}

export interface MarginCallPayload {
  position_id: string;
  liquidation_price: number;
  margin_used: number;
}

export interface MarginCallEventType extends EngineEventBase {
  type: "MARGIN_CALL";
  payload: MarginCallPayload;
}

// Anything else in the stream — kept generic since the UI mostly just needs
// `type` + a pretty-printed payload.
export interface GenericEngineEvent extends EngineEventBase {
  type: string;
  payload: Record<string, unknown>;
}

export type RuntimeEvent =
  | ConditionEvent
  | ActionEvent
  | OrderEvent
  | PositionEvent
  | PolicyEvent
  | PortfolioSnapshotEventType
  | MarginCallEventType
  | GenericEngineEvent;

export interface ReplayManifest {
  workspace_version: number;
  schema_version: number;
  datasets: string[];
  bar_count: number;
}

export interface IndicatorValueRecord {
  node_id: string;
  type: string;
  period?: number;
  timeframe?: string;
  source?: string;
  value: number;
}

export function formatIndicatorLabel(entry: IndicatorValueRecord): string {
  return entry.period != null ? `${entry.type} ${entry.period}` : entry.type;
}

export interface IndicatorSnapshotRecord {
  timestamp: number;
  symbol: string;
  timeframe: string;
  bar_index: number;
  datasource: string;
  values: Record<string, IndicatorValueRecord>;
}

// ─── Replay session / window API (crypalgos_core.pipeline.replay_tree +
//     api/app/modules/replay) — a pure read-only re-slicing layer over
//     already-persisted workspace artifacts, never recomputed client-side. ──

export interface ReplayMarker {
  candle_index: number | null;
  timestamp: number | null;
  type: "entry" | "exit" | "policy" | "liquidation";
  symbol_id: string | null;
  sequence_number: number | null;
}

export interface ReplaySession {
  schema_version: number;
  engine_version: string | null;
  created_at: string | null;
  bar_count: number;
  /** Window against [first_candle_index, last_candle_index] — never [0, bar_count-1];
   * indicator warmup means candle_index rarely starts at 0. */
  first_candle_index: number | null;
  last_candle_index: number | null;
  trade_count: number;
  indicator_count: number;
  symbols: string[];
  datasets: string[];
  markers: ReplayMarker[];
  max_window_candles: number;
  /** Candles per Arrow-IPC replay chunk — see /replay/chunks/{dataset}/{chunk_id}. */
  chunk_size: number;
}

export interface ReplayCandle {
  candle_index: number;
  timestamp?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  [key: string]: unknown;
}

/** A RuntimeEvent plus its nested children — build_candle_trees() output. */
export type ReplayEventNode = RuntimeEvent & { children: ReplayEventNode[] };

export interface CandleTreeGroup {
  candle_index: number;
  bar: ReplayEventNode | null;
  events: ReplayEventNode[];
  orphans: ReplayEventNode[];
}

export interface ReplayTradeDetail {
  schema_version: number;
  trade: Record<string, unknown>;
  entry_candle: number | null;
  exit_candle: number | null;
  entry_event: RuntimeEvent | null;
  exit_event: RuntimeEvent | null;
  events: RuntimeEvent[];
  entry_tree: CandleTreeGroup | null;
  exit_tree: CandleTreeGroup | null;
  indicators_at_entry: IndicatorSnapshotRecord[];
  indicators_at_exit: IndicatorSnapshotRecord[];
}
