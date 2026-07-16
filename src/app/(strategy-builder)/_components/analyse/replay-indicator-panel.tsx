"use client";

import { formatIndicatorLabel, type IndicatorSnapshotRecord } from "@/types/replay";
import { IconGauge } from "@tabler/icons-react";

interface ReplayIndicatorPanelProps {
  snapshots: IndicatorSnapshotRecord[];
  currentCandleIndex: number;
}

// Backend rows are inconsistently keyed (candle_index vs bar_index, source vs
// datasource) depending on which dataset path wrote them — mirror the same
// defensive lookup replay_service.py itself uses rather than assuming one shape.
function rowCandleIndex(row: IndicatorSnapshotRecord): number | undefined {
  return (row as unknown as { candle_index?: number }).candle_index ?? row.bar_index;
}
function rowSource(row: IndicatorSnapshotRecord): string {
  return row.datasource ?? (row as unknown as { source?: string }).source ?? "";
}

export function ReplayIndicatorPanel({ snapshots, currentCandleIndex }: ReplayIndicatorPanelProps) {
  const atBar = snapshots.filter((s) => rowCandleIndex(s) === currentCandleIndex);

  return (
    <div className="h-full rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
        <IconGauge className="size-3.5 text-primary" />
        <h3 className="text-[12px] font-semibold text-foreground/80 tracking-wide">Indicators</h3>
        <span className="text-[10px] font-mono text-muted-foreground/60 ml-auto">bar {currentCandleIndex}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        {atBar.length === 0 ? (
          <p className="text-[11px] text-muted-foreground px-1">No indicator snapshot at this bar.</p>
        ) : (
          atBar.map((row, i) => (
            <div key={i} className="rounded-lg bg-muted/30 border border-border/40 px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold text-foreground">{row.symbol}</span>
                <span className="text-[9px] text-muted-foreground font-mono">{row.timeframe}</span>
                {rowSource(row) && (
                  <span className="text-[9px] text-muted-foreground/70 ml-auto font-mono">{rowSource(row)}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {Object.entries(row.values ?? {}).map(([key, entry]) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground truncate">{formatIndicatorLabel(entry)}</span>
                    <span className="text-[10px] font-mono font-semibold text-foreground tabular-nums">
                      {entry.value.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
