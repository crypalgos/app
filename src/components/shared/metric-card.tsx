"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function formatCurrencyValue(val: number) {
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  return `${isNegative ? "-" : ""}$${absVal.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ─── Stat Card (top KPI row) ─── */
interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  color?: string;
  subValue?: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional one-line explanation rendered below the value, muted and small. */
  description?: string;
}

export function MetricCard({ title, value, color, subValue, description }: MetricCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl bg-card border border-border/50 p-4 transition-all duration-200 hover:border-border/80 min-w-0">
      {/* Title */}
      <span className="text-[12px] font-medium text-muted-foreground tracking-wide mb-2">
        {title}
      </span>

      {/* Main Value */}
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "text-xl font-bold font-mono tabular-nums tracking-tight",
            color ?? "text-foreground"
          )}
        >
          {value}
        </span>

        {subValue && (
          <span className="text-[11px] font-mono text-muted-foreground/80 font-medium">
            {subValue}
          </span>
        )}
      </div>

      {/* Optional description footer */}
      {description && (
        <span className="text-[11px] text-muted-foreground/70 mt-1">
          {description}
        </span>
      )}
    </div>
  );
}

/* ─── Metric Row (key-value in stat panels) ─── */
interface MetricRowProps {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}

export function MetricRow({ label, value, highlight }: MetricRowProps) {
  return (
    <div
      className={cn(
        "flex items-center py-2 text-[13px] gap-2",
        highlight ? "border-t border-border/60 pt-2.5 mt-1" : ""
      )}
    >
      <span className="text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 border-b border-dashed border-border/40 h-3 relative -top-1 shrink min-w-[20px]" />
      <span className="font-mono font-bold tabular-nums text-foreground shrink-0">{value}</span>
    </div>
  );
}

/* ─── Section wrapper ─── */
interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({ title, icon, badge, children, className, noPadding }: SectionCardProps) {
  return (
    <div className={cn(
      "rounded-xl bg-card border border-border/60 overflow-hidden",
      className
    )}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">{title}</h3>
        </div>
        {badge}
      </div>
      {/* Content */}
      <div className={noPadding ? "" : "p-5"}>
        {children}
      </div>
    </div>
  );
}
