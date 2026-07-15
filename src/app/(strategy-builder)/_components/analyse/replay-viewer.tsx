"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconLoader2 } from "@tabler/icons-react";
import { useReplaySession, useReplayWindow } from "@/api-actions/hooks/replay-hooks";
import { ReplayPriceChart } from "./replay-price-chart";
import { ReplayPlaybackControls } from "./replay-playback-controls";
import { ReplayIndicatorPanel } from "./replay-indicator-panel";
import { ReplayDecisionPanel } from "./replay-decision-panel";

interface ReplayViewerProps {
  runId: string;
  onBack: () => void;
}

export function ReplayViewer({ runId, onBack }: ReplayViewerProps) {
  const { data: session, isLoading: isLoadingSession, isError: isSessionError } = useReplaySession(runId);

  // null means "not yet explicitly set by the user" — falls back to the
  // session's first_candle_index below, derived directly in render rather
  // than seeded via an effect (must window against [first_candle_index,
  // last_candle_index], never [0, bar_count-1]: indicator warmup means
  // candle_index rarely starts at 0).
  const [seekedCandleIndex, setSeekedCandleIndex] = useState<number | null>(null);
  const [seekedWindowStart, setSeekedWindowStart] = useState<number | null>(null);
  const currentCandleIndex = seekedCandleIndex ?? session?.first_candle_index ?? null;
  const windowStart = seekedWindowStart ?? session?.first_candle_index ?? null;

  const windowSize = session?.max_window_candles ?? 500;
  const windowEnd = useMemo(() => {
    if (windowStart == null || session?.last_candle_index == null) return null;
    return Math.min(windowStart + windowSize - 1, session.last_candle_index);
  }, [windowStart, windowSize, session?.last_candle_index]);

  const { data: window, isLoading: isLoadingWindow } = useReplayWindow(runId, windowStart, windowEnd);

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

  if (isLoadingSession) {
    return (
      <div className="fixed inset-0 top-[68px] flex items-center justify-center">
        <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isSessionError || !session) {
    return (
      <div className="fixed inset-0 top-[68px] flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Couldn&apos;t load replay data for this run.</p>
        <Button variant="outline" size="sm" onClick={onBack} className="cursor-pointer gap-1.5">
          <IconArrowLeft className="size-3.5" /> Back to Analyse
        </Button>
      </div>
    );
  }

  if (session.first_candle_index == null || session.last_candle_index == null) {
    return (
      <div className="fixed inset-0 top-[68px] flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">This run has no candle data to replay.</p>
        <Button variant="outline" size="sm" onClick={onBack} className="cursor-pointer gap-1.5">
          <IconArrowLeft className="size-3.5" /> Back to Analyse
        </Button>
      </div>
    );
  }

  const tree = window?.candle_trees.find((t) => t.candle_index === currentCandleIndex);

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="h-8 gap-1.5 cursor-pointer">
            <IconArrowLeft className="size-3.5" /> Back
          </Button>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">Replay</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {session.symbols.join(", ")} · {session.trade_count} trades · {session.indicator_count} indicators
            </span>
          </div>
          {isLoadingWindow && <IconLoader2 className="size-4 animate-spin text-muted-foreground ml-2" />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="h-[320px]">
              <ReplayPriceChart
                candles={window?.candles ?? []}
                markers={session.markers}
                currentCandleIndex={currentCandleIndex}
                onSeek={handleSeek}
              />
            </div>
            {currentCandleIndex != null && (
              <ReplayPlaybackControls
                currentCandleIndex={currentCandleIndex}
                firstCandleIndex={session.first_candle_index}
                lastCandleIndex={session.last_candle_index}
                onSeek={handleSeek}
              />
            )}
            <div className="h-[280px]">
              <ReplayDecisionPanel tree={tree} currentCandleIndex={currentCandleIndex ?? 0} />
            </div>
          </div>

          <div className="h-[624px]">
            <ReplayIndicatorPanel
              snapshots={window?.indicator_snapshots ?? []}
              currentCandleIndex={currentCandleIndex ?? 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
