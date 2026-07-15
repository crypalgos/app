"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
}

export function ReplayPlaybackControls({
  currentCandleIndex,
  firstCandleIndex,
  lastCandleIndex,
  onSeek,
}: ReplayPlaybackControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
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

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card px-4 py-3">
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
        value={[currentCandleIndex]}
        onValueChange={([v]) => {
          setIsPlaying(false);
          onSeek(v);
        }}
      />
    </div>
  );
}
