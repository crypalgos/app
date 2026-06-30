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
}

export function MetricCard({ title, value, color, subValue, icon: Icon }: MetricCardProps) {
  return (
    <div className="relative flex flex-col gap-3 rounded-xl bg-card border border-border/60 px-5 py-4 overflow-hidden group hover:border-border transition-colors duration-200">
      {/* Faint watermark icon */}
      {Icon && (
        <div className="absolute -right-2 -bottom-2 pointer-events-none">
          <Icon className="size-14 text-muted-foreground/[0.06]" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground tracking-wide leading-none">
          {title}
        </span>
        {subValue && (
          <span className="text-[10px] font-mono text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
            {subValue}
          </span>
        )}
      </div>

      <span
        className={cn(
          "text-[22px] font-semibold font-mono tabular-nums tracking-tight leading-none",
          color ?? "text-foreground"
        )}
      >
        {value}
      </span>
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
