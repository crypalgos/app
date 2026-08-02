// Shared trading-analysis pipeline stage: chart markers derived from a flat
// event stream. Backtest doesn't call this today — its markers come
// precomputed server-side (ReplaySession.markers, crypalgos_core's replay
// backend) — but the derivation is genuinely generic over any RuntimeEvent[]
// keyed the same way, so it lives here rather than under live/ specifically.

import type { ReplayMarker, RuntimeEvent } from "@/types/replay";

const MARKER_TYPE_BY_EVENT: Partial<Record<string, ReplayMarker["type"]>> = {
  POSITION_OPENED: "entry",
  POSITION_CLOSED: "exit",
  POLICY_TRIGGERED: "policy",
  LIQUIDATION: "liquidation",
};

export function deriveMarkers(events: RuntimeEvent[]): ReplayMarker[] {
  const markers: ReplayMarker[] = [];
  for (const ev of events) {
    const type = MARKER_TYPE_BY_EVENT[ev.type];
    if (!type) continue;
    markers.push({
      candle_index: ev.candle_index,
      timestamp: ev.timestamp,
      type,
      symbol_id: ev.symbol_id,
      sequence_number: ev.sequence_number,
    });
  }
  return markers;
}
