// Shared trading-analysis pipeline stage: OHLCV candles derived from BAR_CLOSED
// events. Backtest gets its candles from a precomputed Arrow dataset, not this
// function — but the derivation is generic over any RuntimeEvent[], for
// anything (live sessions today) sourced from a flat event stream instead.

import type { ReplayCandle, RuntimeEvent } from "@/types/replay";

export function deriveCandlesFrom(events: RuntimeEvent[]): ReplayCandle[] {
  return events
    .filter((e) => e.type === "BAR_CLOSED")
    .map((e): ReplayCandle => {
      const p = e.payload as Record<string, unknown>;
      return {
        candle_index: e.candle_index,
        timestamp: e.timestamp,
        open: typeof p.open === "number" ? p.open : undefined,
        high: typeof p.high === "number" ? p.high : undefined,
        low: typeof p.low === "number" ? p.low : undefined,
        close: typeof p.close === "number" ? p.close : undefined,
        volume: typeof p.volume === "number" ? p.volume : undefined,
      };
    })
    .sort((a, b) => a.candle_index - b.candle_index);
}
