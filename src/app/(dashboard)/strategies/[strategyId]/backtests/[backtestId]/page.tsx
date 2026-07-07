"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useStrategyBacktest, useRunDataset, useRunArtifact } from "@/api-actions/hooks/strategy-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { IconStar } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

import type { AnalyticsReport, BacktestSummary, RunDetail } from "@/types/strategy-actions";

import {
  MetricsGrid,
  EquityCurveChart,
  DrawdownChart,
  RollingMetricsChart,
  TradesSection,
} from "./_components";
import {
  ReportMasthead,
  WarningsBanner,
  SymbolBreakdownCards,
  OrderLifecyclePanel,
  RiskStatsPanel,
  TradeDistributionTable,
  MonthlyReturnsStrip,
  ConcentrationPanel,
  CorrelationHeatmap,
  SizingCards,
  ReportFooter,
} from "./_components/report/report-sections";
import { ReportSectionLabel, CoinLogo } from "./_components/report/report-primitives";


export default function BacktestDetailPage() {
  const params = useParams();
  const strategyId = params?.strategyId as string;
  const backtestId = params?.backtestId as string;

  const [isFavorite, setIsFavorite] = useState(false);

  const { data: backtest, isLoading: backtestLoading } = useStrategyBacktest(
    strategyId,
    backtestId
  );

  const { data: runReport, isLoading: reportLoading } = useRunArtifact(backtestId, "report");
  const { data: dbTrades = [] } = useRunDataset(backtestId, "trades");
  const { data: dbOrders = [] } = useRunDataset(backtestId, "orders");

  const [selectedSymbol, setSelectedSymbol] = useState<string>("global");

  const runJson = (runReport?.report || {}) as unknown as AnalyticsReport;
  const datasets = runJson.datasets ?? {};

  const activeEquityCurveDatasetId = (selectedSymbol === "global"
    ? datasets.global_equity_curve?.dataset_id
    : datasets.symbol_equity_curves?.[selectedSymbol]?.dataset_id) ?? null;

  const activeDrawdownDatasetId = (selectedSymbol === "global"
    ? datasets.global_drawdown_curve?.dataset_id
    : null) ?? null;

  const activeExposureDatasetId = (selectedSymbol !== "global"
    ? datasets.symbol_exposure_curves?.[selectedSymbol]?.dataset_id
    : null) ?? null;

  const { data: fullEquityCurve } = useRunDataset(backtestId, activeEquityCurveDatasetId);
  const { data: fullDrawdownCurve } = useRunDataset(backtestId, activeDrawdownDatasetId);
  const { data: fullExposureCurve } = useRunDataset(backtestId, activeExposureDatasetId);

  // Rolling analytics (sharpe/sortino/drawdown/volatility/correlation × 30/60/90D windows)
  const [rollingMetric, setRollingMetric] = useState("sharpe");
  const [rollingWindow, setRollingWindow] = useState("30D");
  const rollingSymbolKeys = Object.keys(runJson.metrics?.symbols ?? {});
  const correlationPairKey =
    rollingSymbolKeys.length >= 2 ? `${rollingSymbolKeys[0]}-${rollingSymbolKeys[1]}` : null;

  const rollingDatasetId =
    rollingMetric === "correlation"
      ? (runJson.correlations?.rolling?.[rollingWindow]?.[correlationPairKey ?? ""]?.dataset_id ?? null)
      : (((datasets as unknown as Record<string, unknown>)[`rolling_${rollingMetric}`] ?? {}) as Record<string, { dataset_id?: string } | null>)[rollingWindow]?.dataset_id ?? null;

  const { data: rawRolling, isLoading: rollingLoading } = useRunDataset(backtestId, rollingDatasetId);

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
  const metrics = runJson.metrics || {};
  const globalMetrics = metrics.global ?? {};
  const distMetrics = metrics.distributions?.global ?? {};
  const symbols = metrics.symbols ?? {};
  const symbolKeys = Object.keys(symbols);

  const resolvedEquityCurve = Array.isArray(fullEquityCurve) ? fullEquityCurve : [];

  const equityData = resolvedEquityCurve.map((item: any) => {
    const time = Array.isArray(item) ? item[0] : item.timestamp;
    const value = Array.isArray(item) ? item[1] : item.value;
    return {
      time,
      formattedTime: new Date(time).toLocaleDateString(),
      balance: value,
    };
  });

  // Extract actual arrays from root report payload or fallback to dataset queries
  const trades = (runReport as any)?.trades || dbTrades || [];
  const orders = (runReport as any)?.orders || dbOrders || [];

  const drawdownData = (() => {
    if (selectedSymbol === "global") {
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
    } else {
      // Calculate individual symbol drawdown dynamically on-the-fly from its equity contribution curve
      if (fullEquityCurve && fullEquityCurve.length > 0) {
        let runningMax = -Infinity;
        return fullEquityCurve.map((item: any) => {
          const time = Array.isArray(item) ? item[0] : item.timestamp;
          const value = Array.isArray(item) ? item[1] : item.value;
          if (value > runningMax) {
            runningMax = value;
          }
          const dd = runningMax > 0 ? ((value - runningMax) / runningMax) * 100 : 0;
          return {
            time,
            formattedTime: new Date(time).toLocaleDateString(),
            value: dd,
          };
        });
      }
      return [];
    }
  })();

  const exposureData = (() => {
    if (fullExposureCurve && fullExposureCurve.length > 0) {
      return fullExposureCurve.map((item: any) => {
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

  // Resolve metrics depending on selected symbol
  const summary = (backtest as RunDetail | undefined)?.summary ?? ({} as BacktestSummary);
  const activeMetrics = selectedSymbol === "global"
    ? {
        net_profit: globalMetrics.net_profit ?? summary.net_profit ?? 0,
        total_return_pct: globalMetrics.total_return_pct ?? summary.total_return_pct ?? 0,
        sharpe_ratio: globalMetrics.sharpe_ratio ?? summary.sharpe_ratio ?? 0,
        max_drawdown_pct: globalMetrics.max_drawdown_pct ?? summary.max_drawdown_pct ?? 0,
        win_rate: globalMetrics.win_rate ?? summary.win_rate,
        profit_factor: globalMetrics.profit_factor,
      }
    : {
        net_profit: symbols[selectedSymbol]?.net_profit ?? 0,
        total_return_pct: symbols[selectedSymbol]?.net_profit !== undefined && summary.initial_capital
          ? (symbols[selectedSymbol].net_profit! / summary.initial_capital) * 100
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

  const rollingData = (Array.isArray(rawRolling) ? rawRolling : []).map((item: any) => {
    const time = Array.isArray(item) ? item[0] : item.timestamp;
    const value = Array.isArray(item) ? item[1] : item.value;
    return { time, formattedTime: new Date(time).toLocaleDateString(), value };
  });

  const datasetCount = Object.values(runJson.datasets ?? {}).filter(Boolean).length;

  return (
    <div className="w-full min-h-screen pb-20">

      {/* ── Single-page research report ── */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5 animate-in fade-in duration-300">


        <ReportMasthead
          summary={summary}
          symbols={symbolKeys}
          completedAt={(backtest as RunDetail | undefined)?.completed_at}
        />

        <WarningsBanner report={runJson} />

        {/* Symbol scope selector — filters the KPI strip + performance charts */}
        {symbolKeys.length > 0 && (
          <div className="flex items-center justify-between">
            <ReportSectionLabel>Performance</ReportSectionLabel>
            <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border/40 select-none">
              <button
                onClick={() => setSelectedSymbol("global")}
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-bold transition-all duration-200",
                  selectedSymbol === "global"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Global
              </button>
              {symbolKeys.map((sym) => (
                <button
                  key={sym}
                  onClick={() => setSelectedSymbol(sym)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold transition-all duration-200",
                    selectedSymbol === sym
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <CoinLogo symbol={sym} size={14} />
                  {sym}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* KPI strip */}
        <MetricsGrid
          profitVal={profitVal}
          isProfit={isProfit}
          globalMetrics={activeMetrics as any}
          distMetrics={activeDistMetrics}
          metricsJson={{}}
        />

        {/* Equity + drawdown (+ exposure when a symbol scope is active) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EquityCurveChart equityData={equityData} isProfit={isProfit} />
          <DrawdownChart
            drawdownData={drawdownData}
            title={selectedSymbol === "global" ? "Drawdown" : `${selectedSymbol} Drawdown`}
            color="var(--destructive)"
            valueLabel="Drawdown"
            valueFormatter={(v) => `${Number(v).toFixed(2)}%`}
            yAxisFormatter={(v) => `${v}%`}
            emptyText="No drawdown data available"
          />
        </div>
        {selectedSymbol !== "global" && (
          <DrawdownChart
            drawdownData={exposureData}
            title={`${selectedSymbol} Exposure`}
            color="var(--chart-2)"
            valueLabel="Exposure"
            valueFormatter={(v) => `${Number(v).toFixed(4)}`}
            yAxisFormatter={(v) => `${Number(v).toFixed(2)}`}
            emptyText="No exposure data available"
          />
        )}

        {/* Per-symbol breakdown */}
        {symbolKeys.length > 0 && (
          <>
            <ReportSectionLabel>Per-Symbol Breakdown</ReportSectionLabel>
            <SymbolBreakdownCards report={runJson} trades={trades} />
          </>
        )}

        {/* Rolling analytics + order lifecycle + concentration */}
        <ReportSectionLabel>Analytics</ReportSectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RollingMetricsChart
            rollingData={rollingData}
            selectedRolling={rollingMetric}
            selectedWindow={rollingWindow}
            onRollingChange={setRollingMetric}
            onWindowChange={setRollingWindow}
            isLoading={rollingLoading}
            showCorrelation={rollingSymbolKeys.length >= 2}
          />
          <div className="flex flex-col gap-4">
            <OrderLifecyclePanel orders={orders} />
            <ConcentrationPanel report={runJson} />
          </div>
        </div>

        <CorrelationHeatmap report={runJson} />

        {/* Risk & trade statistics */}
        <ReportSectionLabel>Risk &amp; Trade Statistics</ReportSectionLabel>
        <RiskStatsPanel report={runJson} />
        <TradeDistributionTable report={runJson} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <MonthlyReturnsStrip report={runJson} />
          <SizingCards report={runJson} />
        </div>

        {/* Trades & execution */}
        <ReportSectionLabel>Trades &amp; Execution</ReportSectionLabel>
        <TradesSection trades={trades} orders={orders} />

        <ReportFooter report={runJson} datasetCount={datasetCount} />
      </main>
    </div>
  );
}
