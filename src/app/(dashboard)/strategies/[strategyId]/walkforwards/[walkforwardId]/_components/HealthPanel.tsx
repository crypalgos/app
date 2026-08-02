"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { HealthReport } from "@/types/optimization";
import { IconHeartbeat, IconAlertTriangle, IconX } from "@tabler/icons-react";
import { WalkforwardSectionCard } from "./WalkforwardSectionCard";

export function HealthPanel({ health }: { health: HealthReport }) {
  const color =
    health.status === "HEALTHY" ? "text-emerald-500 dark:text-emerald-400" : health.status === "WARNING" ? "text-amber-500 dark:text-amber-400" : "text-rose-500 dark:text-rose-400";
  const badge = (
    <span className={cn("text-sm font-bold", color)}>{health.status}</span>
  );

  if (health.warnings.length === 0 && health.errors.length === 0) {
    return (
      <WalkforwardSectionCard title="Health" icon={IconHeartbeat} badge={badge}>
        <p className="text-[13px] text-muted-foreground">No warnings or errors on this run.</p>
      </WalkforwardSectionCard>
    );
  }

  return (
    <WalkforwardSectionCard title="Health" icon={IconHeartbeat} badge={badge}>
      {health.warnings.length > 0 && (
        <ul className="space-y-1.5">
          {health.warnings.map((w, i) => (
            <li key={i} className="text-[13px] text-amber-600 dark:text-amber-400/90 flex items-start gap-1.5">
              <IconAlertTriangle className="size-3.5 text-amber-500 dark:text-amber-400/70 shrink-0 mt-0.5" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
      {health.errors.length > 0 && (
        <ul className="space-y-1.5 mt-2">
          {health.errors.map((e, i) => (
            <li key={i} className="text-[13px] text-rose-600 dark:text-rose-400/90 flex items-start gap-1.5">
              <IconX className="size-3.5 text-rose-500 dark:text-rose-400/70 shrink-0 mt-0.5" />
              <span>{e}</span>
            </li>
          ))}
        </ul>
      )}
    </WalkforwardSectionCard>
  );
}
