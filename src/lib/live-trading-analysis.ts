// The "LiveAdapter" half of the shared trading-analysis pipeline (see
// lib/trading/) — replay-store.ts is the "BacktestAdapter" half, already
// producing RuntimeEvent-shaped data via its own chunk selectors.
//
// A live/paper session's events arrive as StrategyEvent {id, type, payload,
// created_at} — EngineEvent base fields (sequence_number, candle_index,
// parent_sequence, root_sequence, node_id, symbol_id, run_id, strategy_id)
// are folded INTO payload on the backend (EventPublisher._flush_locked()),
// not kept as separate top-level fields the way the backtest's
// runtime_events rows are. toRuntimeEvents() undoes that fold, lifting the
// base fields back out so the shared pipeline stages (which all expect
// EngineEventBase at the top level) work identically for both sources.

import type {
  CandleTreeGroup,
  GenericEngineEvent,
  IndicatorSnapshotRecord,
  ReplayCandle,
  ReplayMarker,
} from "@/types/replay";
import type { StrategyEvent } from "@/types/live-trading";
import { buildCandleTrees } from "@/lib/trading/candle-tree";
import { deriveCandlesFrom } from "@/lib/trading/candles";
import { deriveMarkers } from "@/lib/trading/markers";
import { pairTrades, type SessionTrade } from "@/lib/trading/trades";

const BASE_FIELD_KEYS = [
  "sequence_number",
  "timestamp",
  "candle_index",
  "symbol_id",
  "parent_sequence",
  "root_sequence",
  "node_id",
  "run_id",
  "strategy_id",
] as const;

export function toRuntimeEvent(event: StrategyEvent): GenericEngineEvent {
  const payload = { ...event.payload };
  const base: Record<string, unknown> = {};
  for (const key of BASE_FIELD_KEYS) {
    if (key in payload) {
      base[key] = payload[key];
      delete payload[key];
    }
  }

  return {
    sequence_number: typeof base.sequence_number === "number" ? base.sequence_number : 0,
    timestamp:
      typeof base.timestamp === "number" ? base.timestamp : new Date(event.created_at).getTime(),
    candle_index: typeof base.candle_index === "number" ? base.candle_index : 0,
    symbol_id: typeof base.symbol_id === "string" ? base.symbol_id : null,
    parent_sequence: typeof base.parent_sequence === "number" ? base.parent_sequence : null,
    root_sequence: typeof base.root_sequence === "number" ? base.root_sequence : null,
    node_id: typeof base.node_id === "string" ? base.node_id : null,
    run_id: typeof base.run_id === "string" ? base.run_id : "",
    strategy_id: typeof base.strategy_id === "string" ? base.strategy_id : "",
    type: event.type,
    payload,
  };
}

export function toRuntimeEvents(events: StrategyEvent[]): GenericEngineEvent[] {
  return events.map(toRuntimeEvent);
}

/** INDICATOR_SNAPSHOT events, reshaped into the same IndicatorSnapshotRecord
 * shape backtest's replay-store.ts reads (see TickEngine._build_indicator_snapshot()
 * / RuntimeFactory._build_warmup_indicator_snapshot() on the backend) —
 * `datasource` defaults to "" since the live path is single-symbol and never
 * populates it, unlike backtest's multi-datasource runs. */
export function deriveIndicatorSnapshots(events: GenericEngineEvent[]): IndicatorSnapshotRecord[] {
  return events
    .filter((e) => e.type === "INDICATOR_SNAPSHOT")
    .map((e): IndicatorSnapshotRecord => {
      const p = e.payload as Record<string, unknown>;
      return {
        timestamp: e.timestamp,
        symbol: typeof p.symbol === "string" ? p.symbol : "",
        timeframe: typeof p.timeframe === "string" ? p.timeframe : "",
        bar_index: typeof p.bar_index === "number" ? p.bar_index : e.candle_index,
        datasource: "",
        values: (p.values as IndicatorSnapshotRecord["values"]) ?? {},
      };
    });
}

export interface LiveTradingAnalysis {
  candles: ReplayCandle[];
  markers: ReplayMarker[];
  trades: SessionTrade[];
  trees: CandleTreeGroup[];
}

/** Runs a session's raw event stream through the shared pipeline stages. */
export function analyzeLiveEvents(events: StrategyEvent[]): LiveTradingAnalysis {
  const runtimeEvents = toRuntimeEvents(events);
  return {
    candles: deriveCandlesFrom(runtimeEvents),
    markers: deriveMarkers(runtimeEvents),
    trades: pairTrades(runtimeEvents),
    trees: buildCandleTrees(runtimeEvents),
  };
}
