"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconLoader2, IconActivity, IconSettings, IconSearch } from "@tabler/icons-react";
import { useReplaySession, useReplayWindow } from "@/api-actions/hooks/replay-hooks";
import { useTriggerBacktest } from "@/api-actions/hooks/strategy-hooks";
import { toast } from "sonner";
import { ReplayPriceChart } from "./replay-price-chart";
import { ReplayPlaybackControls } from "./replay-playback-controls";
import { ReplayDecisionInspector } from "./replay-decision-inspector";
import { ReplaySymbolPanel } from "./replay-symbol-panel";
import { ReplayContextBar } from "./replay-context-bar";
import { ReplayConsole } from "./replay-console";
import { ReplaySmartSearch } from "./replay-smart-search";
import { BacktestConfigDialog, type BacktestConfigParams } from "../shared/backtest-config-dialog";
import { buildIndicatorColorMap } from "@/lib/indicator-colors";
import { flattenCandleTree, findPortfolioSnapshot, type PortfolioHistoryPoint } from "@/lib/replay-analysis";
import type { ResearchRun, BacktestSummary } from "@/types/strategy-actions";

interface ReplayViewerProps {
  runId: string;
  strategyId: string;
  run: ResearchRun | undefined;
  onBack: () => void;
}

export function ReplayViewer({ runId, strategyId, run, onBack }: ReplayViewerProps) {
  const { data: session, isLoading: isLoadingSession, isError: isSessionError } = useReplaySession(runId);

  // null means "not yet explicitly set by the user" — falls back to the
  // session's first_candle_index below, derived directly in render rather
  // than seeded via an effect (must window against [first_candle_index,
  // last_candle_index], never [0, bar_count-1]: indicator warmup means
  // candle_index rarely starts at 0).
  const [seekedCandleIndex, setSeekedCandleIndex] = useState<number | null>(null);
  const [seekedWindowStart, setSeekedWindowStart] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [hiddenIndicators, setHiddenIndicators] = useState<Set<string>>(new Set());
  const [customIndicatorColors, setCustomIndicatorColors] = useState<Record<string, string>>({});
  const [periodOverrides, setPeriodOverrides] = useState<Record<string, number>>({});
  const [previewCandleIndex, setPreviewCandleIndex] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  // Real per-bar PORTFOLIO_SNAPSHOT events, accumulated only for bars the
  // user has actually visited — powers the "live growing" equity/drawdown
  // curves everywhere on this page instead of a whole-run static preview.
  const [portfolioHistory, setPortfolioHistory] = useState<Record<number, PortfolioHistoryPoint>>({});
  const currentCandleIndex = seekedCandleIndex ?? session?.first_candle_index ?? null;
  const windowStart = seekedWindowStart ?? session?.first_candle_index ?? null;

  const windowSize = session?.max_window_candles ?? 500;
  const windowEnd = useMemo(() => {
    if (windowStart == null || session?.last_candle_index == null) return null;
    return Math.min(windowStart + windowSize - 1, session.last_candle_index);
  }, [windowStart, windowSize, session?.last_candle_index]);

  const { data: replayWindow, isLoading: isLoadingWindow } = useReplayWindow(runId, windowStart, windowEnd);
  const { mutateAsync: triggerBacktest, isPending: isEnqueuing } = useTriggerBacktest(strategyId);

  // Stable key order (first-seen) drives default palette assignment, so the
  // same indicator always gets the same default color across window reloads;
  // customIndicatorColors overrides win over the palette default.
  const indicatorColorMap = useMemo(() => {
    const keysInOrder: string[] = [];
    const seen = new Set<string>();
    for (const snap of replayWindow?.indicator_snapshots ?? []) {
      for (const key of Object.keys(snap.values ?? {})) {
        if (!seen.has(key)) {
          seen.add(key);
          keysInOrder.push(key);
        }
      }
    }
    return buildIndicatorColorMap(keysInOrder, customIndicatorColors);
  }, [replayWindow?.indicator_snapshots, customIndicatorColors]);

  const handleToggleIndicator = (key: string) => {
    setHiddenIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const handleChangeIndicatorColor = (key: string, color: string) => {
    setCustomIndicatorColors((prev) => ({ ...prev, [key]: color }));
  };
  const handleChangePeriod = (key: string, period: number) => {
    setPeriodOverrides((prev) => ({ ...prev, [key]: period }));
  };

  const handleSeek = (candleIndex: number) => {
    if (session?.first_candle_index == null || session?.last_candle_index == null) return;
    const clamped = Math.min(session.last_candle_index, Math.max(session.first_candle_index, candleIndex));
    setSeekedCandleIndex(clamped);

    // Shift the loaded window forward/back a full page when the playhead
    // walks past its edge, keeping the request count bounded regardless of
    // how long the run is.
    if (windowStart != null && windowEnd != null) {
      if (clamped > windowEnd) {
        setSeekedWindowStart(clamped);
      } else if (clamped < windowStart) {
        setSeekedWindowStart(Math.max(session.first_candle_index, clamped - windowSize + 1));
      }
    }
  };

  // Keyboard shortcuts: space = play/pause, arrows = step. Scoped to this
  // full-screen page only, cleaned up on unmount.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
        return;
      }
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (currentCandleIndex == null || session?.first_candle_index == null || session?.last_candle_index == null) return;
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handleSeek(currentCandleIndex - 1);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleSeek(currentCandleIndex + 1);
      }
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCandleIndex, session?.first_candle_index, session?.last_candle_index]);

  // Record every already-passed bar's real PORTFOLIO_SNAPSHOT from the
  // currently loaded window — never ahead of the playhead, so downstream
  // curves only ever show "so far". Backfilling the whole window (not just
  // currentCandleIndex) matters because the engine snapshots every bar
  // (EngineSimulator's EVERY_BAR default), but during fast autoplay the
  // playhead can advance past several bars before a new window finishes
  // loading — recording only the single "current" bar each render would
  // permanently skip those in-between bars once the playhead moves on,
  // producing gaps in the equity curve. Adjusted directly during render
  // (React's documented pattern for deriving state from a changed value)
  // rather than in an effect; the `missing` gate prevents any loop — once a
  // bar is recorded, it drops out of `missing` and the condition closes.
  if (currentCandleIndex != null && replayWindow) {
    const missing = replayWindow.candle_trees.filter(
      (t) => t.candle_index <= currentCandleIndex && !portfolioHistory[t.candle_index]
    );
    if (missing.length > 0) {
      const updates: Record<number, PortfolioHistoryPoint> = {};
      for (const t of missing) {
        const snapshot = findPortfolioSnapshot(flattenCandleTree(t));
        if (snapshot) updates[t.candle_index] = { candleIndex: t.candle_index, ...snapshot };
      }
      if (Object.keys(updates).length > 0) {
        setPortfolioHistory((prev) => ({ ...prev, ...updates }));
      }
    }
  }

  const handleTriggerNewRun = async (params: BacktestConfigParams) => {
    setConfigOpen(false);
    try {
      await triggerBacktest({ ...params, temporary: true });
      toast.success("New Analyse run enqueued — check the Analyse tab once you exit replay.");
    } catch {
      toast.error("Failed to run backtest. Ensure your Data Node is configured with a symbol and exchange.");
    }
  };

  if (isLoadingSession) {
    return (
      <div className="fixed inset-0 top-[68px] bg-background flex items-center justify-center">
        <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isSessionError || !session) {
    return (
      <div className="fixed inset-0 top-[68px] bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Couldn&apos;t load replay data for this run.</p>
        <Button variant="outline" size="sm" onClick={onBack} className="cursor-pointer gap-1.5">
          <IconArrowLeft className="size-3.5" /> Back to Analyse
        </Button>
      </div>
    );
  }

  if (session.first_candle_index == null || session.last_candle_index == null) {
    return (
      <div className="fixed inset-0 top-[68px] bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">This run has no candle data to replay.</p>
        <Button variant="outline" size="sm" onClick={onBack} className="cursor-pointer gap-1.5">
          <IconArrowLeft className="size-3.5" /> Back to Analyse
        </Button>
      </div>
    );
  }

  const tree = replayWindow?.candle_trees.find((t) => t.candle_index === currentCandleIndex);
  const currentCandle = replayWindow?.candles.find((c) => c.candle_index === currentCandleIndex);
  const indicatorsAtBar = replayWindow?.indicator_snapshots.filter((s) => (s.bar_index ?? -1) === currentCandleIndex) ?? [];
  const summary = run?.summary_json as BacktestSummary | undefined;
  const portfolioHistorySeries = Object.values(portfolioHistory).sort((a, b) => a.candleIndex - b.candleIndex);

  return (
    <div className="fixed inset-0 top-[68px] bg-background flex flex-col">
      {/* ─── Toolbar ─── */}
      <div className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-border/60 bg-card/60 backdrop-blur-sm">
        <Button variant="outline" size="sm" onClick={onBack} className="h-8 gap-1.5 cursor-pointer shrink-0">
          <IconArrowLeft className="size-3.5" /> Exit Replay
        </Button>
        <div className="flex flex-col shrink-0 min-w-0 max-w-[180px]">
          <span className="text-[12px] font-bold text-foreground truncate">{run?.name ?? "Replay"}</span>
          <span className="text-[9.5px] text-muted-foreground font-mono truncate">
            {session.symbols.join(", ")} · {session.trade_count} trades
          </span>
        </div>

        {currentCandleIndex != null && (
          <div className="flex-1 min-w-0">
            <ReplayPlaybackControls
              variant="toolbar"
              currentCandleIndex={currentCandleIndex}
              firstCandleIndex={session.first_candle_index}
              lastCandleIndex={session.last_candle_index}
              onSeek={handleSeek}
              isPlaying={isPlaying}
              onPlayingChange={setIsPlaying}
            />
          </div>
        )}

        {isLoadingWindow && <IconLoader2 className="size-4 animate-spin text-muted-foreground shrink-0" />}

        <button
          onClick={() => setSearchOpen(true)}
          className="h-8 px-3 rounded-md flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/60 cursor-pointer shrink-0"
        >
          <IconSearch className="size-3.5" />
          Jump to…
          <kbd className="text-[9px] font-mono border border-border/60 rounded px-1 py-0.5">⌘K</kbd>
        </button>

        <Button
          size="sm"
          onClick={() => setConfigOpen(true)}
          disabled={isEnqueuing}
          className="h-8 gap-1.5 rounded-full px-3 text-xs font-bold cursor-pointer shrink-0"
        >
          <IconActivity className="size-3.5" /> Run Backtest
        </Button>
        <button
          className="size-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer shrink-0"
          title="Replay settings (coming soon)"
        >
          <IconSettings className="size-3.5" />
        </button>
      </div>

      {/* ─── Context Bar / Breadcrumb ─── */}
      <ReplayContextBar
        runId={runId}
        symbol={session.symbols[0]}
        timeframe={replayWindow?.candles[0]?.timeframe as string | undefined}
        strategyName={run?.name}
        currentCandleIndex={currentCandleIndex}
        currentCandle={currentCandle}
        tree={tree}
        onSeek={handleSeek}
      />

      {/* ─── Main 3-column area ─── */}
      <div className="flex-1 min-h-0 flex">
        <div className="w-[260px] shrink-0 border-r border-border/60">
          <ReplaySymbolPanel
            symbol={session.symbols[0]}
            exchange={summary?.exchange}
            timeframe={replayWindow?.candles[0]?.timeframe as string | undefined}
            leverage={summary?.leverage}
            candles={replayWindow?.candles ?? []}
            currentCandle={currentCandle}
            currentCandleIndex={currentCandleIndex}
            indicatorsAtBar={indicatorsAtBar}
            indicatorColors={indicatorColorMap}
            hiddenIndicators={hiddenIndicators}
            onToggleIndicator={handleToggleIndicator}
            onChangeIndicatorColor={handleChangeIndicatorColor}
            periodOverrides={periodOverrides}
            onChangePeriod={handleChangePeriod}
          />
        </div>

        <div className="flex-1 min-w-0 p-3">
          <ReplayPriceChart
            candles={replayWindow?.candles ?? []}
            indicatorSnapshots={replayWindow?.indicator_snapshots ?? []}
            markers={session.markers}
            candleTrees={replayWindow?.candle_trees ?? []}
            currentCandleIndex={currentCandleIndex}
            onSeek={handleSeek}
            indicatorColors={indicatorColorMap}
            hiddenIndicators={hiddenIndicators}
            periodOverrides={periodOverrides}
            previewCandleIndex={previewCandleIndex}
          />
        </div>

        <div className="w-[320px] shrink-0 border-l border-border/60 p-3">
          <ReplayDecisionInspector
            tree={tree}
            currentCandleIndex={currentCandleIndex ?? 0}
            run={run}
            portfolioHistory={portfolioHistorySeries}
          />
        </div>
      </div>

      {/* ─── Bottom dockable console ─── */}
      <ReplayConsole
        runId={runId}
        strategyId={strategyId}
        run={run}
        window={replayWindow}
        currentCandleIndex={currentCandleIndex}
        currentCandleTimestamp={currentCandle?.timestamp}
        firstCandleIndex={session.first_candle_index}
        lastCandleIndex={session.last_candle_index}
        onSeekToCandle={handleSeek}
        onPreviewCandle={setPreviewCandleIndex}
        portfolioHistory={portfolioHistorySeries}
      />

      <BacktestConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        onSubmit={handleTriggerNewRun}
        isSubmitting={isEnqueuing}
        temporary
      />

      <ReplaySmartSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        runId={runId}
        run={run}
        session={session}
        currentCandleIndex={currentCandleIndex}
        onSeek={handleSeek}
      />
    </div>
  );
}
