"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useStrategyBacktest, useRunDataset, useRunArtifact } from "@/api-actions/hooks/strategy-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ReportTabsList } from "@/components/shared/report-tabs";
import { IconStar, IconLayoutDashboard, IconActivity, IconShieldLock, IconReceipt2, IconDice5 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { MonteCarloTab } from "./_components/MonteCarloTab";

import type { AnalyticsReport, ApiRunReport, BacktestSummary, RunDetail } from "@/types/strategy-actions";

import {
  MetricsGrid,
  EquityCurveChart,
  DrawdownChart,
  RollingMetricsChart,
  TradesSection,
} from "./_components";
import {
  SymbolBreakdownCards,
  OrderLifecyclePanel,
  RiskStatsPanel,
  TradeDistributionTable,
  MonthlyReturnsStrip,
  ConcentrationPanel,
  CorrelationHeatmap,
  SizingCards,
} from "./_components/report/report-sections";
import { ReportSectionLabel, CoinLogo } from "./_components/report/report-primitives";


export default function BacktestDetailPage() {
  const params = useParams();
  const strategyId = params?.strategyId as string;
  const backtestId = params?.backtestId as string;

  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: backtest, isLoading: backtestLoading } = useStrategyBacktest(
    strategyId,
    backtestId
  );

  const { data: runReportRaw, isLoading: reportLoading } = useRunArtifact(backtestId, "report");
  const runReport = runReportRaw as ApiRunReport | undefined;
  const { data: dbTrades = [] } = useRunDataset(backtestId, "trades");
  const { data: dbOrders = [] } = useRunDataset(backtestId, "orders");

  const [selectedSymbol, setSelectedSymbol] = useState<string>("global");

  const runJson = (
    runReport?.report ??
    (runReport as any)?.data ??
    (runReport as any)?.content ??
    runReport ??
    (backtest as any)?.report_json ??
    (backtest as any)?.report ??
    (backtest as any)?.results ??
    {}
  ) as unknown as AnalyticsReport;

  const datasets = runJson.datasets ?? {};

  const activeEquityCurveDatasetId = (selectedSymbol === "global"
    ? (datasets.global_equity_curve?.dataset_id ?? (datasets as any).equity_curve?.dataset_id ?? "global_equity_curve")
    : (datasets.symbol_equity_curves?.[selectedSymbol]?.dataset_id ?? null));

  const activeDrawdownDatasetId = (selectedSymbol === "global"
    ? (datasets.global_drawdown_curve?.dataset_id ?? (datasets as any).drawdown_curve?.dataset_id ?? "global_drawdown_curve")
    : null);

  const activeExposureDatasetId = (selectedSymbol !== "global"
    ? (datasets.symbol_exposure_curves?.[selectedSymbol]?.dataset_id ?? null)
    : null);

  const { data: fullEquityCurve, isLoading: isEquityLoading } = useRunDataset(backtestId, activeEquityCurveDatasetId);
  const { data: fullDrawdownCurve, isLoading: isDrawdownLoading } = useRunDataset(backtestId, activeDrawdownDatasetId);
  const { data: fullExposureCurve, isLoading: isExposureLoading } = useRunDataset(backtestId, activeExposureDatasetId);

  const isPageLoading = backtestLoading || reportLoading;

  /* ── Loading State ── */
  if (isPageLoading) {
    return (
      <div className="flex flex-col gap-4 p-6 w-full animate-in fade-in duration-300">
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

  const rawEquityCurve = (
    Array.isArray(fullEquityCurve) && fullEquityCurve.length > 0
      ? fullEquityCurve
      : (runReport as any)?.report?.equity_curve ??
        (runReport as any)?.equity_curve ??
        (runReport as any)?.results?.equity_curve ??
        (runReport as any)?.data?.equity_curve ??
        (runJson as any)?.equity_curve ??
        (runJson as any)?.equity_data ??
        (backtest as any)?.equity_curve ??
        (backtest as any)?.summary?.equity_curve ??
        (backtest as any)?.report_json?.equity_curve ??
        (backtest as any)?.results?.equity_curve ??
        []
  );
  const resolvedEquityCurve = Array.isArray(rawEquityCurve) ? rawEquityCurve : [];

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

  const datasetCount = Object.values(runJson.datasets ?? {}).filter(Boolean).length;

  return (
    <div className="w-full min-h-screen pb-20">

      {/* ── Single-page research report ── */}
      <main className="w-full px-2 sm:px-4 lg:px-6 py-4 flex flex-col gap-5 animate-in fade-in duration-300">


        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ReportTabsList
            layoutId="backtestReportTab"
            activeValue={activeTab}
            tabs={[
              { value: "overview", label: "Overview", icon: IconLayoutDashboard },
              { value: "analytics", label: "Analytics", icon: IconActivity },
              { value: "risk", label: "Risk & Distribution", icon: IconShieldLock },
              { value: "trades", label: "Trades & Execution", icon: IconReceipt2 },
              { value: "montecarlo", label: "Monte Carlo", icon: IconDice5 },
            ]}
          />

          <TabsContent value="overview" className="flex flex-col gap-5 mt-5">
            {/* Symbol scope selector — filters the KPI strip + performance charts */}
            {symbolKeys.length > 0 && (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <ReportSectionLabel>Performance</ReportSectionLabel>
                <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-muted/60 border border-border/60 shadow-2xs select-none flex-wrap">
                  <button
                    onClick={() => setSelectedSymbol("global")}
                    className={cn(
                      "px-3 py-1 rounded-md text-[11.5px] tracking-wide transition-all duration-200 cursor-pointer select-none",
                      selectedSymbol === "global"
                        ? "bg-card text-primary shadow-2xs border border-border/70 font-bold"
                        : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/40 font-medium"
                    )}
                  >
                    Global
                  </button>
                  {symbolKeys.map((sym) => (
                    <button
                      key={sym}
                      onClick={() => setSelectedSymbol(sym)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-md text-[11.5px] tracking-wide transition-all duration-200 cursor-pointer select-none",
                        selectedSymbol === sym
                          ? "bg-card text-primary shadow-2xs border border-border/70 font-bold"
                          : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/40 font-medium"
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

            {/* Equity + drawdown in separate full-width rows */}
            <div className="flex flex-col gap-4 w-full">
              <EquityCurveChart
                equityData={equityData}
                isProfit={isProfit}
                isLoading={isEquityLoading && equityData.length === 0}
              />
              <DrawdownChart
                drawdownData={drawdownData}
                title={selectedSymbol === "global" ? "Drawdown" : `${selectedSymbol} Drawdown`}
                color="var(--destructive)"
                valueLabel="Drawdown"
                valueFormatter={(v) => `${Number(v).toFixed(2)}%`}
                yAxisFormatter={(v) => `${v}%`}
                emptyText="No drawdown data available"
                isLoading={(isEquityLoading || isDrawdownLoading) && drawdownData.length === 0}
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
                isLoading={isExposureLoading && exposureData.length === 0}
              />
            )}

            {/* Per-symbol breakdown */}
            {symbolKeys.length > 0 && (
              <>
                <ReportSectionLabel>Per-Symbol Breakdown</ReportSectionLabel>
                <SymbolBreakdownCards report={runJson} trades={trades} />
              </>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="flex flex-col gap-5 mt-5">
            {/* 4 Rolling Metric Standalone Charts (+ 5th Full Row Correlation Chart when multi-symbol) */}
            <RollingMetricsChart
              backtestId={backtestId}
              runJson={runJson}
            />

            {/* Order lifecycle & concentration panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <OrderLifecyclePanel orders={orders} />
              <ConcentrationPanel report={runJson} />
            </div>

            <CorrelationHeatmap report={runJson} />
          </TabsContent>

          <TabsContent value="risk" className="flex flex-col gap-5 mt-5">
            <RiskStatsPanel report={runJson} />
            <TradeDistributionTable report={runJson} />
            <MonthlyReturnsStrip report={runJson} />
            <SizingCards report={runJson} />
          </TabsContent>

          <TabsContent value="trades" className="flex flex-col gap-5 mt-5">
            <TradesSection trades={trades} orders={orders} />
          </TabsContent>

          <TabsContent value="montecarlo" className="flex flex-col gap-5 mt-5">
            <MonteCarloTab strategyId={strategyId} backtestId={backtestId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
