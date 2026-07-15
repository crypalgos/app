"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { IconCheck, IconClock, IconX } from "@tabler/icons-react";

export { CoinLogo, SymbolChip, baseAsset } from "@/components/shared/coin-logo";

// ─── Run status badge (shared across all report pages) ───────────────────────

export function statusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-2">
          <IconCheck className="size-3 mr-1 inline" /> Completed
        </Badge>
      );
    case "RUNNING":
      return (
        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] px-2 animate-pulse">
          <IconClock className="size-3 mr-1 inline" /> Running
        </Badge>
      );
    case "FAILED":
      return (
        <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] px-2">
          <IconX className="size-3 mr-1 inline" /> Failed
        </Badge>
      );
    default:
      return (
        <Badge className="bg-muted/80 text-muted-foreground border-transparent px-2 text-[10px]">
          {status}
        </Badge>
      );
  }
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export const fmtUsd = (v: number | null | undefined, digits = 2) =>
  v == null
    ? "—"
    : `${v < 0 ? "-" : ""}$${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export const fmtPct = (v: number | null | undefined, digits = 2) =>
  v == null ? "—" : `${v.toFixed(digits)}%`;

export const fmtNum = (v: number | null | undefined, digits = 2) =>
  v == null ? "—" : v.toFixed(digits);

export const fmtSigned = (v: number | null | undefined, digits = 2) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(digits)}`;

export const signClass = (v: number | null | undefined) =>
  v == null ? "text-muted-foreground" : v >= 0 ? "text-success" : "text-destructive";

export function fmtDuration(ms: number): string {
  const hours = ms / 3_600_000;
  if (hours >= 48) return `${(hours / 24).toFixed(1)}d`;
  if (hours >= 1) return `${hours.toFixed(1)}h`;
  return `${Math.round(ms / 60000)}m`;
}

// ─── Small layout bits ────────────────────────────────────────────────────────

export function StatCell({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      <span className={cn("text-sm font-bold font-mono tabular-nums", valueClass ?? "text-foreground")}>{value}</span>
    </div>
  );
}

export function ReportSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/70 mt-2">
      {children}
    </div>
  );
}

/* ─── Bordered card wrapper matching the report-section visual language ─── */
export function ReportCard({
  title,
  badge,
  children,
  className,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-card p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">{title}</h3>
        {badge}
      </div>
      {children}
    </div>
  );
}
