"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { WalkForwardWindowReport } from "@/types/walkforward";

export function WindowTimelineStrip({ windows }: { windows: WalkForwardWindowReport[] }) {
  if (windows.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-1">
        {windows.map((w) => (
          <div
            key={w.window_id}
            className={cn(
              "flex-1 h-8 rounded-md flex items-center justify-center text-[10px] font-mono font-bold",
              w.evaluation.passed ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
            )}
            title={`Window ${w.window_id}: ${w.evaluation.passed ? "PASS" : "FAIL"} (${w.regime})`}
          >
            {w.window_id}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-muted-foreground">Pass</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-400" />
          <span className="text-[10px] text-muted-foreground">Fail</span>
        </div>
      </div>
    </div>
  );
}
