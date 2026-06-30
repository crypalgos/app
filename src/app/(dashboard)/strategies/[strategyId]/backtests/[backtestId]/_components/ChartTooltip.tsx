"use client";

import React from "react";

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  valueFormatter?: (val: any) => string;
  valueLabel?: string;
  accentColor?: string;
}

export function ChartTooltip({
  active,
  payload,
  valueFormatter,
  valueLabel = "Value",
  accentColor = "var(--primary)",
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-popover/95 backdrop-blur-xl border border-border px-4 py-3 rounded-lg shadow-2xl min-w-[160px]">
      <p className="text-[10px] font-medium text-muted-foreground mb-1.5 tracking-wide">
        {data.formattedTime}
      </p>
      <div className="flex items-center gap-2">
        <div
          className="size-1.5 rounded-full shrink-0"
          style={{ backgroundColor: accentColor }}
        />
        <span className="text-[11px] text-muted-foreground">{valueLabel}</span>
        <span className="text-[13px] font-semibold font-mono text-foreground ml-auto tabular-nums">
          {valueFormatter ? valueFormatter(payload[0].value) : payload[0].value}
        </span>
      </div>
    </div>
  );
}
