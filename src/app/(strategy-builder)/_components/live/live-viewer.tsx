"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconArrowLeft,
  IconBolt,
  IconLoader2,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { ReplayPriceChart } from "../analyse/replay-price-chart";
import { ReplaySymbolPanel } from "../analyse/replay-symbol-panel";
import { LiveConsole } from "./live-console";
import { LiveTradeInspector } from "./live-trade-inspector";
import { useLiveSessionStream } from "@/hooks/use-live-session-stream";
import { useSessionTimeline } from "@/api-actions/hooks/live-trading-hooks";
import { analyzeLiveEvents, deriveIndicatorSnapshots, toRuntimeEvents } from "@/lib/live-trading-analysis";
import { ACTIVE_SESSION_STATUSES, type LiveTradingSession } from "@/types/live-trading";
import type { ReplayCandle } from "@/types/replay";

interface LiveViewerProps {
  session: LiveTradingSession;
  onBack: () => void;
}

const WS_STATUS_LABEL: Record<string, string> = {
  open: "Live",
  connecting: "Connecting…",
  closed: "Reconnecting…",
  error: "Connection error",
  auth_expired: "Session expired",
  not_found: "Session unavailable",
};

// Live display ticks re-render frequently. Stable empty values prevent chart
// overlay effects from treating every tick as an indicator configuration change.
const EMPTY_INDICATOR_COLORS: Record<string, string> = {};
const EMPTY_HIDDEN_INDICATORS = new Set<string>();
const EMPTY_PERIOD_OVERRIDES: Record<string, number> = {};

function timeframeToMilliseconds(timeframe: string): number | null {
  const match = /^(\d+)(m|h|d)$/i.exec(timeframe.trim());
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitMilliseconds = unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
  return Number.isFinite(amount) && amount > 0 ? amount * unitMilliseconds : null;
}

