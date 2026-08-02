"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerTrackNext,
  IconPlayerTrackPrev,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
} from "@tabler/icons-react";

const SPEEDS = [1, 2, 4, 8] as const;

interface ReplayPlaybackControlsProps {
  currentCandleIndex: number;
  firstCandleIndex: number;
  lastCandleIndex: number;
  onSeek: (candleIndex: number) => void;
  /** "card" (default) renders its own bordered box; "toolbar" is a bare, compact
   * row meant to sit inline inside another container (the replay top toolbar). */
  variant?: "card" | "toolbar";
  isPlaying?: boolean;
  onPlayingChange?: (isPlaying: boolean) => void;
}

export function ReplayPlaybackControls({
  currentCandleIndex,
  firstCandleIndex,
  lastCandleIndex,
  onSeek,
  variant = "card",
  isPlaying: isPlayingProp,
  onPlayingChange,
}: ReplayPlaybackControlsProps) {
  const [isPlayingState, setIsPlayingState] = useState(false);
  const isPlaying = isPlayingProp ?? isPlayingState;
  const setIsPlaying = (v: boolean | ((p: boolean) => boolean)) => {
    const next = typeof v === "function" ? v(isPlaying) : v;
    setIsPlayingState(next);
    onPlayingChange?.(next);
  };
  const [speedIdx, setSpeedIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRef = useRef(currentCandleIndex);

  useEffect(() => {
    currentRef.current = currentCandleIndex;
  }, [currentCandleIndex]);

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      const next = currentRef.current + 1;
      if (next > lastCandleIndex) {
        setIsPlaying(false);
        return;
      }
      onSeek(next);
    }, 400 / SPEEDS[speedIdx]);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, speedIdx, lastCandleIndex]);

  const step = (delta: number) => {
    setIsPlaying(false);
    const next = Math.min(lastCandleIndex, Math.max(firstCandleIndex, currentCandleIndex + delta));
    onSeek(next);
  };

  // Dragging the slider fires onValueChange on every pointer-move — for an
  // 18k-candle range that's easily hundreds of onSeek calls/sec, each one
  // triggering a store update and (on a window shift) a full chart redraw.
  // Keep the thumb itself perfectly responsive via local state, but batch
  // the actual onSeek call to at most once per animation frame; the final
  // value is always committed exactly on release via onValueCommit so nothing
  // gets dropped.
  const [dragValue, setDragValue] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingSeekRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleSliderChange = ([v]: number[]) => {
    setIsPlaying(false);
    setDragValue(v);
    pendingSeekRef.current = v;
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (pendingSeekRef.current != null) onSeek(pendingSeekRef.current);
      });
    }
  };

  const handleSliderCommit = ([v]: number[]) => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    onSeek(v);
    setDragValue(null);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        variant === "card" && "rounded-xl border border-border/60 bg-card px-4 py-3"
      )}
    >
      <div className="flex items-center gap-2">
        <Button size="icon" variant="outline" className="size-7 cursor-pointer" onClick={() => onSeek(firstCandleIndex)} title="Jump to start">
          <IconPlayerSkipBack className="size-3.5" />
        </Button>
        <Button size="icon" variant="outline" className="size-7 cursor-pointer" onClick={() => step(-1)} title="Step back">
          <IconPlayerTrackPrev className="size-3.5" />
        </Button>
        <Button
          size="icon"
          onClick={() => setIsPlaying((p) => !p)}
          className="size-8 rounded-full cursor-pointer"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <IconPlayerPause className="size-4" /> : <IconPlayerPlay className="size-4" />}
        </Button>
        <Button size="icon" variant="outline" className="size-7 cursor-pointer" onClick={() => step(1)} title="Step forward">
          <IconPlayerTrackNext className="size-3.5" />
        </Button>
        <Button size="icon" variant="outline" className="size-7 cursor-pointer" onClick={() => onSeek(lastCandleIndex)} title="Jump to end">
          <IconPlayerSkipForward className="size-3.5" />
        </Button>

        <button
          onClick={() => setSpeedIdx((i) => (i + 1) % SPEEDS.length)}
          className="ml-auto h-7 px-2.5 rounded-md text-[10px] font-mono font-bold text-muted-foreground hover:bg-muted/60 cursor-pointer"
          title="Playback speed"
        >
          {SPEEDS[speedIdx]}x
        </button>

        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
          bar {currentCandleIndex} / {lastCandleIndex}
        </span>
      </div>

      <Slider
        min={firstCandleIndex}
        max={lastCandleIndex}
        step={1}
        value={[dragValue ?? currentCandleIndex]}
        onValueChange={handleSliderChange}
        onValueCommit={handleSliderCommit}
      />
    </div>
  );
}
