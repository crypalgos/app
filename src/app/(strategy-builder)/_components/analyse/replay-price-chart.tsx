"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  createChart,
  createSeriesMarkers,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type UTCTimestamp,
  type Time,
} from "lightweight-charts";
import type { ReplayCandle, ReplayMarker, IndicatorSnapshotRecord, CandleTreeGroup, PolicyEvent } from "@/types/replay";
import { formatIndicatorLabel } from "@/types/replay";
import { getIndicatorDefinition, isPriceScaleIndicator } from "@/lib/indicators";
import { flattenAllTrees } from "@/lib/replay-analysis";
import { cn } from "@/lib/utils";

const MARKER_COLORS: Record<ReplayMarker["type"], string> = {
  entry: "#34d399",
  exit: "#f87171",
  policy: "#fbbf24",
  liquidation: "#ef4444",
};

const SL_TP_COLORS = { STOP_LOSS: "#fb923c", TRAILING_STOP: "#fb923c", TAKE_PROFIT: "#38bdf8" };

function timeOf(c: ReplayCandle): Time {
  return (c.timestamp != null ? Math.floor(c.timestamp / 1000) : c.candle_index) as UTCTimestamp;
}

interface ReplayPriceChartProps {
  candles: ReplayCandle[];
  indicatorSnapshots: IndicatorSnapshotRecord[];
  markers: ReplayMarker[];
  /** The loaded window's nested event trees — flattened here to find
   * PolicyArmedEvent (real SL/TP data) for chart markers. */
  candleTrees: CandleTreeGroup[];
  currentCandleIndex: number | null;
  onSeek: (candleIndex: number) => void;
  /** Effective (override-resolved) color per indicator key — computed once by
   * the parent so the chart overlay and the left-panel legend always agree. */
  indicatorColors: Record<string, string>;
  /** Indicator keys the user has toggled off — skipped entirely on the chart. */
  hiddenIndicators: Set<string>;
  /** Length/period overrides for indicators with a client-side `compute`
   * formula — when set, the overlay is recomputed from this window's closes
   * instead of using the backend-provided (strategy-configured-period) values. */
  periodOverrides: Record<string, number>;
  /** Set while hovering a Timeline row in the Analysis Console — pins the
   * crosshair there as a preview without committing `currentCandleIndex`. */
  previewCandleIndex?: number | null;
}

