"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface WalkforwardSectionCardProps {
  title: string;
  /** Optional one-line description shown under the title, muted and small. */
  subtitle?: React.ReactNode;
  /** Optional leading icon, rendered in a small blue badge next to the title. */
  icon?: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

/**
 * Richer section-card shell used across this walkforward report page only
 * (icon badge + subtitle + header divider) -- kept local rather than
 * changing the shared ReportCard/SectionCard, which are also used by the
 * optimization/montecarlo/backtest report pages. Mirrors
 * OptimizationSectionCard's shape, with the walkforward blue accent.
 */
export function WalkforwardSectionCard({
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
  className,
  noPadding,
}: WalkforwardSectionCardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-none overflow-hidden",
      className
    )}>
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="size-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Icon className="size-4 text-blue-500 dark:text-blue-400" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-foreground tracking-tight truncate">{title}</h3>
            {subtitle && <p className="text-[12px] text-muted-foreground/70">{subtitle}</p>}
          </div>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
      <div className={noPadding ? "" : "p-5"}>
        {children}
      </div>
    </div>
  );
}