export default function LiveViewer({ session, onBack }: LiveViewerProps) {
  const isActive = (ACTIVE_SESSION_STATUSES as string[]).includes(session.status);

  const { status: wsStatus, events: liveEvents, livePrice, hasSnapshot } = useLiveSessionStream(
    isActive ? session.id : null
  );
  const { data: historyTimeline, isLoading: isHistoryLoading } = useSessionTimeline(
    !isActive ? session.id : null
  );
  const historyEvents = historyTimeline?.events;
  const events = useMemo(
    () => (isActive ? liveEvents : historyEvents ?? []),
    [isActive, liveEvents, historyEvents]
  );

  const analysis = useMemo(() => analyzeLiveEvents(events), [events]);
  const runtimeEvents = useMemo(() => toRuntimeEvents(events), [events]);
  const indicatorSnapshots = useMemo(() => deriveIndicatorSnapshots(runtimeEvents), [runtimeEvents]);

  const [manualCandleIndex, setManualCandleIndex] = useState<number | null>(null);
  const lastClosedCandleIndex =
    analysis.candles.length > 0 ? analysis.candles[analysis.candles.length - 1].candle_index : null;
  const selectedCandleIndex = manualCandleIndex ?? lastClosedCandleIndex;
  const lastClosedCandle = analysis.candles.find((c) => c.candle_index === selectedCandleIndex);
  // A strategy whose timeframe is coarser than the raw tick feed (e.g. "1h")
  // only gets a new BAR_CLOSED once per hour. A PRICE_TICK is display-only and
  // never replaces finalized data used by the strategy, indicators, or replay.
  const currentCandle =
    isActive &&
    manualCandleIndex === null &&
    livePrice &&
    (lastClosedCandle == null || livePrice.timestamp >= (lastClosedCandle.timestamp ?? 0))
      ? {
          candle_index: selectedCandleIndex ?? -1,
          timestamp: livePrice.timestamp,
          open: livePrice.payload.open,
          high: livePrice.payload.high,
          low: livePrice.payload.low,
          close: livePrice.payload.close,
          volume: livePrice.payload.volume,
        }
      : lastClosedCandle;

  // The left symbol panel is a "what's happening right now" ticker, not a
  // history inspector -- scrubbing the chart back to look at an earlier bar
  // must NOT freeze it on that bar's stale price. Unlike `currentCandle`
  // above (which the chart/console/trade-inspector use to answer "as of the
  // scrubbed bar"), this always tracks the true tip of the live stream.
  const trueLastClosedCandle = analysis.candles.length > 0 ? analysis.candles[analysis.candles.length - 1] : undefined;
  const liveTickCandle =
    isActive &&
    livePrice &&
    (trueLastClosedCandle == null || livePrice.timestamp >= (trueLastClosedCandle.timestamp ?? 0))
      ? {
          candle_index: lastClosedCandleIndex ?? -1,
          timestamp: livePrice.timestamp,
          open: livePrice.payload.open,
          high: livePrice.payload.high,
          low: livePrice.payload.low,
          close: livePrice.payload.close,
          volume: livePrice.payload.volume,
        }
      : trueLastClosedCandle;
  const liveIndicatorsAtBar = useMemo(
    () => indicatorSnapshots.filter((s) => s.bar_index === lastClosedCandleIndex),
    [indicatorSnapshots, lastClosedCandleIndex]
  );

  // The chart may display the active candle, but analysis.candles remains
  // finalized-only. Replacing its time bucket rather than appending each
  // PRICE_TICK prevents a new candle from appearing for every ticker update.
  const liveChart = useMemo(() => {
    if (!isActive || manualCandleIndex !== null || !livePrice) {
      return { candles: analysis.candles, currentCandleIndex: null };
    }

    const { timestamp, payload } = livePrice;
    if (
      !Number.isFinite(timestamp) ||
      ![payload.open, payload.high, payload.low, payload.close, payload.volume].every(Number.isFinite)
    ) {
      return { candles: analysis.candles, currentCandleIndex: null };
    }

    const timeframeMs = timeframeToMilliseconds(session.timeframe);
    const bucketTimestamp = timeframeMs ? timestamp - (timestamp % timeframeMs) : timestamp;
    const existingIndex = analysis.candles.findIndex((c) => c.timestamp === bucketTimestamp);
    const existing = existingIndex >= 0 ? analysis.candles[existingIndex] : undefined;
    const nextCandleIndex =
      analysis.candles.reduce((max, candle) => Math.max(max, candle.candle_index), -1) + 1;
    const liveCandle: ReplayCandle = {
      candle_index: existing?.candle_index ?? nextCandleIndex,
      timestamp: bucketTimestamp,
      open: existing?.open ?? payload.open,
      high: Math.max(existing?.high ?? payload.high, payload.high, payload.open, payload.close),
      low: Math.min(existing?.low ?? payload.low, payload.low, payload.open, payload.close),
      close: payload.close,
      volume: payload.volume,
    };

    if (existingIndex >= 0) {
      const candles = analysis.candles.slice();
      candles[existingIndex] = liveCandle;
      return { candles, currentCandleIndex: liveCandle.candle_index };
    }

    return {
      candles: [...analysis.candles, liveCandle],
      currentCandleIndex: liveCandle.candle_index,
    };
  }, [analysis.candles, isActive, livePrice, manualCandleIndex, session.timeframe]);

  const chartCurrentCandleIndex =
    manualCandleIndex ?? liveChart.currentCandleIndex ?? lastClosedCandleIndex;
  // The finalized bar's own real timestamp at the cursor -- trades/orders/
  // portfolio gate against this (not the mutable display candle, which has
  // no bearing on what "as of this point in the session" means once a real
  // bar has closed) so scrubbing a stopped session replays it properly:
  // nothing that happened after the scrubbed bar is visible, exactly like
  // backtest replay's own no-spoiler guarantee.
  const currentCandleTimestamp = analysis.candles.find((c) => c.candle_index === chartCurrentCandleIndex)?.timestamp;
  const handleChartSeek = (candleIndex: number) => {
    const isDisplayOnlyCandle =
      candleIndex === liveChart.currentCandleIndex &&
      !analysis.candles.some((candle) => candle.candle_index === candleIndex);
    if (!isDisplayOnlyCandle) {
      setManualCandleIndex(candleIndex);
    }
  };
  const priceBasis = `Delta ${session.environment === "TESTNET" ? "Testnet" : "Production"} · contract OHLCV / ticker last`;

  // No separate click-to-select in the console's Trades tab (its rows seek
  // the chart instead, mirroring backtest's own TradesTab) -- the inspector
  // shows whichever trade is open, or the most recently closed one, as of
  // the scrubbed bar. Gated the same way as the console's own Trades tab so
  // scrubbing a stopped session back in time doesn't leave this panel
  // showing a trade from later in the session than where the playhead is.
  const tradesReached = currentCandleTimestamp != null
    ? analysis.trades.filter((t) => t.entry_time <= currentCandleTimestamp)
    : analysis.trades;
  const selectedTrade = tradesReached.length > 0 ? tradesReached[tradesReached.length - 1] : null;

  // Hovering a Timeline/Debug row pins the chart crosshair as a preview
  // without committing a seek -- mirrors ReplayConsole's onPreviewCandle.
  const [previewCandleIndex, setPreviewCandleIndex] = useState<number | null>(null);

  // Side-panel visibility -- gives the chart more room on request. No
  // animation, matching LiveConsole's own instant collapse below.
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Prefixed with the active/ended phase so the key changes on that
  // transition even when the candle range itself doesn't (a session's
  // WS TIMELINE_SNAPSHOT already hydrates the full persisted history, so
  // the range is often already "-1000:0" while still running). Without
  // this, ReplayPriceChart correctly skips re-fitting on every routine
  // live tick (so it doesn't fight a user's manual zoom while watching
  // price action) -- but that same skip then persists forever once the
  // session ends, leaving the chart stuck on whatever narrow range was
  // last in view instead of showing the now-final history.
  const dataWindowKey =
    liveChart.candles.length > 0
      ? `${isActive ? "live" : "final"}:${liveChart.candles[0].candle_index}:${liveChart.candles[liveChart.candles.length - 1].candle_index}`
      : null;

  // Don't render the chart/panels/console for an active session until the
  // server's initial TIMELINE_SNAPSHOT has actually hydrated history — a
  // PRICE_TICK arriving first would otherwise draw a single live candle
  // before the real history replaces it a moment later.
  if ((!isActive && isHistoryLoading) || (isActive && !hasSnapshot)) {
    return (
      <div className="fixed inset-0 top-[68px] bg-background flex items-center justify-center">
        <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-[68px] bg-background flex flex-col">
      <div className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-border/60 bg-card/60 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="size-8 cursor-pointer text-muted-foreground"
        >
          <IconArrowLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLeftPanelOpen((v) => !v)}
          title={leftPanelOpen ? "Hide symbol panel" : "Show symbol panel"}
          className="size-8 cursor-pointer text-muted-foreground"
        >
          {leftPanelOpen ? (
            <IconLayoutSidebarLeftCollapse className="size-4" />
          ) : (
            <IconLayoutSidebarLeftExpand className="size-4" />
          )}
        </Button>
        <div className="flex flex-col shrink-0 min-w-0">
          <span className="text-[12px] font-bold text-foreground truncate">
            {session.mode} · {session.exchange.toUpperCase()} · {session.environment}
          </span>
          <span className="text-[9.5px] text-muted-foreground font-mono truncate">
            {analysis.candles.length} bars · {analysis.trades.length} trades
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isActive && manualCandleIndex !== null && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setManualCandleIndex(null)}
              className="h-7 gap-1.5 rounded-full px-3 text-[10.5px] font-semibold cursor-pointer"
            >
              Viewing bar {selectedCandleIndex} — Jump to Live
              <IconBolt className="size-3" />
            </Button>
          )}
          {isActive && (
            <Badge
              className={cn(
                "border-0",
                wsStatus === "open"
                  ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"
                  : wsStatus === "auth_expired" || wsStatus === "not_found"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {WS_STATUS_LABEL[wsStatus] ?? wsStatus}
            </Badge>
          )}
          <Badge variant="outline">{session.status}</Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightPanelOpen((v) => !v)}
            title={rightPanelOpen ? "Hide trade inspector" : "Show trade inspector"}
            className="size-8 cursor-pointer text-muted-foreground"
          >
            {rightPanelOpen ? (
              <IconLayoutSidebarRightCollapse className="size-4" />
            ) : (
              <IconLayoutSidebarRightExpand className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {leftPanelOpen && (
        <div className="w-[260px] shrink-0 border-r border-border/60">
          <ReplaySymbolPanel
            symbol={runtimeEvents.find((e) => e.symbol_id)?.symbol_id ?? undefined}
            exchange={session.broker}
            timeframe={session.timeframe}
            priceBasis={priceBasis}
            candles={analysis.candles}
            currentCandle={liveTickCandle}
            currentCandleIndex={lastClosedCandleIndex}
            indicatorsAtBar={liveIndicatorsAtBar}
            indicatorColors={EMPTY_INDICATOR_COLORS}
            hiddenIndicators={EMPTY_HIDDEN_INDICATORS}
            onToggleIndicator={() => {}}
            onChangeIndicatorColor={() => {}}
            periodOverrides={EMPTY_PERIOD_OVERRIDES}
            onChangePeriod={() => {}}
          />
        </div>
        )}

        <div className="flex-1 min-w-0 p-3">
          <ReplayPriceChart
            candles={liveChart.candles}
            indicatorSnapshots={indicatorSnapshots}
            markers={analysis.markers}
            candleTrees={analysis.trees}
            currentCandleIndex={chartCurrentCandleIndex}
            onSeek={handleChartSeek}
            indicatorColors={EMPTY_INDICATOR_COLORS}
            hiddenIndicators={EMPTY_HIDDEN_INDICATORS}
            periodOverrides={EMPTY_PERIOD_OVERRIDES}
            previewCandleIndex={previewCandleIndex}
            dataWindowKey={dataWindowKey}
          />
        </div>

        {rightPanelOpen && (
        <div className="w-[320px] shrink-0 border-l border-border/60 p-3">
          <LiveTradeInspector
            trade={selectedTrade}
            runtimeEvents={runtimeEvents}
            hasAnyTrades={analysis.trades.length > 0}
          />
        </div>
        )}
      </div>

      <LiveConsole
        session={session}
        wsStatus={wsStatus}
        runtimeEvents={runtimeEvents}
        trades={analysis.trades}
        candleTrees={analysis.trees}
        indicatorSnapshots={indicatorSnapshots}
        currentCandle={currentCandle}
        currentCandleIndex={chartCurrentCandleIndex}
        currentCandleTimestamp={currentCandleTimestamp}
        onSeekToCandle={handleChartSeek}
        onPreviewCandle={setPreviewCandleIndex}
      />
    </div>
  );
}
