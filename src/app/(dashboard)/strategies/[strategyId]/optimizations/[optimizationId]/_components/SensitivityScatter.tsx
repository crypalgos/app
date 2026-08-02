"use client";

import React, { useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid } from "recharts";
import type { OptimizationAllResultRow } from "@/types/optimization";
import { IconChartScatter } from "@tabler/icons-react";
import { OptimizationSectionCard } from "./OptimizationSectionCard";
import { formatParamKey } from "@/components/backtest/metric-format";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export function SensitivityScatter({ results }: { results: OptimizationAllResultRow[] }) {
  const paramNames = useMemo(() => {
    if (results.length === 0) return [];
    return Object.keys(results[0].parameters);
  }, [results]);

  if (paramNames.length === 0) return null;

  return (
    <OptimizationSectionCard
      title="Parameter Sensitivity"
      subtitle="Tight & smooth = the strategy is insensitive to small changes. Jagged & scattered = small changes swing performance a lot."
      icon={IconChartScatter}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paramNames.map((param) => {
          const points = results
            .map((r) => ({ x: r.parameters[param], y: r.objective_score }))
            .sort((a, b) => a.x - b.x);
          const paramLabel = formatParamKey(param);
          const chartConfig: ChartConfig = {
            x: { label: paramLabel, color: "#8b5cf6" },
            y: { label: "Objective", color: "#8b5cf6" },
          };
          return (
            <div key={param} className="rounded-lg border border-border/40 bg-muted/[0.03] p-3">
              <span className="text-[13px] font-semibold text-foreground/80" title={param}>{paramLabel}</span>
              <ChartContainer config={chartConfig} className="h-[160px] w-full mt-1 aspect-auto">
                <ScatterChart margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="x" type="number" name={paramLabel} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="y" type="number" name="objective" tick={{ fontSize: 10 }} />
                  <ChartTooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name) => (
                          <div className="flex flex-1 items-center justify-between gap-3">
                            <span className="text-muted-foreground">{name === "y" ? "Objective" : paramLabel}</span>
                            <span className="font-mono font-medium text-foreground tabular-nums">{Number(value).toFixed(3)}</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Scatter data={points} fill="var(--color-x)" />
                </ScatterChart>
              </ChartContainer>
            </div>
          );
        })}
      </div>
    </OptimizationSectionCard>
  );
}
