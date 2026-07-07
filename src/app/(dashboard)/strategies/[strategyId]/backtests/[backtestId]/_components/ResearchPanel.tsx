"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import { useRunDataset } from "@/api-actions/hooks/strategy-hooks";
import { MonthlyHeatmap } from "./MonthlyHeatmap";
import { cn } from "@/lib/utils";
import type { AnalyticsReport } from "@/types/backtest";

interface ResearchPanelProps {
  report: AnalyticsReport | null;
  backtestId: string;
  selectedSymbol: string;
}

export function ResearchPanel({
  report,
  backtestId,
  selectedSymbol,
}: ResearchPanelProps) {
  const [activeWindow, setActiveWindow] = useState<string>("30D");
  const [selectedPair, setSelectedPair] = useState<string>("");
  const [rollingSharpeWindow, setRollingSharpeWindow] = useState<string>("30D");
  const [rollingMetric, setRollingMetric] = useState<string>("sharpe");

  if (!report) return null;

  // Load rolling correlations flat dataset
  const datasets = report.datasets;
  const rollingCorrGroup = datasets.rolling_correlations || {};
  const activeCorrDatasetId = rollingCorrGroup[activeWindow]?.dataset_id || null;

  const { data: rawRollingCorr } = useRunDataset(backtestId, activeCorrDatasetId);

  // Load rolling performance statistics (Sharpe, Volatility, etc.)
  const rollingPerformanceGroup = (datasets as any)[`rolling_${rollingMetric}`] || {};
  const activePerfDatasetId = rollingPerformanceGroup[rollingSharpeWindow]?.dataset_id || null;

  const { data: rawPerfData } = useRunDataset(backtestId, activePerfDatasetId);

  // Resolve symbols list from correlation matrix keys
  const corrMatrix = report.correlations?.matrix || {};
  const symbols = Object.keys(corrMatrix);

  // Initialize selected pair to first pair on load
  useEffect(() => {
    if (symbols.length >= 2 && !selectedPair) {
      const p = `${symbols[0]}_${symbols[1]}`;
      setSelectedPair(p);
    }
  }, [symbols, selectedPair]);

  if (!report) return null;

  const metrics = report.metrics || {};
  const diversification = metrics.diversification || {};
  const concentration = metrics.concentration || {};
  const risk = metrics.risk || {};
  const attribution = metrics.attribution || {};
  const drawdownAttr = metrics.drawdown_attribution || {};

  // Form rolling correlation series
  const formattedRollingCorr = (rawRollingCorr || []).map((row: any) => {
    const timestamp = Array.isArray(row) ? row[0] : row.timestamp;
    const item: Record<string, any> = {
      timestamp,
      date: new Date(timestamp).toLocaleDateString(),
    };
    if (Array.isArray(row)) {
      // In case backend sends array of tuples
      item.value = row[1];
      if (selectedPair) {
        item[selectedPair] = row[1];
      }
    } else {
      // Backend returns key-value rows
      Object.keys(row).forEach((k) => {
        if (k !== "timestamp") item[k] = row[k];
      });
      // Handle case where rolling correlation dataset has 'value' column
      if (selectedPair && row.value !== undefined) {
        item[selectedPair] = row.value;
      }
    }
    return item;
  });

  // Form rolling performance series
  const formattedPerfData = (rawPerfData || []).map((row: any) => {
    const timestamp = Array.isArray(row) ? row[0] : row.timestamp;
    const value = Array.isArray(row) ? row[1] : row.value;
    return {
      timestamp,
      date: new Date(timestamp).toLocaleDateString(),
      value,
    };
  });

  const symbolEquityCurveId = datasets.symbol_equity_curves?.[selectedSymbol]?.dataset_id || null;
  const { data: symbolEquityCurve } = useRunDataset(backtestId, selectedSymbol !== "global" ? symbolEquityCurveId : null);

  const computedSymbolPerfData = useMemo(() => {
    if (selectedSymbol === "global" || !symbolEquityCurve || symbolEquityCurve.length === 0) {
      return null;
    }
    const dailyEquity: { timestamp: number; value: number }[] = [];
    symbolEquityCurve.forEach((item: any) => {
      const ts = Array.isArray(item) ? item[0] : item.timestamp;
      const val = Array.isArray(item) ? item[1] : item.value;
      dailyEquity.push({ timestamp: ts, value: val });
    });
    dailyEquity.sort((a, b) => a.timestamp - b.timestamp);
    if (dailyEquity.length < 2) return [];

    const dailyReturns: { timestamp: number; ret: number; equity: number }[] = [];
    for (let i = 1; i < dailyEquity.length; i++) {
      const prev = dailyEquity[i - 1].value;
      const curr = dailyEquity[i].value;
      const ret = prev > 0 ? (curr - prev) / prev : 0;
      dailyReturns.push({ timestamp: dailyEquity[i].timestamp, ret, equity: curr });
    }

    const windowSize = parseInt(rollingSharpeWindow) || 30;
    const result: { timestamp: number; date: string; value: number }[] = [];

    for (let i = 0; i < dailyReturns.length; i++) {
      const startIdx = Math.max(0, i - windowSize + 1);
      const windowReturns = dailyReturns.slice(startIdx, i + 1).map(r => r.ret);
      const windowEquities = dailyReturns.slice(startIdx, i + 1).map(r => r.equity);
      const ts = dailyReturns[i].timestamp;
      const dtStr = new Date(ts).toLocaleDateString();

      if (windowReturns.length === 0) continue;

      if (rollingMetric === "volatility") {
        const mean = windowReturns.reduce((a, b) => a + b, 0) / windowReturns.length;
        const variance = windowReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / windowReturns.length;
        const vol = Math.sqrt(variance) * Math.sqrt(365) * 100;
        result.push({ timestamp: ts, date: dtStr, value: isNaN(vol) ? 0 : vol });
      } else if (rollingMetric === "sharpe") {
        const mean = windowReturns.reduce((a, b) => a + b, 0) / windowReturns.length;
        const meanRet = mean * 365;
        const variance = windowReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / windowReturns.length;
        const vol = Math.sqrt(variance) * Math.sqrt(365);
        const sharpe = vol > 0 ? meanRet / vol : 0;
        result.push({ timestamp: ts, date: dtStr, value: isNaN(sharpe) ? 0 : sharpe });
      } else if (rollingMetric === "sortino") {
        const mean = windowReturns.reduce((a, b) => a + b, 0) / windowReturns.length;
        const meanRet = mean * 365;
        const negReturnsSq = windowReturns.map(r => Math.pow(Math.min(r, 0), 2));
        const downVariance = negReturnsSq.reduce((a, b) => a + b, 0) / negReturnsSq.length;
        const downVol = Math.sqrt(downVariance) * Math.sqrt(365);
        const sortino = downVol > 0 ? meanRet / downVol : 0;
        result.push({ timestamp: ts, date: dtStr, value: isNaN(sortino) ? 0 : sortino });
      } else if (rollingMetric === "drawdown") {
        const currEquity = dailyReturns[i].equity;
        const maxEquity = Math.max(...windowEquities);
        const dd = maxEquity > 0 ? ((currEquity - maxEquity) / maxEquity) * 100 : 0;
        result.push({ timestamp: ts, date: dtStr, value: isNaN(dd) ? 0 : dd });
      }
    }
    return result;
  }, [selectedSymbol, symbolEquityCurve, rollingSharpeWindow, rollingMetric]);

  const activePerfData = computedSymbolPerfData !== null ? computedSymbolPerfData : formattedPerfData;

  // Calculate colors for correlation cells
  const getCellColor = (val: number) => {
    if (val === 1) return "bg-primary/20 text-foreground font-bold border-primary/30";
    const absVal = Math.abs(val);
    if (val > 0) {
      return cn(
        "border border-success/10 text-success font-semibold transition-all duration-200 hover:scale-[1.03]",
        absVal > 0.7 ? "bg-success/20" : absVal > 0.4 ? "bg-success/15" : "bg-success/5"
      );
    } else {
      return cn(
        "border border-destructive/10 text-destructive font-semibold transition-all duration-200 hover:scale-[1.03]",
        absVal > 0.7 ? "bg-destructive/20" : absVal > 0.4 ? "bg-destructive/15" : "bg-destructive/5"
      );
    }
  };

  // Format HHI index level message
  const getHhiLevel = (hhi: number | null) => {
    if (hhi === null) return { label: "N/A", color: "text-muted-foreground" };
    if (hhi < 1500) return { label: "Highly Diversified", color: "text-success bg-success/10 border-success/20" };
    if (hhi < 2500) return { label: "Moderately Concentrated", color: "text-warning bg-warning/10 border-warning/20" };
    return { label: "Highly Concentrated", color: "text-destructive bg-destructive/10 border-destructive/20" };
  };

  const hhiStatus = getHhiLevel(concentration.hhi_index);

  return (
    <Accordion type="single" collapsible defaultValue="correlation" className="w-full flex flex-col gap-3">
      
      {/* ── Accordion 1: Correlation & Diversification ── */}
      <AccordionItem value="correlation" className="border border-border/50 rounded-xl bg-card overflow-hidden">
        <AccordionTrigger className="px-5 py-4 hover:no-underline font-bold text-[13px] text-foreground/80 tracking-wide">
          📊 CORRELATION & DIVERSIFICATION SUITE
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5 pt-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Correlation Heatmap Grid */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[12px] font-semibold text-muted-foreground">Interactive Correlation Matrix</h4>
              {symbols.length > 0 ? (
                <div className="border border-border/40 rounded-xl overflow-hidden bg-muted/10 p-4">
                  <div className="grid overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 text-left text-[10px] font-semibold text-muted-foreground uppercase w-[90px]" />
                          {symbols.map((sym) => (
                            <th key={sym} className="p-2 text-center text-[10px] font-semibold text-muted-foreground uppercase min-w-[70px] truncate max-w-[90px]">
                              {sym}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {symbols.map((symA) => (
                          <tr key={symA} className="border-t border-border/30">
                            <td className="p-2 text-left text-[11px] font-semibold text-foreground truncate max-w-[90px]">
                              {symA}
                            </td>
                            {symbols.map((symB) => {
                              const val = corrMatrix[symA]?.[symB] ?? 0;
                              const isSelf = symA === symB;
                              return (
                                <td
                                  key={symB}
                                  onClick={() => {
                                    if (!isSelf) {
                                      const p1 = `${symA}_${symB}`;
                                      const p2 = `${symB}_${symA}`;
                                      setSelectedPair(p1);
                                    }
                                  }}
                                  className={cn(
                                    "p-2 text-center text-[12px] font-mono rounded-md cursor-pointer",
                                    getCellColor(val),
                                    isSelf && "cursor-not-allowed"
                                  )}
                                >
                                  {val.toFixed(2)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3 text-center italic">
                    💡 Click on any cell pair to plot its rolling correlation window history below.
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground text-xs border border-dashed rounded-xl">
                  No correlation matrix available.
                </div>
              )}
            </div>

            {/* Rolling Correlations Line Chart */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[12px] font-semibold text-muted-foreground">
                  Rolling Correlation ({selectedPair || "Pair"})
                </h4>
                <div className="flex gap-1 bg-muted p-0.5 rounded-lg border border-border/40">
                  {Object.keys(rollingCorrGroup).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setActiveWindow(tf)}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all duration-200",
                        activeWindow === tf ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[230px] w-full border border-border/40 rounded-xl p-4 bg-muted/10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedRollingCorr}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={9} />
                    <YAxis stroke="#71717a" fontSize={9} domain={[-1, 1]} />
                    <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }} />
                    <Line
                      type="monotone"
                      dataKey={selectedPair}
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={false}
                      name="Correlation Coefficient"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Diversification metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <Card className="p-3 border-border/40 bg-muted/10 font-mono text-center">
              <span className="text-[10px] text-muted-foreground uppercase">Avg Correlation</span>
              <h5 className="text-base font-bold text-foreground mt-1">
                {diversification.average_correlation?.toFixed(2) ?? "0.00"}
              </h5>
            </Card>
            <Card className="p-3 border-border/40 bg-muted/10 font-mono text-center">
              <span className="text-[10px] text-muted-foreground uppercase">Diversification Ratio</span>
              <h5 className="text-base font-bold text-success mt-1">
                {diversification.diversification_ratio?.toFixed(2) ?? "1.00"}
              </h5>
            </Card>
            <Card className="p-3 border-border/40 bg-muted/10 font-mono text-center col-span-2">
              <span className="text-[10px] text-muted-foreground uppercase">Correlation Status</span>
              <h5 className="text-[12px] font-semibold text-foreground/80 mt-2">
                {diversification.average_correlation && diversification.average_correlation < 0.3
                  ? "✔ Low Correlation: Strong portfolio hedges active."
                  : "⚠ Co-movement flagged: Higher systematic exposure risks."}
              </h5>
            </Card>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Accordion 2: Concentration & Attribution ── */}
      <AccordionItem value="concentration" className="border border-border/50 rounded-xl bg-card overflow-hidden">
        <AccordionTrigger className="px-5 py-4 hover:no-underline font-bold text-[13px] text-foreground/80 tracking-wide">
          📐 ASSET CONCENTRATION & ATTRIBUTION
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5 pt-2 flex flex-col gap-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Concentration Index Card */}
            <Card className="p-5 border-border/40 bg-muted/15 flex flex-col gap-3 font-mono justify-between">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">HHI Concentration Index</span>
                <h4 className="text-2xl font-bold text-foreground">
                  {concentration.hhi_index?.toFixed(0) ?? "N/A"}
                </h4>
                <div className={cn("text-[10px] font-bold border px-2 py-0.5 rounded-full w-fit uppercase mt-1.5", hhiStatus.color)}>
                  {hhiStatus.label}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 border-t border-border/30 pt-3 text-[11px] text-muted-foreground">
                <div className="flex justify-between">
                  <span>Max Weight:</span>
                  <span className="text-foreground">
                    {concentration.maximum_symbol_weight ? `${(concentration.maximum_symbol_weight * 100).toFixed(1)}%` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Weight:</span>
                  <span className="text-foreground">
                    {concentration.average_symbol_weight ? `${(concentration.average_symbol_weight * 100).toFixed(1)}%` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Effective Assets:</span>
                  <span className="text-foreground">
                    {concentration.effective_number_of_assets?.toFixed(1) ?? "N/A"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Attribution Matrix return contributions */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <h4 className="text-[12px] font-semibold text-muted-foreground">Returns & Drawdown Attribution Window</h4>
              <div className="border border-border/40 rounded-xl overflow-hidden bg-muted/10">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="text-left text-[9px] font-bold text-muted-foreground uppercase tracking-wider py-2 px-4">Asset</th>
                      <th className="text-right text-[9px] font-bold text-muted-foreground uppercase tracking-wider py-2 pr-4">Return Contribution</th>
                      <th className="text-right text-[9px] font-bold text-muted-foreground uppercase tracking-wider py-2 pr-4">Drawdown Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(report.metrics?.symbols || {}).map((sym) => {
                      // Lookup returns contribution
                      const contr = attribution.contribution_by_symbol?.[sym]?.["net_profit"] ?? 0;
                      // Lookup drawdown share
                      const ddShare = drawdownAttr.contribution_by_symbol?.[sym] ?? 0;
                      return (
                        <tr key={sym} className="border-t border-border/30 hover:bg-muted/10 font-mono text-[12px]">
                          <td className="py-2.5 px-4 font-semibold text-foreground">{sym}</td>
                          <td className={cn("text-right py-2.5 pr-4 font-semibold", contr >= 0 ? "text-success" : "text-destructive")}>
                            {contr >= 0 ? "+" : ""}{(contr * 100).toFixed(2)}%
                          </td>
                          <td className="text-right py-2.5 pr-4 text-destructive font-semibold">
                            {(ddShare * 100).toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Accordion 3: Advanced Risk Profile ── */}
      <AccordionItem value="risk" className="border border-border/50 rounded-xl bg-card overflow-hidden">
        <AccordionTrigger className="px-5 py-4 hover:no-underline font-bold text-[13px] text-foreground/80 tracking-wide">
          🛡️ INSTITUTIONAL RISK METRICS
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5 pt-2 flex flex-col gap-4 font-mono">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* VaR & CVaR */}
            <Card className="p-4 border-border/40 bg-muted/10 flex flex-col justify-between">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">VaR 95% (Historical)</span>
              <h4 className="text-xl font-bold text-foreground mt-1">{(risk.historical_var_95 * 100).toFixed(2)}%</h4>
              <p className="text-[9px] text-muted-foreground/80 mt-1">95% probability daily loss limit.</p>
            </Card>
            <Card className="p-4 border-border/40 bg-muted/10 flex flex-col justify-between">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">VaR 99% (Historical)</span>
              <h4 className="text-xl font-bold text-destructive mt-1">{(risk.historical_var_99 * 100).toFixed(2)}%</h4>
              <p className="text-[9px] text-muted-foreground/80 mt-1">Extreme tail daily loss threshold.</p>
            </Card>
            <Card className="p-4 border-border/40 bg-muted/10 flex flex-col justify-between">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">CVaR 95% (Expected Shortfall)</span>
              <h4 className="text-xl font-bold text-foreground mt-1">{(risk.cvar_95 * 100).toFixed(2)}%</h4>
              <p className="text-[9px] text-muted-foreground/80 mt-1">Average loss if threshold breached.</p>
            </Card>
            <Card className="p-4 border-border/40 bg-muted/10 flex flex-col justify-between">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">CVaR 99% (Expected Shortfall)</span>
              <h4 className="text-xl font-bold text-destructive mt-1">{(risk.cvar_99 * 100).toFixed(2)}%</h4>
              <p className="text-[9px] text-muted-foreground/80 mt-1">Worst case average tail losses.</p>
            </Card>
            
            {/* Ulcer Index, Tail Ratio, Omega Ratio */}
            <Card className="p-4 border-border/40 bg-muted/10 flex flex-col justify-between">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Ulcer Drawdown Index</span>
              <h4 className="text-xl font-bold text-foreground mt-1">{risk.ulcer_index?.toFixed(2) ?? "N/A"}</h4>
              <p className="text-[9px] text-muted-foreground/80 mt-1">Drawdown depth & duration penalty.</p>
            </Card>
            <Card className="p-4 border-border/40 bg-muted/10 flex flex-col justify-between">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Tail Ratio</span>
              <h4 className="text-xl font-bold text-success mt-1">{risk.tail_ratio?.toFixed(2) ?? "N/A"}</h4>
              <p className="text-[9px] text-muted-foreground/80 mt-1">95th vs 5th percentile return scale.</p>
            </Card>
            <Card className="p-4 border-border/40 bg-muted/10 flex flex-col justify-between">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Omega Ratio</span>
              <h4 className="text-xl font-bold text-success mt-1">{risk.omega_ratio?.toFixed(2) ?? "N/A"}</h4>
              <p className="text-[9px] text-muted-foreground/80 mt-1">Gains vs losses threshold ratio.</p>
            </Card>
            <Card className="p-4 border-border/40 bg-muted/10 flex flex-col justify-between">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Kelly Sizing Recommended</span>
              <h4 className="text-xl font-bold text-primary mt-1">
                {(report.fractional_kelly as Record<string, unknown> | undefined)?.kelly_recommendation as string ?? "Half Kelly"}
              </h4>
              <p className="text-[9px] text-muted-foreground/80 mt-1">Recommended equity allocation.</p>
            </Card>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Accordion 4: Capacity & Exposure ── */}
      <AccordionItem value="capacity" className="border border-border/50 rounded-xl bg-card overflow-hidden">
        <AccordionTrigger className="px-5 py-4 hover:no-underline font-bold text-[13px] text-foreground/80 tracking-wide">
          📈 CAPACITY & EXPOSURE METRICS
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5 pt-2 flex flex-col gap-4 font-mono">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border-border/40 bg-muted/10">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Avg Gross Exposure</span>
              <h4 className="text-base font-bold text-foreground mt-1">
                ${(metrics.capacity?.average_gross_exposure ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h4>
            </Card>
            <Card className="p-4 border-border/40 bg-muted/10">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Max Gross Exposure</span>
              <h4 className="text-base font-bold text-destructive mt-1">
                ${(metrics.capacity?.maximum_gross_exposure ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h4>
            </Card>
            <Card className="p-4 border-border/40 bg-muted/10">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Avg Margin Usage</span>
              <h4 className="text-base font-bold text-foreground mt-1">
                {((metrics.capacity?.average_margin_usage ?? 0) * 100).toFixed(2)}%
              </h4>
            </Card>
            <Card className="p-4 border-border/40 bg-muted/10">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Max Margin Usage</span>
              <h4 className="text-base font-bold text-destructive mt-1">
                {((metrics.capacity?.maximum_margin_usage ?? 0) * 100).toFixed(2)}%
              </h4>
            </Card>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Accordion 5: Monthly Return Heatmap & Rolling stats ── */}
      <AccordionItem value="heatmap" className="border border-border/50 rounded-xl bg-card overflow-hidden">
        <AccordionTrigger className="px-5 py-4 hover:no-underline font-bold text-[13px] text-foreground/80 tracking-wide">
          📅 MONTHLY RETURNS & ROLLING STATISTICS
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5 pt-2 flex flex-col gap-6">
          <MonthlyHeatmap heatmapData={datasets.monthly_heatmap ?? {}} />

          {/* Rolling stats charts */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                Rolling {rollingMetric} ({rollingSharpeWindow})
              </h4>
              <div className="flex gap-4 items-center">
                <div className="flex gap-1 bg-muted p-0.5 rounded-lg border border-border/40 select-none">
                  {["sharpe", "sortino", "volatility", "drawdown"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setRollingMetric(m)}
                      className={cn(
                        "px-2.5 py-0.5 rounded-md text-[10px] font-semibold transition-all duration-200 capitalize",
                        rollingMetric === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 bg-muted p-0.5 rounded-lg border border-border/40 select-none">
                  {["30D", "90D"].map((w) => (
                    <button
                      key={w}
                      onClick={() => setRollingSharpeWindow(w)}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all duration-200",
                        rollingSharpeWindow === w ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="h-[230px] w-full border border-border/40 rounded-xl p-4 bg-muted/10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activePerfData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={9} />
                  <YAxis stroke="#71717a" fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    name={rollingMetric.toUpperCase()}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

    </Accordion>
  );
}
