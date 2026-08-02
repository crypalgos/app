// Shared trading-analysis pipeline stage: pairs POSITION_OPENED with its
// eventual POSITION_REDUCED*/POSITION_CLOSED into a trade record. Backtest
// gets its trades from a precomputed Arrow dataset (TradeProjection) with
// richer fields (gross/net pnl split, fees, funding cost, equity-after) —
// SessionTrade is deliberately smaller, since deriving it client-side from a
// flat event stream can't reconstruct data the engine never emitted for that
// event. The name is mode-agnostic (backtest/paper/live all produce trades,
// not just "live" ones) so this can grow to serve replay too if it ever
// needs a lighter-weight trade view than the full Arrow dataset provides.

import type { RuntimeEvent } from "@/types/replay";

export interface SessionTrade {
  entry_sequence: number;
  exit_sequence: number | null;
  entry_candle_index: number;
  exit_candle_index: number | null;
  entry_time: number;
  exit_time: number | null;
  symbol_id: string | null;
  side: string;
  entry_price: number;
  exit_price: number | null;
  /** Current (post-reduction) quantity while open; final closed quantity once exited. */
  quantity: number;
  realized_pnl: number | null;
  is_open: boolean;
}

/** Single-position-at-a-time pairing (today's live architecture trades one
 * symbol per session) — purely sequential, no position-id matching needed. */
export function pairTrades(events: RuntimeEvent[]): SessionTrade[] {
  const sorted = [...events].sort((a, b) => a.sequence_number - b.sequence_number);
  const trades: SessionTrade[] = [];
  let current: SessionTrade | null = null;

  for (const ev of sorted) {
    const p = ev.payload as Record<string, unknown>;

    if (ev.type === "POSITION_OPENED") {
      current = {
        entry_sequence: ev.sequence_number,
        exit_sequence: null,
        entry_candle_index: ev.candle_index,
        exit_candle_index: null,
        entry_time: ev.timestamp,
        exit_time: null,
        symbol_id: ev.symbol_id,
        side: String(p.side ?? "LONG"),
        entry_price: typeof p.entry_price === "number" ? p.entry_price : 0,
        exit_price: null,
        quantity: typeof p.quantity === "number" ? p.quantity : 0,
        realized_pnl: null,
        is_open: true,
      };
      trades.push(current);
    } else if (ev.type === "POSITION_REDUCED" && current) {
      current.quantity =
        typeof p.remaining_quantity === "number" ? p.remaining_quantity : current.quantity;
    } else if (ev.type === "POSITION_CLOSED" && current) {
      current.exit_sequence = ev.sequence_number;
      current.exit_candle_index = ev.candle_index;
      current.exit_time = ev.timestamp;
      current.exit_price = typeof p.fill_price === "number" ? p.fill_price : null;
      current.realized_pnl = typeof p.realized_pnl === "number" ? p.realized_pnl : null;
      current.is_open = false;
      current = null;
    }
  }

  return trades;
}
