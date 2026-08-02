export type LiveTradingMode = "LIVE" | "PAPER";
export type LiveSessionEnvironment = "TESTNET" | "PRODUCTION";

export type LiveSessionStatus =
  | "STARTING"
  | "RUNNING"
  | "STOPPING"
  | "STOPPED"
  | "ERROR";

export const ACTIVE_SESSION_STATUSES: LiveSessionStatus[] = [
  "STARTING",
  "RUNNING",
  "STOPPING",
];

export interface LiveTradingSession {
  id: string;
  strategy_id: string;
  version_id: string | null;
  mode: LiveTradingMode;
  broker: string;
  exchange: string;
  environment: LiveSessionEnvironment;
  symbol: string;
  timeframe: string;
  credential_id: string | null;
  status: LiveSessionStatus;
  celery_task_id: string | null;
  error_msg: string | null;
  heartbeat_at: string | null;
  last_processed_timestamp: string | null;
  started_at: string | null;
  stopped_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StartLiveSessionRequest {
  mode: LiveTradingMode;
  broker: string;
  credential_id?: string | null;
}

export interface StartLiveSessionResponse {
  session_id: string;
  mode: LiveTradingMode;
  broker: string;
  exchange: string;
  environment: LiveSessionEnvironment;
  symbol: string;
  timeframe: string;
  status: LiveSessionStatus;
  celery_task_id: string;
  message: string;
}

export interface StopLiveSessionResponse {
  session_id: string;
  status: LiveSessionStatus;
  message: string;
}

/**
 * Mirrors crypalgos_core EngineEvent.to_dict()'s type naming: CamelCase class
 * name -> CONSTANT_CASE with the trailing "_EVENT" suffix stripped
 * (e.g. OrderFilledEvent -> "ORDER_FILLED"). Kept as a plain string union
 * rather than importing from the backend — new event types should still
 * render (via the generic fallback), just without a friendly label/icon.
 */
export type StrategyEventType =
  | "ORDER_CREATED"
  | "ORDER_SUBMITTED"
  | "ORDER_FILLED"
  | "ORDER_CANCELLED"
  | "ORDER_REJECTED"
  | "POSITION_OPENED"
  | "POSITION_REDUCED"
  | "POSITION_CLOSED"
  | "POLICY_ARMED"
  | "POLICY_TRIGGERED"
  | "RISK_VIOLATION"
  | "MARGIN_CALL"
  | "LIQUIDATION"
  | "BAR_CLOSED"
  | "CONDITION_EVALUATED"
  | "ACTION_TRIGGERED"
  | "ACTION_REJECTED"
  | "ACTION_SKIPPED"
  | "VARIABLE_CHANGED"
  | "NODE_EXECUTED"
  | "PORTFOLIO_SNAPSHOT"
  | "INDICATOR_SNAPSHOT"
  | "FUNDING_PAID"
  | "FEE_CHARGED"
  | (string & {});

export interface StrategyEvent {
  id: string;
  type: StrategyEventType;
  /** EngineEvent base fields (sequence_number, candle_index, parent_sequence,
   * root_sequence, node_id, symbol_id, run_id, strategy_id) folded in
   * alongside the event-specific ones — see EventPublisher._flush_locked()
   * on the backend. Needed to reconstruct a trade's causal chain later. */
  payload: Record<string, unknown>;
  created_at: string;
}

export interface SessionTimeline {
  session_id: string;
  events: StrategyEvent[];
}

/** Sent once, right after connect, hydrating the client from REST scrollback. */
export interface TimelineSnapshotMessage {
  type: "TIMELINE_SNAPSHOT";
  data: SessionTimeline;
}

/**
 * The raw shape every subsequent WS message actually has — EngineEvent's own
 * to_dict(), unmerged (see EventPublisher.broadcast(), which publishes it
 * as-is over Redis, unlike the persist path). No `id` or `created_at` here —
 * normalizeLiveEvent() in use-live-session-stream.ts derives both, which is
 * why raw messages must never be used directly as a StrategyEvent.
 */
export interface RawLiveEngineEvent {
  type: StrategyEventType;
  payload: Record<string, unknown>;
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

/**
 * Broadcast-only, never-persisted price update for the still-forming bar of
 * a strategy whose timeframe is coarser than the raw tick feed (e.g. "1h"
 * over 1-minute Delta ticks — see TradingRuntime.tick()'s PRICE_TICK
 * broadcast). Deliberately NOT a RawLiveEngineEvent: it has no
 * candle_index/sequence_number worth trusting and must never be folded into
 * the events array BAR_CLOSED-derived candles/trades/trees read from, or a
 * partial bar would render as a fake extra candle.
 */
export interface LivePriceTick {
  type: "PRICE_TICK";
  /** Start of the strategy-timeframe bucket represented by the candle. */
  timestamp: number;
  /** Original Delta trade/ticker timestamp, used to reject stale UI updates. */
  source_timestamp?: number;
  payload: {
    symbol: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
}

export type LiveSessionWsMessage =
  | TimelineSnapshotMessage
  | LivePriceTick
  | RawLiveEngineEvent;
