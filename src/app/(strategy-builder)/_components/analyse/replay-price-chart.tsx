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

/** True when only the already-rendered forming candle has changed. */
function hasOnlyMutableTailChanged(previous: ReplayCandle[], next: ReplayCandle[]): boolean {
  if (previous.length === 0 || previous.length !== next.length) return false;
  for (let index = 0; index < next.length - 1; index += 1) {
    if (previous[index] !== next[index]) return false;
  }
  return previous.at(-1)?.timestamp === next.at(-1)?.timestamp;
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
  /** Stable bounds of the replay window. Used to retain the user's viewport
   * while chunks for the same window finish decoding. */
  dataWindowKey?: string | null;
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
  dataWindowKey,
}: ReplayPriceChartProps) {
  // lightweight-charts' internal color parser only understands hex/rgb(a)/hsl(a)
  // and named colors — it can't resolve CSS custom properties or oklch(), so the
  // theme's own var(--muted-foreground) can't be handed to it directly. Mirror
  // the same hardcoded light/dark pair already used for the canvas background
  // in _components/index.tsx rather than introducing a CSS-var resolver.
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const textColor = isDark ? "#9CA3AF" : "#6B7280";
  // The dark canvas needs a higher-contrast neutral than the light canvas;
  // 4% white was imperceptible against the replay chart's near-black panel.
  const gridColor = isDark ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.06)";
  const crosshairColor = isDark ? "#758696" : "#9598A1";

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const overlaySeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  const candleIndexByTimeRef = useRef<Map<Time, number>>(new Map());
  const renderedCandlesRef = useRef<ReplayCandle[]>([]);
  const renderedDataWindowRef = useRef<string | null>(null);
  const overlayCandlesRef = useRef<ReplayCandle[]>([]);
  const fittedDataWindowRef = useRef<string | null>(null);
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

  // Sync all canvas-owned theme values when the theme changes. The chart is
  // created once, so only updating layout text here would leave dark-mode
  // grid/crosshair options stuck on their initial (often light) values.
  useEffect(() => {
    chartRef.current?.applyOptions({
      layout: { textColor },
      grid: { horzLines: { color: gridColor } },
      crosshair: {
        vertLine: { color: crosshairColor, labelBackgroundColor: crosshairColor },
        horzLine: { color: crosshairColor, labelBackgroundColor: crosshairColor },
      },
    });
  }, [textColor, gridColor, crosshairColor]);

  // Candles + volume + candle_index/time lookup.
  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!chart || !candleSeries || !volumeSeries) return;

    const canUpdateMutableTail =
      renderedDataWindowRef.current === dataWindowKey &&
      hasOnlyMutableTailChanged(renderedCandlesRef.current, candles);
    const mutableTail = candles.at(-1);
    if (
      canUpdateMutableTail &&
      mutableTail &&
      Number.isFinite(mutableTail.open) &&
      Number.isFinite(mutableTail.high) &&
      Number.isFinite(mutableTail.low) &&
      Number.isFinite(mutableTail.close)
    ) {
      const time = timeOf(mutableTail);
      try {
        candleSeries.update({
          time,
          open: mutableTail.open as number,
          high: mutableTail.high as number,
          low: mutableTail.low as number,
          close: mutableTail.close as number,
        });
        if (Number.isFinite(mutableTail.volume)) {
          volumeSeries.update({
            time,
            value: mutableTail.volume as number,
            color:
              (mutableTail.close as number) >= (mutableTail.open as number)
                ? "rgba(38,166,154,0.4)"
                : "rgba(239,83,80,0.4)",
          });
        }
        candleIndexByTimeRef.current.set(time, mutableTail.candle_index);
        renderedCandlesRef.current = candles;
        return;
      } catch (err) {
        console.error("ReplayPriceChart: mutable candle update failed; rebuilding series", { error: err });
        // Force the rebuild path below to run from a clean slate rather than
        // comparing against the pre-failure state on this same render.
        renderedCandlesRef.current = [];
        renderedDataWindowRef.current = null;
      }
    }

    // lightweight-charts' setData() hard-requires a strictly ascending,
    // unique-by-time array — any violation throws a generic (unhelpful)
    // "Value is null" from deep inside its own scale code. `candles` is
    // built by merging independently-decoded chunk tables (see
    // selectCandlesInRange) and sorted by candle_index, which should imply
    // ascending time — but a duplicate/out-of-order/non-finite value
    // anywhere in a merged range would otherwise crash the whole chart with
    // no diagnostic. Sort by the actual time value, dedupe, and drop
    // non-finite OHLC defensively rather than trust that invariant blindly.
    const valid = candles.filter(
      (c) =>
        c.timestamp != null &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close)
    );

    const byTimeRaw = new Map<Time, ReplayCandle>();
    for (const c of valid) {
      byTimeRaw.set(timeOf(c), c); // later duplicates win — most recently decoded chunk wins
    }
    const sortedTimes = Array.from(byTimeRaw.keys()).sort((a, b) => (a as number) - (b as number));

    const byTime = new Map<Time, number>();
    const candleData = sortedTimes.map((t) => {
      const c = byTimeRaw.get(t)!;
      byTime.set(t, c.candle_index);
      return { time: t, open: c.open as number, high: c.high as number, low: c.low as number, close: c.close as number };
    });
    candleIndexByTimeRef.current = byTime;

    try {
      candleSeries.setData(candleData);
      // `setData()` should not reset the user's viewport when another chunk
      // fills the same replay window. Fit only on the first populated render
      // and when the dead-zone window recentres to new bounds.
      const currentWindowKey =
        dataWindowKey ?? `${candleData[0]?.time ?? "empty"}:${candleData[candleData.length - 1]?.time ?? "empty"}`;
      if (candleData.length > 0 && fittedDataWindowRef.current !== currentWindowKey) {
        chart.timeScale().fitContent();
        fittedDataWindowRef.current = currentWindowKey;
      }
    } catch (err) {
      console.error("ReplayPriceChart: candleSeries.setData() rejected the merged candle set", {
        error: err,
        count: candleData.length,
        firstTime: candleData[0]?.time,
        lastTime: candleData[candleData.length - 1]?.time,
      });
      // Without this, renderedCandlesRef/renderedDataWindowRef stay pinned
      // to the pre-failure state forever -- every subsequent render re-hits
      // the same rejected merge and the chart never updates again short of
      // a full remount. Reset so the next render retries from scratch.
      renderedCandlesRef.current = [];
      renderedDataWindowRef.current = null;
      return;
    }

    const volumeData = sortedTimes
      .map((t) => byTimeRaw.get(t)!)
      .filter((c) => Number.isFinite(c.volume))
      .map((c) => ({
        time: timeOf(c),
        value: c.volume as number,
        color: (c.close as number) >= (c.open as number) ? "rgba(38,166,154,0.4)" : "rgba(239,83,80,0.4)",
      }));
    try {
      volumeSeries.setData(volumeData);
    } catch (err) {
      console.error("ReplayPriceChart: volumeSeries.setData() rejected the merged volume set", { error: err });
    }
    renderedCandlesRef.current = candles;
    renderedDataWindowRef.current = dataWindowKey ?? null;
  }, [candles, dataWindowKey]);

  // Price-scale indicator overlays — one line series per indicator key present
  // in the window (excluding anything the user toggled off), grouped across
  // all candles and sorted by time. Keys with a length override in
  // overriddenValuesByKey replace the backend-provided series entirely.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Indicator snapshots are finalized-bar data. A mutable display candle
    // cannot change them, so skip rebuilding every overlay on each live tick.
    if (
      Object.keys(periodOverrides).length === 0 &&
      hasOnlyMutableTailChanged(overlayCandlesRef.current, candles)
    ) {
      overlayCandlesRef.current = candles;
      return;
    }

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
    for (const [key, rawPoints] of seriesByKey) {
      // Same dedupe-by-time + finite-value guard as the candle series above
      // — these points are merged across independently-decoded chunks too.
      const byTime = new Map<Time, number>();
      for (const p of rawPoints) {
        if (Number.isFinite(p.value)) byTime.set(p.time, p.value);
      }
      const points = Array.from(byTime.entries())
        .sort((a, b) => (a[0] as number) - (b[0] as number))
        .map(([time, value]) => ({ time, value }));

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
      try {
        series.setData(points);
      } catch (err) {
        console.error(`ReplayPriceChart: overlay series "${key}" setData() rejected the merged point set`, { error: err });
      }
    }
    overlayCandlesRef.current = candles;
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
    // Guard against pinning a time the series doesn't actually have data
    // for — e.g. a bar missing open/high/low (so it was excluded from the
    // `valid` set setData() was last called with, see the candles+volume
    // effect above), or a chunk boundary where `candles` briefly includes an
    // index whose chunk hasn't finished decoding into the series yet.
    // lightweight-charts throws a generic "Value is null" internally when
    // asked to position the crosshair at a time with no matching data point.
    const barTime = bar?.close != null ? timeOf(bar) : null;
    if (barTime != null && candleIndexByTimeRef.current.has(barTime)) {
      // Even with the guard above, lightweight-charts can still throw a
      // generic "Value is null" internally if its own time/price-scale
      // state hasn't caught up yet (e.g. mid-resize or mid-update during
      // fast replay scrubbing) — a known library race, not something our
      // React-side bookkeeping can observe. Swallow it and just clear the
      // crosshair rather than crashing the whole chart.
      try {
        chart.setCrosshairPosition(bar!.close as number, barTime, candleSeries);
      } catch {
        chart.clearCrosshairPosition();
      }
    } else {
      chart.clearCrosshairPosition();
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
