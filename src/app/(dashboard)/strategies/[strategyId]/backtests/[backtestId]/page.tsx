"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useStrategyBacktest, useRunDataset, useRunArtifact } from "@/api-actions/hooks/strategy-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { BacktestReport } from "@/types/strategy-actions";

import {
  MetricsGrid,
  EquityCurveChart,
  RiskProfilePanel,
  MonthlyHeatmap,
  CapacityPanel,
  DrawdownChart,
  RollingMetricsChart,
  MultiAssetBreakdown,
  TradesSection,
} from "./_components";

export default function BacktestDetailPage() {
  const params = useParams();
  const strategyId = params?.strategyId as string;
  const backtestId = params?.backtestId as string;

  const { data: backtest, isLoading: backtestLoading } = useStrategyBacktest(
    strategyId,
    backtestId
  );

  const { data: runReport, isLoading: reportLoading } = useRunArtifact(backtestId, "report");
  const { data: trades = [] } = useRunDataset(backtestId, "recent_trades");

  const [selectedSymbol, setSelectedSymbol] = useState<string>("global");

  const runJson = (runReport?.report || {}) as BacktestReport;
  const metrics = runJson.metrics || {};
  const globalMetrics = metrics.global ?? {};
  const riskMetrics = metrics.risk ?? {};
  const distMetrics = metrics.distributions?.global ?? {};
  const capMetrics = metrics.capacity ?? {};
  const symbols = metrics.symbols ?? {};

  const symbolKeys = Object.keys(symbols);

  const datasets = runJson.datasets ?? {};
  
  const activeEquityCurveDatasetId = (selectedSymbol === "global"
    ? datasets.global_equity_curve?.dataset_id
    : datasets.symbol_equity_curves?.[selectedSymbol]?.dataset_id) ?? null;

  const { data: fullEquityCurve } = useRunDataset(backtestId, activeEquityCurveDatasetId);

  const activeDrawdownDatasetId = (selectedSymbol === "global"
    ? datasets.global_drawdown_curve?.dataset_id
    : datasets.symbol_exposure_curves?.[selectedSymbol]?.dataset_id) ?? null;

  const { data: fullDrawdownCurve } = useRunDataset(backtestId, activeDrawdownDatasetId);

  const [selectedRolling, setSelectedRolling] = useState<string>("sharpe");
  const [selectedWindow, setSelectedWindow] = useState<string>("30D");

  const rollingGroup = datasets[`rolling_${selectedRolling}`];
  const rollingDatasetId = rollingGroup?.[selectedWindow]?.dataset_id ?? null;
  const { data: rollingCurveData } = useRunDataset(backtestId, rollingDatasetId);

  const isPageLoading = backtestLoading || reportLoading;

  /* ── Loading State ── */
  if (isPageLoading) {
    return (
      <div className="flex flex-col gap-4 p-6 max-w-[1400px] mx-auto w-full animate-in fade-in duration-300">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-xl bg-zinc-800/40" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-xl bg-zinc-800/40" />
          <Skeleton className="h-[400px] rounded-xl bg-zinc-800/40" />
        </div>
        <Skeleton className="h-[240px] rounded-xl bg-zinc-800/40" />
      </div>
    );
  }

  /* ── Not Found ── */
  if (!backtest) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Backtest not found or failed to load.
      </div>
    );
  }

  /* ── Data Transforms ── */
  const charting = backtest.charting_json || {};
  const resolvedEquityCurve = Array.isArray(fullEquityCurve)
    ? fullEquityCurve
    : Array.isArray(charting.equity_curve)
    ? charting.equity_curve
    : [];

  const equityData = resolvedEquityCurve.map((item: any) => {
    const time = Array.isArray(item) ? item[0] : item.timestamp;
    const value = Array.isArray(item) ? item[1] : item.value;
    return {
      time,
      formattedTime: new Date(time).toLocaleDateString(),
      balance: value,
    };
  });

  const drawdownData = (() => {
    if (fullDrawdownCurve && fullDrawdownCurve.length > 0) {
      return fullDrawdownCurve.map((item: any) => {
        const time = Array.isArray(item) ? item[0] : item.timestamp;
        const value = Array.isArray(item) ? item[1] : item.value;
        return {
          time,
          formattedTime: new Date(time).toLocaleDateString(),
          value: value,
        };
      });
    }
    return [];
  })();

  const rollingData = (rollingCurveData || []).map((item: any) => {
    const time = Array.isArray(item) ? item[0] : item.timestamp;
    const value = Array.isArray(item) ? item[1] : item.value;
    return {
      time,
      formattedTime: new Date(time).toLocaleDateString(),
      value: value,
    };
  });

  // Resolve metrics depending on selected symbol
  const activeMetrics = selectedSymbol === "global"
    ? {
        net_profit: globalMetrics.net_profit ?? backtest.metrics_json?.net_profit ?? 0,
        total_return_pct: globalMetrics.total_return_pct ?? backtest.metrics_json?.profit_pct ?? 0,
        sharpe_ratio: globalMetrics.sharpe_ratio ?? backtest.metrics_json?.sharpe_ratio ?? 0,
        max_drawdown_pct: globalMetrics.max_drawdown_pct ?? backtest.metrics_json?.max_drawdown ?? 0,
        win_rate: globalMetrics.win_rate !== undefined ? globalMetrics.win_rate : backtest.metrics_json?.win_rate,
        profit_factor: globalMetrics.profit_factor,
      }
    : {
        net_profit: symbols[selectedSymbol]?.net_profit ?? 0,
        total_return_pct: symbols[selectedSymbol]?.net_profit !== undefined && backtest.initial_capital
          ? (symbols[selectedSymbol].net_profit / backtest.initial_capital) * 100
          : 0,
        sharpe_ratio: symbols[selectedSymbol]?.sharpe_ratio ?? 0,
        max_drawdown_pct: symbols[selectedSymbol]?.max_drawdown_pct ?? 0,
        win_rate: undefined,
        profit_factor: undefined,
      };

  const profitVal = activeMetrics.net_profit;
  const isProfit = profitVal >= 0;

  const activeDistMetrics = selectedSymbol === "global"
    ? distMetrics
    : (metrics.distributions?.[selectedSymbol] ?? {});

  /* ── Render Dashboard ── */
  return (
    <div className="w-full min-h-screen pb-20">
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4 animate-in fade-in duration-300">
        
        {/* Symbol Scope Selector Bar */}
        {symbolKeys.length > 0 && (
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-foreground">
                Performance Scope
              </h1>
            </div>
            <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border/40">
              <button
                onClick={() => setSelectedSymbol("global")}
                className={cn(
                  "px-3 py-1 rounded-md text-[11px] font-semibold transition-all duration-200",
                  selectedSymbol === "global"
                    ? "bg-card text-foreground shadow-sm border border-border/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Global Portfolio
              </button>
              {symbolKeys.map((sym) => (
                <button
                  key={sym}
                  onClick={() => setSelectedSymbol(sym)}
                  className={cn(
                    "px-3 py-1 rounded-md text-[11px] font-semibold transition-all duration-200",
                    selectedSymbol === sym
                      ? "bg-card text-foreground shadow-sm border border-border/10"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Row 1: Key Metrics */}
        <MetricsGrid
          profitVal={profitVal}
          isProfit={isProfit}
          globalMetrics={activeMetrics}
          distMetrics={activeDistMetrics}
          metricsJson={backtest.metrics_json}
        />

        {/* Row 2: Equity Chart + Risk Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <EquityCurveChart equityData={equityData} isProfit={isProfit} />
          </div>
          <RiskProfilePanel riskMetrics={riskMetrics} distMetrics={activeDistMetrics} />
        </div>

        {/* Row 3: Heatmap + Capacity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <MonthlyHeatmap heatmapData={datasets.monthly_heatmap || {}} />
          </div>
          <CapacityPanel
            capMetrics={capMetrics}
            globalMetrics={activeMetrics}
            distMetrics={activeDistMetrics}
            totalTrades={trades.length}
          />
        </div>

        {/* Row 4: Drawdown + Rolling Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DrawdownChart
            drawdownData={drawdownData}
            title={selectedSymbol === "global" ? "Drawdown" : "Asset Exposure"}
            color={selectedSymbol === "global" ? "#fb7185" : "#38bdf8"}
            valueLabel={selectedSymbol === "global" ? "Drawdown" : "Exposure"}
            valueFormatter={
              selectedSymbol === "global"
                ? (v) => `${Number(v).toFixed(2)}%`
                : (v) => `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
            }
            yAxisFormatter={
              selectedSymbol === "global"
                ? (v) => `${v}%`
                : (v) => `$${(v / 1000).toFixed(0)}k`
            }
            emptyText={selectedSymbol === "global" ? "No drawdown data available" : "No exposure data available"}
          />
          <RollingMetricsChart
            rollingData={rollingData}
            selectedRolling={selectedRolling}
            selectedWindow={selectedWindow}
            onRollingChange={setSelectedRolling}
            onWindowChange={setSelectedWindow}
          />
        </div>

        {/* Row 5: Multi-Asset Breakdown */}
        <MultiAssetBreakdown symbols={symbols} />

        {/* Row 6: Trade Log */}
        <TradesSection trades={trades} />

      </main>
    </div>
  );
}
