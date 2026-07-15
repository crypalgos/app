"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
} from "recharts";
import type { ReplayCandle, ReplayMarker } from "@/types/replay";

const LINE_COLOR = "#818cf8"; // indigo-400
const MARKER_COLORS: Record<ReplayMarker["type"], string> = {
  entry: "#34d399",
  exit: "#f87171",
  policy: "#fbbf24",
  liquidation: "#ef4444",
};

interface ReplayPriceChartProps {
  candles: ReplayCandle[];
  markers: ReplayMarker[];
  currentCandleIndex: number | null;
  onSeek: (candleIndex: number) => void;
}

export function ReplayPriceChart({ candles, markers, currentCandleIndex, onSeek }: ReplayPriceChartProps) {
  const data = candles
    .filter((c) => c.close != null)
    .map((c) => ({ candle_index: c.candle_index, close: c.close as number }));

  const markerByCandle = new Map<number, ReplayMarker>();
  for (const m of markers) {
    if (m.candle_index != null) markerByCandle.set(m.candle_index, m);
  }

  return (
    <div className="h-full rounded-xl bg-card border border-border/60 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
        <h3 className="text-[12px] font-semibold text-foreground/80 tracking-wide">Price</h3>
        <span className="text-[10px] font-mono text-muted-foreground/60">
          {data.length.toLocaleString()} bars loaded
        </span>
      </div>
      <div className="flex-1 min-h-[220px] px-1 pb-1">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No candle data in this window.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 16, right: 12, left: 4, bottom: 4 }}
              onClick={(state) => {
                const idx = state?.activeLabel;
                if (idx != null) onSeek(Number(idx));
              }}
            >
              <defs>
                <linearGradient id="replayPriceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={LINE_COLOR} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={LINE_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
              <XAxis
                dataKey="candle_index"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                minTickGap={40}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                width={48}
                domain={["auto", "auto"]}
              />
              <RechartsTooltip
                cursor={{ stroke: "var(--border)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border border-border/60 bg-popover px-2.5 py-1.5 text-[11px] shadow-md">
                      <div className="font-mono text-muted-foreground">bar {label}</div>
                      <div className="font-semibold text-foreground">
                        {Number(payload[0].value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={LINE_COLOR}
                strokeWidth={1.5}
                fill="url(#replayPriceGrad)"
                dot={false}
                isAnimationActive={false}
              />
              {currentCandleIndex != null && (
                <ReferenceLine x={currentCandleIndex} stroke="var(--foreground)" strokeOpacity={0.5} strokeDasharray="3 3" />
              )}
              {data.map((d) => {
                const marker = markerByCandle.get(d.candle_index);
                if (!marker) return null;
                return (
                  <ReferenceDot
                    key={`${marker.type}-${d.candle_index}-${marker.sequence_number ?? 0}`}
                    x={d.candle_index}
                    y={d.close}
                    r={3.5}
                    fill={MARKER_COLORS[marker.type]}
                    stroke="var(--card)"
                    strokeWidth={1}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="flex items-center gap-3 px-4 py-1.5 border-t border-border/40">
        {(Object.keys(MARKER_COLORS) as ReplayMarker["type"][]).map((type) => (
          <div key={type} className="flex items-center gap-1">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: MARKER_COLORS[type] }} />
            <span className="text-[9px] text-muted-foreground capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
