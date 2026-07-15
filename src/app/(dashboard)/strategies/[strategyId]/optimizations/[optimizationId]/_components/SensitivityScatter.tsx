"use client";

import React, { useMemo } from "react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { OptimizationAllResultRow } from "@/types/optimization";

export function SensitivityScatter({ results }: { results: OptimizationAllResultRow[] }) {
  const paramNames = useMemo(() => {
    if (results.length === 0) return [];
    return Object.keys(results[0].parameters);
  }, [results]);

  if (paramNames.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-1">Parameter Sensitivity</h3>
      <p className="text-[11px] text-muted-foreground mb-4">
        Every tested value for each swept parameter, plotted against the objective score for that
        run — a tight, smooth curve means the strategy is insensitive to small changes; a jagged,
        scattered one means small parameter changes swing performance a lot.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paramNames.map((param) => {
          const points = results
            .map((r) => ({ x: r.parameters[param], y: r.objective_score }))
            .sort((a, b) => a.x - b.x);
          return (
            <div key={param}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {param}
              </span>
              <div className="h-[160px] mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                    <XAxis dataKey="x" type="number" name={param} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="y" type="number" name="objective" tick={{ fontSize: 10 }} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      formatter={(value, name) => [Number(value).toFixed(3), name === "y" ? "objective" : param]}
                    />
                    <Scatter data={points} fill="var(--primary)" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
