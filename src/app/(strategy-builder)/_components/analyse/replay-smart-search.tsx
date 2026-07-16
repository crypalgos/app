"use client";

import { useMemo, useState } from "react";
import {
  IconArrowUp,
  IconArrowDown,
  IconBolt,
  IconAlertTriangle,
  IconTrendingDown,
  IconTarget,
  IconShieldCheck,
  IconFlame,
} from "@tabler/icons-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useReplayDataset } from "@/api-actions/hooks/replay-hooks";
import { computeDrawdownSeries } from "@/lib/replay-analysis";
import type { ResearchRun, BacktestSummary } from "@/types/strategy-actions";
import type { ReplaySession } from "@/types/replay";

// Jump-to search (Cmd+K) — every option here resolves to a real candle index
// and calls the same onSeek used everywhere else on the page (chart click,
// Timeline row, Trades row, Context Bar) — no separate seeking mechanism.

const PAGE_SIZE = 500;

interface ReplaySmartSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runId: string;
  run: ResearchRun | undefined;
  session: ReplaySession;
  currentCandleIndex: number | null;
  onSeek: (candleIndex: number) => void;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

export function ReplaySmartSearch({
  open,
  onOpenChange,
  runId,
  run,
  session,
  currentCandleIndex,
  onSeek,
}: ReplaySmartSearchProps) {
  const [search, setSearch] = useState("");

  const { data: trades } = useReplayDataset(runId, "trades", 0, PAGE_SIZE - 1, open);
  const { data: runtimeEvents } = useReplayDataset(
    runId,
    "runtime_events",
    session.first_candle_index ?? 0,
    (session.first_candle_index ?? 0) + PAGE_SIZE - 1,
    open
  );

  const cursor = currentCandleIndex ?? session.first_candle_index ?? 0;

  const tradeNumberMatch = /^\d+$/.test(search.trim()) ? parseInt(search.trim(), 10) : null;
  const matchedTrade =
    tradeNumberMatch && trades && tradeNumberMatch >= 1 && tradeNumberMatch <= trades.length
      ? trades[tradeNumberMatch - 1]
      : null;

  const { largestWinner, largestWinnerIdx, largestLoser, largestLoserIdx } = useMemo(() => {
    if (!trades || trades.length === 0) {
      return { largestWinner: null, largestWinnerIdx: -1, largestLoser: null, largestLoserIdx: -1 };
    }
    let winIdx = -1;
    let loseIdx = -1;
    let winVal = -Infinity;
    let loseVal = Infinity;
    trades.forEach((t, i) => {
      const pnl = num(t.pnl ?? t.net_pnl);
      if (pnl == null) return;
      if (pnl > winVal) {
        winVal = pnl;
        winIdx = i;
      }
      if (pnl < loseVal) {
        loseVal = pnl;
        loseIdx = i;
      }
    });
    return {
      largestWinner: winIdx >= 0 ? trades[winIdx] : null,
      largestWinnerIdx: winIdx,
      largestLoser: loseIdx >= 0 ? trades[loseIdx] : null,
      largestLoserIdx: loseIdx,
    };
  }, [trades]);

  const nextBuyEntry = useMemo(() => {
    if (!trades) return null;
    return trades.find((t) => {
      const idx = num(t.entry_candle_index ?? t.entry_candle);
      const side = String(t.side ?? "").toUpperCase();
      return idx != null && idx >= cursor && !side.includes("SHORT");
    });
  }, [trades, cursor]);

  const nextSellEntry = useMemo(() => {
    if (!trades) return null;
    return trades.find((t) => {
      const idx = num(t.entry_candle_index ?? t.entry_candle);
      const side = String(t.side ?? "").toUpperCase();
      return idx != null && idx >= cursor && side.includes("SHORT");
    });
  }, [trades, cursor]);

  const nextLiquidation = useMemo(
    () => session.markers.find((m) => m.type === "liquidation" && m.candle_index != null && m.candle_index >= cursor),
    [session.markers, cursor]
  );

  const nextEventByType = (type: string) =>
    runtimeEvents?.find((e) => e.type === type && num(e.candle_index) != null && (num(e.candle_index) as number) >= cursor);

  const nextOrderFilled = nextEventByType("ORDER_FILLED");
  const nextPositionOpened = nextEventByType("POSITION_OPENED");
  const nextPolicyArmed = nextEventByType("POLICY_ARMED");
  const nextMarginCall = nextEventByType("MARGIN_CALL");

  // Largest drawdown: equity_preview is a downsampled (~100pt) curve with no
  // candle_index of its own, so the bar is approximated by its proportional
  // position in the run's candle range — an interpolation, not an exact bar.
  const summary = run?.summary_json as BacktestSummary | undefined;
  const largestDrawdown = (() => {
    if (!summary?.equity_preview || summary.equity_preview.length < 2) return null;
    if (session.first_candle_index == null || session.last_candle_index == null) return null;
    const series = computeDrawdownSeries(summary.equity_preview);
    let maxIdx = 0;
    let maxVal = -Infinity;
    series.forEach(([, dd], i) => {
      if (dd > maxVal) {
        maxVal = dd;
        maxIdx = i;
      }
    });
    if (maxVal <= 0) return null;
    const t = series.length > 1 ? maxIdx / (series.length - 1) : 0;
    const candleIndex = Math.round(
      session.first_candle_index + t * (session.last_candle_index - session.first_candle_index)
    );
    return { candleIndex, pct: maxVal * 100 };
  })();

  const seekAndClose = (candleIndex: number) => {
    onSeek(candleIndex);
    onOpenChange(false);
    setSearch("");
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Jump To" description="Jump to a trade, event, or moment in this replay">
      <CommandInput placeholder="Jump to trade #, event, or moment…" value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>

        {matchedTrade && (
          <>
            <CommandGroup heading="Trade">
              <CommandItem
                value={`trade ${tradeNumberMatch}`}
                onSelect={() => {
                  const idx = num(matchedTrade.entry_candle_index ?? matchedTrade.entry_candle);
                  if (idx != null) seekAndClose(idx);
                }}
              >
                <IconTarget className="text-primary" />
                Trade #{tradeNumberMatch} — {String(matchedTrade.side ?? "").toUpperCase()} entry
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {(largestWinner || largestLoser) && (
          <CommandGroup heading="Trades">
            {largestWinner && (
              <CommandItem
                value="largest winner best trade"
                onSelect={() => {
                  const idx = num(largestWinner.entry_candle_index ?? largestWinner.entry_candle);
                  if (idx != null) seekAndClose(idx);
                }}
              >
                <IconArrowUp className="text-emerald-500" />
                Largest Winner — Trade #{largestWinnerIdx + 1} ({num(largestWinner.pnl ?? largestWinner.net_pnl)?.toFixed(2)})
              </CommandItem>
            )}
            {largestLoser && (
              <CommandItem
                value="largest loser worst trade"
                onSelect={() => {
                  const idx = num(largestLoser.entry_candle_index ?? largestLoser.entry_candle);
                  if (idx != null) seekAndClose(idx);
                }}
              >
                <IconArrowDown className="text-rose-500" />
                Largest Loser — Trade #{largestLoserIdx + 1} ({num(largestLoser.pnl ?? largestLoser.net_pnl)?.toFixed(2)})
              </CommandItem>
            )}
          </CommandGroup>
        )}

        <CommandGroup heading="Positions">
          {nextBuyEntry && (
            <CommandItem
              value="next buy entry long"
              onSelect={() => seekAndClose(num(nextBuyEntry.entry_candle_index ?? nextBuyEntry.entry_candle)!)}
            >
              <IconArrowUp className="text-emerald-500" />
              Next Buy Entry
            </CommandItem>
          )}
          {nextSellEntry && (
            <CommandItem
              value="next sell entry short"
              onSelect={() => seekAndClose(num(nextSellEntry.entry_candle_index ?? nextSellEntry.entry_candle)!)}
            >
              <IconArrowDown className="text-rose-500" />
              Next Sell Entry
            </CommandItem>
          )}
          {nextLiquidation?.candle_index != null && (
            <CommandItem value="next liquidation" onSelect={() => seekAndClose(nextLiquidation.candle_index!)}>
              <IconFlame className="text-rose-500" />
              Next Liquidation
            </CommandItem>
          )}
        </CommandGroup>

        <CommandGroup heading="Events">
          {nextOrderFilled && (
            <CommandItem value="next order filled" onSelect={() => seekAndClose(num(nextOrderFilled.candle_index)!)}>
              <IconBolt className="text-blue-500" />
              Next Order Filled
            </CommandItem>
          )}
          {nextPositionOpened && (
            <CommandItem value="next position opened" onSelect={() => seekAndClose(num(nextPositionOpened.candle_index)!)}>
              <IconTarget className="text-emerald-500" />
              Next Position Opened
            </CommandItem>
          )}
          {nextPolicyArmed && (
            <CommandItem value="next policy armed stop loss take profit" onSelect={() => seekAndClose(num(nextPolicyArmed.candle_index)!)}>
              <IconShieldCheck className="text-orange-500" />
              Next Policy Armed
            </CommandItem>
          )}
          {nextMarginCall && (
            <CommandItem value="next margin call" onSelect={() => seekAndClose(num(nextMarginCall.candle_index)!)}>
              <IconAlertTriangle className="text-rose-500" />
              Next Margin Call
            </CommandItem>
          )}
        </CommandGroup>

        {largestDrawdown && (
          <CommandGroup heading="Analysis">
            <CommandItem value="largest drawdown" onSelect={() => seekAndClose(largestDrawdown.candleIndex)}>
              <IconTrendingDown className="text-rose-500" />
              Largest Drawdown (≈{largestDrawdown.pct.toFixed(1)}%)
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
