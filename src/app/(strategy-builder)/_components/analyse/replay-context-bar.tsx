"use client";

import { useMemo } from "react";
import { IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useReplayDataset } from "@/api-actions/hooks/replay-hooks";
import { findPortfolioSnapshot, flattenCandleTree } from "@/lib/replay-analysis";
import type { CandleTreeGroup, ReplayCandle } from "@/types/replay";

const PAGE_SIZE = 500;

interface ReplayContextBarProps {
  runId: string;
  symbol: string | undefined;
  timeframe: string | undefined;
  strategyName: string | undefined;
  currentCandleIndex: number | null;
  currentCandle: ReplayCandle | undefined;
  tree: CandleTreeGroup | undefined;
  onSeek: (candleIndex: number) => void;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

export function ReplayContextBar({
  runId,
  symbol,
  timeframe,
  strategyName,
  currentCandleIndex,
  currentCandle,
  tree,
  onSeek,
}: ReplayContextBarProps) {
  // Lazy full-run trades fetch — the only reliable way to know "am I in a
  // trade right now" regardless of where the currently-loaded window sits
  // (the window is only ~500 candles around the playhead; a position opened
  // outside it wouldn't be visible from window-scoped events alone).
  const { data: trades } = useReplayDataset(runId, "trades", 0, PAGE_SIZE - 1);

  const currentTrade = useMemo(() => {
    if (!trades || currentCandleIndex == null) return null;
    const idx = trades.findIndex((t) => {
      const entryIdx = num(t.entry_candle_index ?? t.entry_candle);
      const exitIdx = num(t.exit_candle_index ?? t.exit_candle);
      return entryIdx != null && entryIdx <= currentCandleIndex && (exitIdx == null || exitIdx >= currentCandleIndex);
    });
    return idx >= 0 ? { number: idx + 1, row: trades[idx] } : null;
  }, [trades, currentCandleIndex]);

  const flatEvents = useMemo(() => (tree ? flattenCandleTree(tree) : []), [tree]);
  const actionEvent = flatEvents.find((e) => e.type === "ACTION_TRIGGERED");
  const actionSide = actionEvent ? String((actionEvent.payload as Record<string, unknown>).action_type ?? "").toUpperCase() : null;
  const portfolio = findPortfolioSnapshot(flatEvents);
  const unrealizedPnl = portfolio ? portfolio.equity - portfolio.cash : null;

  const positionSide = currentTrade
    ? String(currentTrade.row.side ?? "").toUpperCase().includes("SHORT")
      ? "SHORT"
      : "LONG"
    : "FLAT";

  const segments = [
    { key: "symbol", label: symbol ?? "—", clickable: false },
    { key: "bar", label: currentCandleIndex != null ? `Bar ${currentCandleIndex}` : "—", clickable: false },
    { key: "decision", label: actionSide ?? "No Action", clickable: false },
    ...(currentTrade
      ? [
          {
            key: "trade",
            label: `Trade #${currentTrade.number}`,
            clickable: true,
            onClick: () => {
              const entryIdx = num(currentTrade.row.entry_candle_index ?? currentTrade.row.entry_candle);
              if (entryIdx != null) onSeek(entryIdx);
            },
          },
        ]
      : []),
    { key: "position", label: `Position: ${positionSide}`, clickable: false },
  ];

  return (
    <div className="h-9 shrink-0 flex items-center gap-3 px-4 border-b border-border/40 bg-card/40 text-[11px] font-mono overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 shrink-0">
        {segments.map((seg, i) => (
          <div key={seg.key} className="flex items-center gap-1.5">
            {i > 0 && <IconChevronRight className="size-3 text-muted-foreground/40" />}
            {seg.clickable ? (
              <button
                onClick={seg.onClick}
                className="text-primary hover:underline cursor-pointer font-semibold"
              >
                {seg.label}
              </button>
            ) : (
              <span className={cn("text-muted-foreground", seg.key === "decision" && actionSide && "text-foreground font-semibold")}>
                {seg.label}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3 shrink-0 text-muted-foreground">
        {timeframe && <span className="uppercase">{timeframe}</span>}
        {strategyName && <span className="truncate max-w-[160px]">{strategyName}</span>}
        {currentCandle?.timestamp != null && (
          <span>{new Date(currentCandle.timestamp).toLocaleString(undefined, { hour12: false })}</span>
        )}
        {unrealizedPnl != null && (
          <span className={cn("font-semibold", unrealizedPnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
            PnL {unrealizedPnl >= 0 ? "+" : ""}
            {unrealizedPnl.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}
