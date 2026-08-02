// Shared trading-analysis pipeline stage: derives current position and fill
// latency from a flat event list. Generic over ReplayEventNode — no
// backtest-chunk-store dependency — usable by both replay and live.

import type { ReplayEventNode } from "@/types/replay";

/** Fill latency in ms — real timestamp delta between submit and fill, when
 * both events exist for this bar. */
export function computeFillLatencyMs(flatEvents: ReplayEventNode[]): number | null {
  const submitted = flatEvents.find((e) => e.type === "ORDER_SUBMITTED");
  const filled = flatEvents.find((e) => e.type === "ORDER_FILLED");
  if (!submitted || !filled) return null;
  return filled.timestamp - submitted.timestamp;
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
