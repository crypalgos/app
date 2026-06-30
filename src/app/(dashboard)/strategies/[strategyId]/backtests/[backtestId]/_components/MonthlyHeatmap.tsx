"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { IconCalendar } from "@tabler/icons-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface MonthlyHeatmapProps {
  heatmapData: Record<string, Record<string, number | null>>;
}

export function MonthlyHeatmap({ heatmapData }: MonthlyHeatmapProps) {
  if (!heatmapData || Object.keys(heatmapData).length === 0) return null;

  const years = Object.keys(heatmapData).sort();

  // Get cell color — uses inline styles for the rgba background but theme-aware text classes
  const getCellStyle = (val: number) => {
    const intensity = Math.min(Math.abs(val) / 12, 1);
    if (val > 0) {
      return {
        bg: `rgba(52, 211, 153, ${0.08 + intensity * 0.22})`,
        text: "text-success",
      };
    }
    return {
      bg: `rgba(248, 113, 113, ${0.08 + intensity * 0.22})`,
      text: "text-destructive",
    };
  };

  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/40">
        <IconCalendar className="size-3.5 text-muted-foreground" />
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">Monthly Returns</h3>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-2 w-[56px]">
                Year
              </th>
              {MONTHS.map((m) => (
                <th
                  key={m}
                  className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5 pb-2 w-[60px]"
                >
                  {m}
                </th>
              ))}
              <th className="text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 pb-2 w-[64px]">
                Year
              </th>
            </tr>
          </thead>
          <tbody>
            {years.map((year) => {
              const months = heatmapData[year];
              let ytdMultiplier = 1;
              let hasData = false;

              const cells = Array.from({ length: 12 }).map((_, i) => {
                const val = months[String(i + 1)];
                if (val !== null && val !== undefined) {
                  ytdMultiplier *= 1 + val / 100;
                  hasData = true;
                  return val;
                }
                return null;
              });

              const ytd = (ytdMultiplier - 1) * 100;

              return (
                <tr key={year}>
                  <td className="font-mono text-[12px] font-semibold text-foreground/70 px-2 py-0.5">
                    {year}
                  </td>
                  {cells.map((val, i) => {
                    if (val === null) {
                      return (
                        <td key={i} className="px-0.5 py-0.5">
                          <div className="h-[32px] rounded-md bg-muted/50 flex items-center justify-center">
                            <span className="text-muted-foreground/30 text-[10px]">—</span>
                          </div>
                        </td>
                      );
                    }

                    const style = getCellStyle(val);
                    return (
                      <td key={i} className="px-0.5 py-0.5">
                        <div
                          className="h-[32px] rounded-md flex items-center justify-center transition-colors duration-150"
                          style={{ backgroundColor: style.bg }}
                        >
                          <span className={cn("text-[11px] font-mono font-semibold tabular-nums", style.text)}>
                            {val > 0 ? "+" : ""}
                            {val.toFixed(1)}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-2 py-0.5">
                    <div className="h-[32px] flex items-center justify-end">
                      {hasData ? (
                        <span
                          className={cn(
                            "text-[12px] font-mono font-bold tabular-nums",
                            ytd > 0 ? "text-success" : ytd < 0 ? "text-destructive" : "text-muted-foreground"
                          )}
                        >
                          {ytd > 0 ? "+" : ""}
                          {ytd.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30 text-[11px]">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
