"use client";

import React, { useMemo } from "react";
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { WalkForwardWindowReport } from "@/types/walkforward";

const COLORS = ["#60a5fa", "#f472b6", "#34d399", "#fbbf24", "#a78bfa"];

export function ParameterDriftChart({ windows }: { windows: WalkForwardWindowReport[] }) {
  const paramNames = useMemo(() => {
    if (windows.length === 0) return [];
    return Object.keys(windows[0].parameter_set);
  }, [windows]);

  if (paramNames.length === 0) return null;

  const data = windows.map((w) => {
    const row: Record<string, number> = { window_id: w.window_id };
    for (const p of paramNames) {
      const v = w.parameter_set[p];
      if (typeof v === "number") row[p] = v;
    }
    return row;
  });

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-1">Parameter Drift</h3>
      <p className="text-[11px] text-muted-foreground mb-4">
        The winning parameter chosen for each rolling window — a stable line means the optimizer
        keeps landing on similar values; a jagged one means it&apos;s chasing a different fit every window.
      </p>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
            <XAxis dataKey="window_id" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} label={{ value: "Window", position: "insideBottom", offset: -4, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={40} />
            <Tooltip labelFormatter={(l) => `Window ${l}`} />
            {paramNames.map((p, i) => (
              <Line key={p} type="stepAfter" dataKey={p} name={p} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