export function ReplayPriceChart({
  candles,
  indicatorSnapshots,
  markers,
  candleTrees,
  currentCandleIndex,
  onSeek,
  indicatorColors,
  hiddenIndicators,
  periodOverrides,
  previewCandleIndex,
}: ReplayPriceChartProps) {
  // lightweight-charts' internal color parser only understands hex/rgb(a)/hsl(a)
  // and named colors — it can't resolve CSS custom properties or oklch(), so the
  // theme's own var(--muted-foreground) can't be handed to it directly. Mirror
  // the same hardcoded light/dark pair already used for the canvas background
  // in _components/index.tsx rather than introducing a CSS-var resolver.
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const textColor = isDark ? "#9CA3AF" : "#6B7280";
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.06)";
  const crosshairColor = isDark ? "#758696" : "#9598A1";

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const overlaySeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  const candleIndexByTimeRef = useRef<Map<Time, number>>(new Map());
  const onSeekRef = useRef(onSeek);
  useEffect(() => {
    onSeekRef.current = onSeek;
  }, [onSeek]);

  // key -> indicator type, first-seen across the window's snapshots.
  const typeByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const snap of indicatorSnapshots) {
      for (const [key, entry] of Object.entries(snap.values ?? {})) {
        if (!map.has(key)) map.set(key, entry.type);
      }
    }
    return map;
  }, [indicatorSnapshots]);

  // Length-overridden series recomputed from this window's closes, keyed by
  // candle_index — shared by both the chart overlay effect and the on-chart
  // legend so they never disagree on the recomputed value at a given bar.
  const overriddenValuesByKey = useMemo(() => {
    const result = new Map<string, Map<number, number>>();
    const sorted = candles
      .filter((c) => c.close != null)
      .slice()
      .sort((a, b) => a.candle_index - b.candle_index);
    const closes = sorted.map((c) => c.close as number);
    for (const [key, period] of Object.entries(periodOverrides)) {
      const type = typeByKey.get(key);
      const definition = type ? getIndicatorDefinition(type) : undefined;
      if (!definition?.compute) continue;
      const computed = definition.compute(closes, period);
      const byIndex = new Map<number, number>();
      computed.forEach((v, i) => {
        if (v != null) byIndex.set(sorted[i].candle_index, v);
      });
      result.set(key, byIndex);
    }
    return result;
  }, [candles, periodOverrides, typeByKey]);

  // Crosshair-hover tracking for the on-chart OHLCV/indicator legend — only
  // triggers a re-render when the hovered bar actually changes (not on every
  // pixel of mouse movement within the same bar's column).
  const [hoveredCandleIndex, setHoveredCandleIndex] = useState<number | null>(null);
  const hoveredIndexRef = useRef<number | null>(null);

  // Create the chart once; never recreate on prop changes.
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { color: "transparent" }, textColor, fontSize: 11, fontFamily: "var(--font-mono, monospace)" },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: gridColor },
      },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.08, bottom: 0.28 } },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      crosshair: {
        mode: 0,
        vertLine: { color: crosshairColor, width: 1, style: 3, labelBackgroundColor: crosshairColor },
        horzLine: { color: crosshairColor, width: 1, style: 3, labelBackgroundColor: crosshairColor },
      },
      autoSize: true,
    });

    // TradingView's own default candle palette — teal/red, not the generic
    // Tailwind emerald/red used elsewhere in the app, for a premium terminal feel.
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "rgba(120,123,134,0.5)",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    const markersPlugin = createSeriesMarkers(candleSeries, []);

    chart.subscribeClick((param) => {
      if (param.time == null) return;
      const idx = candleIndexByTimeRef.current.get(param.time);
      if (idx != null) onSeekRef.current(idx);
    });

    chart.subscribeCrosshairMove((param) => {
      const idx = param.time != null ? candleIndexByTimeRef.current.get(param.time) ?? null : null;
      if (idx !== hoveredIndexRef.current) {
        hoveredIndexRef.current = idx;
        setHoveredCandleIndex(idx);
      }
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    markersPluginRef.current = markersPlugin;
    const overlaySeries = overlaySeriesRef.current;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      markersPluginRef.current = null;
      overlaySeries.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync layout text color when the theme changes, without recreating the chart.
  useEffect(() => {
    chartRef.current?.applyOptions({ layout: { textColor } });
  }, [textColor]);

  // Candles + volume + candle_index/time lookup.
  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!candleSeries || !volumeSeries) return;

    const valid = candles.filter((c) => c.open != null && c.high != null && c.low != null && c.close != null);
    const byTime = new Map<Time, number>();
    const candleData = valid.map((c) => {
      const t = timeOf(c);
      byTime.set(t, c.candle_index);
      return { time: t, open: c.open as number, high: c.high as number, low: c.low as number, close: c.close as number };
    });
    candleIndexByTimeRef.current = byTime;
    candleSeries.setData(candleData);

    const volumeData = valid
      .filter((c) => c.volume != null)
      .map((c) => ({
        time: timeOf(c),
        value: c.volume as number,
        color: (c.close as number) >= (c.open as number) ? "rgba(38,166,154,0.4)" : "rgba(239,83,80,0.4)",
      }));
    volumeSeries.setData(volumeData);
  }, [candles]);

  // Price-scale indicator overlays — one line series per indicator key present
  // in the window (excluding anything the user toggled off), grouped across
  // all candles and sorted by time. Keys with a length override in
  // overriddenValuesByKey replace the backend-provided series entirely.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const seriesByKey: Map<string, { time: Time; value: number }[]> = new Map();
    const labelByKey = new Map<string, string>();
    for (const snap of indicatorSnapshots) {
      const t = (snap.timestamp != null ? Math.floor(snap.timestamp / 1000) : snap.bar_index) as UTCTimestamp;
      for (const [key, entry] of Object.entries(snap.values ?? {})) {
        if (!isPriceScaleIndicator(entry.type) || hiddenIndicators.has(key)) continue;
        if (!seriesByKey.has(key)) {
          seriesByKey.set(key, []);
          labelByKey.set(key, formatIndicatorLabel(entry));
        }
        seriesByKey.get(key)!.push({ time: t, value: entry.value });
      }
    }

    for (const [key, byIndex] of overriddenValuesByKey) {
      const type = typeByKey.get(key);
      if (!type || hiddenIndicators.has(key)) continue;
      const definition = getIndicatorDefinition(type);
      const points: { time: Time; value: number }[] = [];
      for (const c of candles) {
        const v = byIndex.get(c.candle_index);
        if (v != null) points.push({ time: timeOf(c), value: v });
      }
      seriesByKey.set(key, points);
      labelByKey.set(key, `${definition.label ?? type} ${periodOverrides[key]}`);
    }

    const existing = overlaySeriesRef.current;
    for (const [key, series] of existing) {
      if (!seriesByKey.has(key)) {
        chart.removeSeries(series);
        existing.delete(key);
      }
    }
    for (const [key, points] of seriesByKey) {
      points.sort((a, b) => (a.time as number) - (b.time as number));
      let series = existing.get(key);
      if (!series) {
        series = chart.addSeries(LineSeries, {
          color: indicatorColors[key] ?? "#818cf8",
          lineWidth: getIndicatorDefinition(typeByKey.get(key) ?? "").lineWidth ?? 2,
          title: labelByKey.get(key),
          priceLineVisible: false,
          lastValueVisible: true,
        });
        existing.set(key, series);
      }
      series.setData(points);
    }
    // indicatorColors intentionally excluded — the effect below re-colors
    // existing series in place without rebuilding their data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicatorSnapshots, hiddenIndicators, candles, overriddenValuesByKey, typeByKey, periodOverrides]);

  // Re-color existing overlay series live when the user picks a new color,
  // without rebuilding the series (avoids a flicker/re-fetch of its data).
  useEffect(() => {
    for (const [key, series] of overlaySeriesRef.current) {
      const color = indicatorColors[key];
      if (color) series.applyOptions({ color });
    }
  }, [indicatorColors]);

  // Trade markers: session-level entry/exit/liquidation (already typed) plus
  // real SL/TP flags from PolicyArmedEvent, flattened from the loaded
  // window's trees — not guessed from order payloads.
  useEffect(() => {
    const plugin = markersPluginRef.current;
    if (!plugin) return;
    const byTime = candleIndexByTimeRef.current;
    const timeForCandleIndex = new Map<number, Time>();
    for (const [t, idx] of byTime) timeForCandleIndex.set(idx, t);

    const sessionMarkers = markers
      .filter((m) => m.candle_index != null && timeForCandleIndex.has(m.candle_index))
      .map((m) => ({
        time: timeForCandleIndex.get(m.candle_index as number)!,
        position: (m.type === "exit" || m.type === "liquidation" ? "aboveBar" : "belowBar") as "aboveBar" | "belowBar",
        color: MARKER_COLORS[m.type],
        shape: (m.type === "liquidation" ? "square" : m.type === "entry" ? "arrowUp" : "arrowDown") as
          | "square"
          | "arrowUp"
          | "arrowDown",
        text: m.type[0].toUpperCase() + m.type.slice(1),
      }));

    const policyMarkers = flattenAllTrees(candleTrees)
      .filter((ev): ev is typeof ev & PolicyEvent => ev.type === "POLICY_ARMED")
      .filter((ev) => timeForCandleIndex.has(ev.candle_index))
      .map((ev) => {
        const isTakeProfit = ev.payload.policy_type === "TAKE_PROFIT";
        return {
          time: timeForCandleIndex.get(ev.candle_index)!,
          position: "inBar" as const,
          color: isTakeProfit ? SL_TP_COLORS.TAKE_PROFIT : SL_TP_COLORS.STOP_LOSS,
          shape: "square" as const,
          text: isTakeProfit ? "TP" : "SL",
        };
      });

    plugin.setMarkers([...sessionMarkers, ...policyMarkers].sort((a, b) => (a.time as number) - (b.time as number)));
  }, [markers, candles, candleTrees]);

  // Current-bar indicator: pin the crosshair to the previewed bar (Timeline
  // hover) when set, falling back to the committed currentCandleIndex.
  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;
    const pinIndex = previewCandleIndex ?? currentCandleIndex;
    if (pinIndex == null) {
      chart.clearCrosshairPosition();
      return;
    }
    const bar = candles.find((c) => c.candle_index === pinIndex);
    if (bar && bar.close != null) {
      chart.setCrosshairPosition(bar.close, timeOf(bar), candleSeries);
    }
  }, [currentCandleIndex, previewCandleIndex, candles]);

  // On-chart legend data: the hovered bar while scrubbing the crosshair,
  // falling back to the current replay bar otherwise — mirrors TradingView's
  // own top-left OHLCV + indicator legend convention.
  const legendCandleIndex = hoveredCandleIndex ?? currentCandleIndex;
  const legendCandle = useMemo(
    () => (legendCandleIndex != null ? candles.find((c) => c.candle_index === legendCandleIndex) : undefined),
    [candles, legendCandleIndex]
  );
  const legendIndicators = useMemo(() => {
    if (legendCandleIndex == null) return [];
    const snap = indicatorSnapshots.find((s) => (s.bar_index ?? -1) === legendCandleIndex);
    if (!snap) return [];
    return Object.entries(snap.values ?? {})
      .filter(([key]) => !hiddenIndicators.has(key))
      .map(([key, entry]) => {
        const definition = getIndicatorDefinition(entry.type);
        const overridePeriod = periodOverrides[key];
        const overriddenValue = overriddenValuesByKey.get(key)?.get(legendCandleIndex);
        const value = overriddenValue ?? entry.value;
        const label =
          overridePeriod != null ? `${definition.label ?? entry.type} ${overridePeriod}` : formatIndicatorLabel(entry);
        return {
          key,
          label,
          value: value.toFixed(definition.decimals ?? 2),
          color: indicatorColors[key] ?? "#818cf8",
          onPriceScale: isPriceScaleIndicator(entry.type),
        };
      });
  }, [legendCandleIndex, indicatorSnapshots, hiddenIndicators, indicatorColors, overriddenValuesByKey, periodOverrides]);

  const legendIsUp =
    legendCandle?.close != null && legendCandle?.open != null ? legendCandle.close >= legendCandle.open : true;
  const legendChangePct =
    legendCandle?.close != null && legendCandle?.open != null && legendCandle.open !== 0
      ? ((legendCandle.close - legendCandle.open) / legendCandle.open) * 100
      : null;

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {legendCandle && (
        <div className="absolute top-2 left-2 z-10 pointer-events-none flex flex-col gap-1 max-w-[85%]">
          <div className="flex items-center gap-2.5 flex-wrap bg-background/60 backdrop-blur-sm px-2 py-1 rounded-md text-[10.5px] font-mono">
            <LegendField label="O" value={legendCandle.open} up={legendIsUp} />
            <LegendField label="H" value={legendCandle.high} up={legendIsUp} />
            <LegendField label="L" value={legendCandle.low} up={legendIsUp} />
            <LegendField label="C" value={legendCandle.close} up={legendIsUp} />
            {legendChangePct != null && (
              <span className={cn("font-semibold", legendIsUp ? "text-[#26a69a]" : "text-[#ef5350]")}>
                {legendIsUp ? "+" : ""}
                {legendChangePct.toFixed(2)}%
              </span>
            )}
            {legendCandle.volume != null && (
              <span className="text-muted-foreground">
                Vol <span className="text-foreground/80 font-semibold">{legendCandle.volume.toLocaleString()}</span>
              </span>
            )}
          </div>
          {legendIndicators.filter((i) => i.onPriceScale).length > 0 && (
            <div className="flex items-center gap-2.5 flex-wrap bg-background/60 backdrop-blur-sm px-2 py-1 rounded-md text-[10.5px] font-mono">
              {legendIndicators
                .filter((i) => i.onPriceScale)
                .map((ind) => (
                  <span key={ind.key} className="font-semibold" style={{ color: ind.color }}>
                    {ind.label} {ind.value}
                  </span>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LegendField({ label, value, up }: { label: string; value?: number; up: boolean }) {
  if (value == null) return null;
  return (
    <span className="text-muted-foreground">
      {label} <span className={cn("font-semibold", up ? "text-[#26a69a]" : "text-[#ef5350]")}>{value.toFixed(2)}</span>
    </span>
  );
}
