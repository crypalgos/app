"use client";

import React from "react";

interface ChartTooltipProps {
  active?: boolean;
  payload?: { name?: string; value: number; color?: string; payload: { formattedTime?: string; [key: string]: any } }[];
  label?: string;
  valueFormatter?: (val: number) => string;
  valueLabel?: string;
  accentColor?: string;
}

export function ChartTooltip({
  active,
  payload,
  valueFormatter,
  valueLabel = "Value",
  accentColor = "#818cf8",
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const firstItem = payload[0];
  const timeLabel = firstItem?.payload?.formattedTime || firstItem?.payload?.time || "";

  return (
    <div className="bg-card/95 backdrop-blur-md border border-border/80 px-3.5 py-2.5 rounded-xl shadow-xl min-w-[170px] transition-all duration-200 z-50">
      {timeLabel && (
        <p className="text-[11px] font-semibold text-muted-foreground/80 mb-2 font-mono tracking-wider border-b border-border/40 pb-1.5">
          {timeLabel}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        {payload.map((item, idx) => {
          const itemColor = item.color || accentColor;
          const displayLabel = item.name || valueLabel;
          const formattedVal = valueFormatter ? valueFormatter(item.value) : item.value;

          return (
            <div key={idx} className="flex items-center justify-between gap-3 text-[12.5px]">
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full shrink-0 shadow-xs"
                  style={{
                    backgroundColor: itemColor,
                    boxShadow: `0 0 8px ${itemColor}80`,
                  }}
                />
                <span className="text-muted-foreground font-medium">{displayLabel}</span>
              </div>
              <span className="font-bold font-mono text-foreground tabular-nums">
                {formattedVal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
