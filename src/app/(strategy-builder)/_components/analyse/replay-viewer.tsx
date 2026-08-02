"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconLoader2 } from "@tabler/icons-react";
import {
  useReplayStore,
  selectCandlesInRange,
  selectCandleAt,
  selectIndicatorsAtCandle,
  selectIndicatorsInRange,
  selectTreesInRange,
} from "@/store/replay-store";
import { ReplayPriceChart } from "./replay-price-chart";
import { ReplayPlaybackControls } from "./replay-playback-controls";
import { ReplayDecisionInspector } from "./replay-decision-inspector";
import { ReplaySymbolPanel } from "./replay-symbol-panel";
import { ReplayConsole } from "./replay-console";
import { buildIndicatorColorMap } from "@/lib/indicator-colors";
import type { ResearchRun, BacktestSummary } from "@/types/strategy-actions";

interface ReplayViewerProps {
  runId: string;
  strategyId: string;
  run: ResearchRun | undefined;
  onBack: () => void;
}

export function ReplayViewer({ runId, strategyId, run, onBack }: ReplayViewerProps) {
  const initRun = useReplayStore((s) => s.initRun);
  const setCursor = useReplayStore((s) => s.setCursor);
  const setStatus = useReplayStore((s) => s.setStatus);
  const sessionMeta = useReplayStore((s) => s.sessionMeta);
  const isLoadingSession = useReplayStore((s) => s.isSessionLoading);
  const isSessionError = useReplayStore((s) => s.sessionError != null);
  const cursor = useReplayStore((s) => s.session.cursor);
  const status = useReplayStore((s) => s.session.status);
  // Bumped whenever a chunk finishes loading (ChunkCache mutates its
  // internal Map in place, so this reference bump is the only reactive
  // signal that new data landed). Subscribing to just this field — instead
  // of the whole store — is what keeps candles/indicators/trees below
  // referentially stable across ticks where nothing they read actually
  // changed, so the chart doesn't redo setData() every autoplay tick.
  const chunkLastAccessed = useReplayStore((s) => s.chunkLastAccessed);

  useEffect(() => {
    initRun(runId);
  }, [runId, initRun]);

  const [hiddenIndicators, setHiddenIndicators] = useState<Set<string>>(new Set());
  const [customIndicatorColors, setCustomIndicatorColors] = useState<Record<string, string>>({});
  const [periodOverrides, setPeriodOverrides] = useState<Record<string, number>>({});
  const [previewCandleIndex, setPreviewCandleIndex] = useState<number | null>(null);

  const currentCandleIndex = sessionMeta ? cursor : null;
  const isPlaying = status === "playing";

  // Chart display range: a fixed-size window — purely a "what does the chart
  // show right now" concern, decoupled from the cursor via a dead-zone
  // anchor. Re-centering (and therefore re-decoding + redrawing the whole
  // candle/volume/indicator series) only happens once the cursor drifts
  // into the outer quarter of the window, not on every single-bar tick —
  // during steady playback the window just sits still while the crosshair
  // moves through already-displayed bars. React's documented "adjust state
  // during render" pattern (comparing against a DIFFERENT piece of state,
  // windowAnchor, not against currentCandleIndex's own previous value) —
  // deliberately not a useEffect, which would cost an extra render pass.
  const displayWindowSize = sessionMeta?.max_window_candles ?? 500;
  const halfWindow = Math.floor(displayWindowSize / 2);
  const edgeBuffer = Math.floor(displayWindowSize / 4);
  const [windowAnchor, setWindowAnchor] = useState<number | null>(null);
  if (
    currentCandleIndex != null &&
    (windowAnchor == null || Math.abs(currentCandleIndex - windowAnchor) > halfWindow - edgeBuffer)
  ) {
    setWindowAnchor(currentCandleIndex);
  }
  const displayFrom =
    windowAnchor != null && sessionMeta?.first_candle_index != null
      ? Math.max(sessionMeta.first_candle_index, windowAnchor - halfWindow)
      : null;
  const displayTo =
    displayFrom != null && sessionMeta?.last_candle_index != null
      ? Math.min(sessionMeta.last_candle_index, displayFrom + displayWindowSize - 1)
      : null;
  // This changes only when the dead-zone window recentres, not when another
  // chunk fills within the visible range. The chart uses it to avoid repeatedly
  // refitting the time scale and visibly jumping during replay playback.
  const displayWindowKey = displayFrom != null && displayTo != null ? `${displayFrom}:${displayTo}` : null;

  // Narrow deps ([chunkLastAccessed, ...] rather than the whole store) so
  // these only recompute when a chunk actually arrived or the window
  // actually moved — not on every cursor tick. `useReplayStore.getState()`
  // is a plain (non-reactive) read of the freshest state at recompute time.
  const candles = useMemo(
    () =>
      displayFrom != null && displayTo != null
        ? selectCandlesInRange(useReplayStore.getState(), displayFrom, displayTo)
        : [],
    // chunkLastAccessed isn't read inside the callback directly — it's the
    // trigger signal for "a chunk landed, re-read getState()" (see comment above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chunkLastAccessed, displayFrom, displayTo]
  );
  const indicatorSnapshots = useMemo(
    () =>
      displayFrom != null && displayTo != null
        ? selectIndicatorsInRange(useReplayStore.getState(), displayFrom, displayTo)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chunkLastAccessed, displayFrom, displayTo]
  );
  const candleTrees = useMemo(
    () =>
      displayFrom != null && displayTo != null
        ? selectTreesInRange(useReplayStore.getState(), displayFrom, displayTo)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chunkLastAccessed, displayFrom, displayTo]
  );
  // Represents "state at the current bar" — meant to update every tick,
  // unlike the display-window data above.
  const currentCandle = useMemo(
    () => (currentCandleIndex != null ? selectCandleAt(useReplayStore.getState(), currentCandleIndex) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chunkLastAccessed, currentCandleIndex]
  );
  const indicatorsAtBar = useMemo(
    () => (currentCandleIndex != null ? selectIndicatorsAtCandle(useReplayStore.getState(), currentCandleIndex) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chunkLastAccessed, currentCandleIndex]
  );

  // Stable key order (first-seen) drives default palette assignment, so the
  // same indicator always gets the same default color across chunk loads;
  // customIndicatorColors overrides win over the palette default.
  const indicatorColorMap = useMemo(() => {
    const keysInOrder: string[] = [];
    const seen = new Set<string>();
    for (const snap of indicatorSnapshots) {
      for (const key of Object.keys(snap.values ?? {})) {
        if (!seen.has(key)) {
          seen.add(key);
          keysInOrder.push(key);
        }
      }
    }
    return buildIndicatorColorMap(keysInOrder, customIndicatorColors);
  }, [indicatorSnapshots, customIndicatorColors]);

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
    setCursor(candleIndex);
  };

  // Keyboard shortcuts: space = play/pause, arrows = step. Scoped to this
  // full-screen page only, cleaned up on unmount.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      // No visible "Exit Replay" control anymore — Escape is the fallback
      // way out of this full-screen (fixed inset-0) overlay.
      if (e.code === "Escape") {
        e.preventDefault();
        onBack();
        return;
      }
      if (currentCandleIndex == null || sessionMeta?.first_candle_index == null || sessionMeta?.last_candle_index == null) return;
      if (e.code === "Space") {
        e.preventDefault();
        setStatus(isPlaying ? "paused" : "playing");
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
  }, [currentCandleIndex, sessionMeta?.first_candle_index, sessionMeta?.last_candle_index, isPlaying, onBack]);

  if (isLoadingSession) {
    return (
      <div className="fixed inset-0 top-[68px] bg-background flex items-center justify-center">
        <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isSessionError || !sessionMeta) {
    return (
      <div className="fixed inset-0 top-[68px] bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Couldn&apos;t load replay data for this run.</p>
        <Button variant="outline" size="sm" onClick={onBack} className="cursor-pointer gap-1.5">
          <IconArrowLeft className="size-3.5" /> Back to Analyse
        </Button>
      </div>
    );
  }

  if (sessionMeta.first_candle_index == null || sessionMeta.last_candle_index == null) {
    return (
      <div className="fixed inset-0 top-[68px] bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">This run has no candle data to replay.</p>
        <Button variant="outline" size="sm" onClick={onBack} className="cursor-pointer gap-1.5">
          <IconArrowLeft className="size-3.5" /> Back to Analyse
        </Button>
      </div>
    );
  }

  const summary = run?.summary_json as BacktestSummary | undefined;

  return (
    <div className="fixed inset-0 top-[68px] bg-background flex flex-col">
      {/* ─── Toolbar ─── */}
      <div className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-border/60 bg-card/60 backdrop-blur-sm">
        <div className="flex flex-col shrink-0 min-w-0 max-w-[180px]">
          <span className="text-[12px] font-bold text-foreground truncate">{run?.name ?? "Replay"}</span>
          <span className="text-[9.5px] text-muted-foreground font-mono truncate">
            {sessionMeta.symbols.join(", ")} · {sessionMeta.trade_count} trades
          </span>
        </div>

        {currentCandleIndex != null && (
          <div className="flex-1 min-w-0">
            <ReplayPlaybackControls
              variant="toolbar"
              currentCandleIndex={currentCandleIndex}
              firstCandleIndex={sessionMeta.first_candle_index}
              lastCandleIndex={sessionMeta.last_candle_index}
              onSeek={handleSeek}
              isPlaying={isPlaying}
              onPlayingChange={(v) => setStatus(v ? "playing" : "paused")}
            />
          </div>
        )}
      </div>

      {/* ─── Main 3-column area ─── */}
      <div className="flex-1 min-h-0 flex">
        <div className="w-[260px] shrink-0 border-r border-border/60">
          <ReplaySymbolPanel
            symbol={sessionMeta.symbols[0]}
            exchange={summary?.exchange}
            timeframe={candles[0]?.timeframe as string | undefined}
            leverage={summary?.leverage}
            candles={candles}
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
            candles={candles}
            indicatorSnapshots={indicatorSnapshots}
            markers={sessionMeta.markers}
            candleTrees={candleTrees}
            currentCandleIndex={currentCandleIndex}
            onSeek={handleSeek}
            indicatorColors={indicatorColorMap}
            hiddenIndicators={hiddenIndicators}
            periodOverrides={periodOverrides}
            previewCandleIndex={previewCandleIndex}
            dataWindowKey={displayWindowKey}
          />
        </div>

        <div className="w-[320px] shrink-0 border-l border-border/60 p-3">
          <ReplayDecisionInspector currentCandleIndex={currentCandleIndex ?? 0} run={run} />
        </div>
      </div>

      {/* ─── Bottom dockable console ─── */}
      <ReplayConsole
        runId={runId}
        strategyId={strategyId}
        run={run}
        currentCandleIndex={currentCandleIndex}
        onSeekToCandle={handleSeek}
        onPreviewCandle={setPreviewCandleIndex}
      />
    </div>
  );
}
