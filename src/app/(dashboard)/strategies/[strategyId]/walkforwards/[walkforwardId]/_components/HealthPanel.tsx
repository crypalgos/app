"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { HealthReport } from "@/types/optimization";

export function HealthPanel({ health }: { health: HealthReport }) {
  const color =
    health.status === "HEALTHY" ? "text-emerald-400" : health.status === "WARNING" ? "text-amber-400" : "text-red-400";

  if (health.warnings.length === 0 && health.errors.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-1">Health</h3>
        <span className={cn("text-sm font-bold", color)}>{health.status}</span>
        <p className="text-xs text-muted-foreground mt-1">No warnings or errors on this run.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">Health</h3>
        <span className={cn("text-sm font-bold", color)}>{health.status}</span>
      </div>
      {health.warnings.length > 0 && (
        <ul className="space-y-1">
          {health.warnings.map((w, i) => (
            <li key={i} className="text-xs text-amber-400/90 flex items-baseline gap-1.5">
              <span className="text-amber-400/50">&bull;</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
      {health.errors.length > 0 && (
        <ul className="space-y-1 mt-2">
          {health.errors.map((e, i) => (
            <li key={i} className="text-xs text-red-400/90 flex items-baseline gap-1.5">
              <span className="text-red-400/50">&bull;</span>
              <span>{e}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
