"use client";

import { useParams, useRouter } from "next/navigation";
import { useStrategyBacktest, useRunDataset } from "@/api-actions/hooks/strategy-hooks";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

function MetricCard({ title, value, color }: { title: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
      <span className={cn("text-xl sm:text-2xl font-bold tabular-nums mt-1", color)}>
        {value}
      </span>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-border/5 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium tabular-nums text-right">{value}</span>
    </div>
  );
}

export default function BacktestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const strategyId = params?.strategyId as string;
  const backtestId = params?.backtestId as string;

  const { data: backtest, isLoading } = useStrategyBacktest(
    strategyId,
    backtestId
  );

  const charting: any = backtest?.charting_json ?? {};
  const datasetId = charting.dataset_id;
  const trades = charting.trades ?? [];
  const report = backtest?.report_json ?? {};
  const metrics = report.metrics ?? {};
  const globalMetrics = metrics.global ?? {};
  const riskMetrics = metrics.risk ?? {};
  const distMetrics = metrics.distributions?.global ?? {};
  const capMetrics = metrics.capacity ?? {};
  const symbols = metrics.symbols ?? {};

  // Fetch full resolution chart if dataset_id is available (unconditional hook call)
  const { data: fullEquityCurve } = useRunDataset(backtestId, datasetId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-1/4 rounded-md" />
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!backtest) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Backtest not found or failed to load.
      </div>
    );
  }

  const resolvedEquityCurve = fullEquityCurve || charting.equity_curve || [];

  const equityData = resolvedEquityCurve.map(([time, value]: any) => ({
    time,
    formattedTime: new Date(time).toLocaleDateString(),
    balance: value,
  }));

  const drawdownData = (charting.drawdown_curve ?? []).map(([time, value]: any) => ({
    time,
    formattedTime: new Date(time).toLocaleDateString(),
    drawdown: value,
  }));

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Custom Top Nav */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push(`/strategies/${strategyId}/backtests`)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <IconArrowLeft className="size-4" />
            Back to Strategy
          </Button>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-[400px]">
              Backtest: {new Date(backtest.created_at).toLocaleString()}
            </h1>
            <Badge variant="secondary" className="text-[10px] uppercase font-mono tracking-wider h-5 hidden sm:inline-flex">
              {backtest.symbol || "Unknown"}
            </Badge>
            <Badge className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 h-5 hidden sm:inline-flex">
              {backtest.exchange?.toUpperCase() || "Unknown"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 shadow-none">
            COMPLETED
          </Badge>
        </div>
      </header>

      {/* Main Content Area */}
      <ScrollArea className="flex-1 w-full">
        <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-5xl mx-auto p-4 md:p-6 lg:p-8">

      {/* Analysis Tabs */}
      <Tabs defaultValue="overview" className="w-full flex-1 flex flex-col gap-4 mt-2">
        <TabsList className="grid w-full grid-cols-4 bg-muted/30 p-1">
          <TabsTrigger value="overview" className="text-sm cursor-pointer py-2 font-semibold">Overview</TabsTrigger>
          <TabsTrigger value="charts" className="text-sm cursor-pointer py-2 font-semibold">Charts</TabsTrigger>
          <TabsTrigger value="assets" className="text-sm cursor-pointer py-2 font-semibold">Assets ({Object.keys(symbols).length})</TabsTrigger>
          <TabsTrigger value="trades" className="text-sm cursor-pointer py-2 font-semibold">Trades ({trades.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex flex-col gap-6 animate-in fade-in">
          {/* Global Metrics Header */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 bg-muted/10 border border-border/20 rounded-2xl p-6 shadow-sm">
            <MetricCard title="Net Profit" value={`$${(globalMetrics.net_profit ?? backtest.metrics_json?.net_profit ?? 0).toFixed(2)}`} color={(globalMetrics.net_profit ?? backtest.metrics_json?.net_profit ?? 0) >= 0 ? "text-emerald-500" : "text-destructive"} />
            <MetricCard title="Return %" value={`${(globalMetrics.total_return_pct ?? backtest.metrics_json?.profit_pct ?? 0).toFixed(2)}%`} color={(globalMetrics.total_return_pct ?? 0) >= 0 ? "text-emerald-500" : "text-destructive"} />
            <MetricCard title="Sharpe Ratio" value={(globalMetrics.sharpe_ratio ?? backtest.metrics_json?.sharpe_ratio ?? 0).toFixed(2)} />
            <MetricCard title="Max Drawdown" value={`${(globalMetrics.max_drawdown_pct ?? backtest.metrics_json?.max_drawdown ?? 0).toFixed(2)}%`} color="text-destructive" />
            <MetricCard title="Win Rate" value={globalMetrics.win_rate !== undefined ? `${(globalMetrics.win_rate * 100).toFixed(1)}%` : `${(backtest.metrics_json?.win_rate ?? 0).toFixed(1)}%`} />
            <MetricCard title="Profit Factor" value={globalMetrics.profit_factor ? globalMetrics.profit_factor.toFixed(2) : "N/A"} />
          </div>

          {/* Detailed Metric Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-muted/5 border border-border/10 rounded-2xl p-5 hover:bg-muted/10 transition-colors">
              <h3 className="font-semibold text-sm mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">Risk Profile</h3>
              <div className="flex flex-col gap-3">
                <MetricRow label="Historical VaR (95%)" value={`${(riskMetrics.historical_var_95 ?? 0).toFixed(2)}%`} />
                <MetricRow label="CVaR (95%)" value={`${(riskMetrics.cvar_95 ?? 0).toFixed(2)}%`} />
                <MetricRow label="Ulcer Index" value={(riskMetrics.ulcer_index ?? 0).toFixed(2)} />
                <MetricRow label="Omega Ratio" value={(riskMetrics.omega_ratio ?? 0).toFixed(2)} />
                <MetricRow label="Tail Ratio" value={(riskMetrics.tail_ratio ?? 0).toFixed(2)} />
              </div>
            </div>
            <div className="bg-muted/5 border border-border/10 rounded-2xl p-5 hover:bg-muted/10 transition-colors">
              <h3 className="font-semibold text-sm mb-4 uppercase tracking-wider text-muted-foreground">Distributions</h3>
              <div className="flex flex-col gap-3">
                <MetricRow label="Expectancy" value={`$${(distMetrics.expectancy ?? 0).toFixed(2)}`} />
                <MetricRow label="Payoff Ratio" value={(distMetrics.payoff_ratio ?? 0).toFixed(2)} />
                <MetricRow label="Average Winner" value={`$${(distMetrics.average_winner ?? 0).toFixed(2)}`} />
                <MetricRow label="Average Loser" value={`$${(distMetrics.average_loser ?? 0).toFixed(2)}`} />
                <MetricRow label="Max Consecutive Wins" value={distMetrics.max_consecutive_wins ?? 0} />
              </div>
            </div>
            <div className="bg-muted/5 border border-border/10 rounded-2xl p-5 hover:bg-muted/10 transition-colors">
              <h3 className="font-semibold text-sm mb-4 uppercase tracking-wider text-muted-foreground">Capacity & Sizing</h3>
              <div className="flex flex-col gap-3">
                <MetricRow label="Avg Position Size" value={`$${(capMetrics.average_position_size ?? 0).toFixed(2)}`} />
                <MetricRow label="Max Position Size" value={`$${(capMetrics.maximum_position_size ?? 0).toFixed(2)}`} />
                <MetricRow label="Avg Margin Usage" value={`${((capMetrics.average_margin_usage ?? 0) * 100).toFixed(2)}%`} />
                <MetricRow label="Max Margin Usage" value={`${((capMetrics.maximum_margin_usage ?? 0) * 100).toFixed(2)}%`} />
                <MetricRow label="Total Trades" value={globalMetrics.total_trades ?? trades.length} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="flex flex-col gap-6 animate-in fade-in">
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-muted/10 border border-border/20 rounded-2xl p-6">
              <h3 className="font-semibold text-sm mb-4">Equity Curve</h3>
              <div className="h-[350px] w-full">
                {equityData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No equity curve data available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="formattedTime" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val}`} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEquity)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-muted/10 border border-border/20 rounded-2xl p-6">
              <h3 className="font-semibold text-sm mb-4">Drawdown Curve</h3>
              <div className="h-[350px] w-full">
                {drawdownData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No drawdown curve data available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={drawdownData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="formattedTime" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDrawdown)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Assets Tab (Multi-Asset Breakdown) */}
        <TabsContent value="assets" className="flex-1 min-h-[400px] animate-in fade-in">
          <ScrollArea className="border border-border/20 rounded-2xl bg-muted/10 h-[500px]">
            {Object.keys(symbols).length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground py-10">
                No individual asset data available.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
                  <TableRow className="border-b border-border/20">
                    <TableHead className="text-xs font-bold uppercase tracking-wider py-4 px-6 h-12">Symbol</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider py-4 h-12 text-right">Net Profit</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider py-4 h-12 text-right">Sharpe</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider py-4 h-12 text-right">Sortino</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider py-4 h-12 text-right">Max Drawdown</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider py-4 px-6 h-12 text-right">Recovery Factor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(symbols).map(([sym, stats]: [string, any]) => (
                    <TableRow key={sym} className="border-b border-border/10 hover:bg-muted/25 transition-colors">
                      <TableCell className="font-semibold text-sm px-6 py-4">{sym}</TableCell>
                      <TableCell className={cn("text-sm font-mono tabular-nums text-right py-4", stats.net_profit >= 0 ? "text-emerald-500" : "text-destructive")}>
                        ${(stats.net_profit ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm font-mono tabular-nums text-right py-4">{(stats.sharpe_ratio ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="text-sm font-mono tabular-nums text-right py-4">{(stats.sortino_ratio ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="text-sm font-mono tabular-nums text-right py-4 text-destructive">{(stats.max_drawdown_pct ?? 0).toFixed(2)}%</TableCell>
                      <TableCell className="text-sm font-mono tabular-nums text-right py-4 px-6">{(stats.recovery_factor ?? 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Trades Tab */}
        <TabsContent value="trades" className="flex-1 min-h-[400px] animate-in fade-in">
          <ScrollArea className="border border-border/20 rounded-2xl bg-muted/10 h-[500px]">
            {trades.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground py-10">
                No trades executed.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
                  <TableRow className="border-b border-border/20">
                    <TableHead className="text-xs font-bold uppercase tracking-wider py-4 px-6 h-12">Date</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider py-4 h-12">Symbol</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider py-4 h-12">Side</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider py-4 h-12">Entry</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider py-4 h-12">Exit</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider py-4 px-6 h-12">PnL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((t: any, idx: number) => (
                    <TableRow key={idx} className="border-b border-border/10 hover:bg-muted/25 transition-colors">
                      <TableCell className="text-xs tabular-nums py-3 px-6">
                        {new Date(t.entry_time).toLocaleDateString()} {new Date(t.entry_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-muted-foreground py-3">
                        {t.symbol || backtest.symbol || "N/A"}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className={cn(
                          "text-[10px] uppercase font-semibold py-px px-2",
                          t.side === "long" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {t.side}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs tabular-nums font-mono py-3">
                        ${t.entry_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums font-mono py-3">
                        ${t.exit_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className={cn(
                        "text-xs font-bold tabular-nums font-mono py-3 px-6",
                        t.pnl >= 0 ? "text-emerald-500" : "text-destructive"
                      )}>
                        {t.pnl >= 0 ? "+" : ""}${t.pnl?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  </ScrollArea>
</div>
);
}
