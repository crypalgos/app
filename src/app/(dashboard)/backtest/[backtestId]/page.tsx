"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useStrategyBacktest } from "@/api-actions/hooks/strategy-hooks";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
import {
  IconArrowLeft,
  IconCalendar,
  IconTrendingUp,
  IconTrendingDown,
  IconActivity,
  IconCurrencyDollar,
  IconPercentage,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export default function BacktestAnalysisPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const backtestId = params.backtestId as string;
  const strategyId = searchParams.get("strategyId");

  const { data: bt, isLoading } = useStrategyBacktest(strategyId, backtestId);

  const m = bt?.metrics_json;
  const charting = (bt?.charting_json ?? {}) as {
    trades?: Array<{
      symbol: string;
      side: string;
      entry_price: number;
      exit_price: number;
      amount: number;
      entry_time: number;
      exit_time: number;
      pnl: number;
      fees: number;
      exit_label?: string;
    }>;
    equity_curve?: Array<[number, number]>;
    drawdown_curve?: Array<[number, number]>;
  };

  const equityData = (charting.equity_curve ?? []).map(([time, value]) => ({
    time,
    formattedTime: new Date(time).toLocaleDateString(),
    balance: value,
  }));

  const drawdownData = (charting.drawdown_curve ?? []).map(([time, value]) => ({
    time,
    formattedTime: new Date(time).toLocaleDateString(),
    drawdown: value,
  }));

  const trades = charting.trades ?? [];

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full px-4 md:px-6 pb-20 pt-2">
      {/* Header with Back Button */}
      <div className="flex flex-col gap-3">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push("/backtests")}
            className="text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer h-8 px-2.5 -ml-1 gap-1.5"
          >
            <IconArrowLeft className="size-3.5" />
            Back to History
          </Button>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] uppercase font-mono tracking-wider">
                {bt?.symbol ?? "Simulation"}
              </Badge>
              <Badge className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                {bt?.exchange.toUpperCase() ?? "DELTA"}
              </Badge>
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground mt-1">
              Backtest Performance Analysis
            </h2>
            <p className="text-muted-foreground text-xs">
              {bt ? (
                `Executed on ${new Date(bt.created_at).toLocaleString()} from ${new Date(bt.start_date).toLocaleDateString()} to ${new Date(bt.end_date).toLocaleDateString()}`
              ) : (
                "Loading simulation performance data..."
              )}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[90px] rounded-2xl animate-pulse" />
            ))}
          </div>
          <Skeleton className="h-[380px] w-full rounded-2xl animate-pulse" />
          <Skeleton className="h-[280px] w-full rounded-2xl animate-pulse" />
        </div>
      ) : !bt ? (
        <Card className="border border-border/60 bg-muted/10 p-12 text-center flex flex-col items-center justify-center gap-2 rounded-2xl">
          <IconTrendingDown className="size-8 text-muted-foreground opacity-60" />
          <h3 className="text-sm font-bold text-foreground">Failed to Load Analysis</h3>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            We could not retrieve details for this backtest. Verify the strategy is owned by your user account.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-muted/10 border-border/50 shadow-sm relative group overflow-hidden">
              <CardContent className="p-5 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <IconCurrencyDollar className="size-3.5 text-muted-foreground/60" />
                  Net Profit
                </span>
                <span className={cn(
                  "text-2xl font-extrabold tabular-nums tracking-tight",
                  (m?.net_profit ?? 0) >= 0 ? "text-emerald-500" : "text-destructive"
                )}>
                  ${(m?.net_profit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={cn(
                  "text-[11px] font-semibold flex items-center gap-0.5",
                  (m?.profit_pct ?? 0) >= 0 ? "text-emerald-500/80" : "text-destructive/80"
                )}>
                  {(m?.profit_pct ?? 0) >= 0 ? "+" : ""}{(m?.profit_pct ?? 0).toFixed(2)}%
                </span>
              </CardContent>
            </Card>

            <Card className="bg-muted/10 border-border/50 shadow-sm relative group overflow-hidden">
              <CardContent className="p-5 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <IconPercentage className="size-3.5 text-muted-foreground/60" />
                  Win Rate
                </span>
                <span className="text-2xl font-extrabold text-foreground tabular-nums tracking-tight">
                  {m?.win_rate?.toFixed(1) ?? "0.0"}%
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {m?.total_trades ?? 0} total trades executed
                </span>
              </CardContent>
            </Card>

            <Card className="bg-muted/10 border-border/50 shadow-sm relative group overflow-hidden">
              <CardContent className="p-5 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <IconActivity className="size-3.5 text-muted-foreground/60" />
                  Sharpe Ratio
                </span>
                <span className={cn(
                  "text-2xl font-extrabold tabular-nums tracking-tight",
                  (m?.sharpe_ratio ?? 0) >= 1 ? "text-emerald-500" : "text-foreground"
                )}>
                  {m?.sharpe_ratio?.toFixed(2) ?? "0.00"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Risk-adjusted efficiency metric
                </span>
              </CardContent>
            </Card>

            <Card className="bg-muted/10 border-border/50 shadow-sm relative group overflow-hidden">
              <CardContent className="p-5 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <IconTrendingDown className="size-3.5 text-muted-foreground/60" />
                  Max Drawdown
                </span>
                <span className="text-2xl font-extrabold text-destructive tabular-nums tracking-tight">
                  {m?.max_drawdown?.toFixed(2) ?? "0.00"}%
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Peak-to-trough maximum risk
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Summary Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground border border-border/40 bg-muted/10 rounded-2xl px-6 py-4 shadow-sm">
            <div className="flex items-center gap-1.5">
              <IconCalendar className="size-3.5" />
              <span>Timeline: <span className="font-bold text-foreground">{new Date(bt.start_date).toLocaleDateString()} → {new Date(bt.end_date).toLocaleDateString()}</span></span>
            </div>
            <span>Initial Capital: <span className="font-bold text-foreground">${bt.initial_capital.toLocaleString()}</span></span>
            <span>Leverage Multiplier: <span className="font-bold text-foreground">{bt.leverage}×</span></span>
            <span>Ticker Ticker: <span className="font-bold text-foreground">{bt.symbol}</span></span>
            <span>Exchange Platform: <span className="font-bold text-foreground">{bt.exchange.toUpperCase()}</span></span>
          </div>

          {/* Detailed Performance curves and trades list tab system */}
          <Tabs defaultValue="equity" className="w-full flex flex-col gap-4">
            <TabsList className="bg-muted/30 rounded-full w-fit border border-border/30 p-1">
              <TabsTrigger value="equity" className="rounded-full px-5 text-xs font-semibold">
                Equity Curve
              </TabsTrigger>
              <TabsTrigger value="drawdown" className="rounded-full px-5 text-xs font-semibold">
                Drawdown Curve
              </TabsTrigger>
              <TabsTrigger value="trades" className="rounded-full px-5 text-xs font-semibold">
                Trades Log ({trades.length})
              </TabsTrigger>
            </TabsList>

            {/* Equity Curve Tab */}
            <TabsContent value="equity" className="bg-muted/15 border border-border/40 rounded-2xl p-6 flex flex-col gap-4 min-h-[420px]">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">Portfolio Capital Progression</span>
                  <span className="text-[10px] text-muted-foreground">Real-time account valuation throughout simulation</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono bg-muted/40 px-2 py-0.5 rounded border border-border/30">USD</span>
              </div>
              <div className="flex-1 min-h-[300px] w-full relative">
                {equityData.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border/50 rounded-xl">
                    No equity progression data points available for this simulation run.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={equityData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="formattedTime"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }}
                        dy={8}
                      />
                      <YAxis
                        domain={["dataMin - 100", "dataMax + 100"]}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }}
                        tickFormatter={(val) => `$${Number(val).toFixed(0)}`}
                      />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-popover border border-border/80 rounded-2xl p-4 shadow-xl backdrop-blur-md">
                                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1.5">
                                  {d.formattedTime}
                                </p>
                                <p className="text-sm font-extrabold text-emerald-500 tabular-nums">
                                  Balance: ${Number(d.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorEquity)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>

            {/* Drawdown Curve Tab */}
            <TabsContent value="drawdown" className="bg-muted/15 border border-border/40 rounded-2xl p-6 flex flex-col gap-4 min-h-[420px]">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">Risk Drawdown Curve</span>
                  <span className="text-[10px] text-muted-foreground">Historical asset value drops from dynamic peak levels</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono bg-muted/40 px-2 py-0.5 rounded border border-border/30">PERCENT</span>
              </div>
              <div className="flex-1 min-h-[300px] w-full relative">
                {drawdownData.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border/50 rounded-xl">
                    No drawdown data points available for this simulation run.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={drawdownData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="formattedTime"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }}
                        dy={8}
                      />
                      <YAxis
                        domain={["dataMin - 1", 0]}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }}
                        tickFormatter={(val) => `${Number(val).toFixed(1)}%`}
                      />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-popover border border-border/80 rounded-2xl p-4 shadow-xl backdrop-blur-md">
                                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1.5">
                                  {d.formattedTime}
                                </p>
                                <p className="text-sm font-extrabold text-rose-500 tabular-nums">
                                  Drawdown: {Number(d.drawdown).toFixed(2)}%
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="drawdown"
                        stroke="#f43f5e"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorDrawdown)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>

            {/* Trades Tab */}
            <TabsContent value="trades" className="flex flex-col gap-2">
              <ScrollArea className="border border-border/40 rounded-2xl bg-muted/10 max-h-[500px]">
                {trades.length === 0 ? (
                  <div className="flex items-center justify-center py-20 text-xs text-muted-foreground">
                    No trades executed during this run.
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
                      <TableRow className="border-b border-border/40 hover:bg-transparent">
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider py-3 h-10">Date</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider py-3 h-10">Side</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider py-3 h-10">Entry Price</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider py-3 h-10">Exit Price</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider py-3 h-10">Net PnL</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider py-3 h-10">Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.map((t, idx) => (
                        <TableRow key={idx} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <TableCell className="text-[11px] tabular-nums py-3">
                            {new Date(t.entry_time).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge variant="outline" className={cn(
                              "text-[9px] uppercase tracking-wider font-semibold py-0 px-2 h-4.5 min-w-[50px] text-center justify-center",
                              t.side === "long" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            )}>
                              {t.side}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[11px] tabular-nums font-mono py-3">
                            ${t.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-[11px] tabular-nums font-mono py-3">
                            ${t.exit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className={cn(
                            "text-[11px] font-bold tabular-nums font-mono py-3",
                            t.pnl >= 0 ? "text-emerald-500" : "text-destructive"
                          )}>
                            {t.pnl >= 0 ? "+" : ""}${t.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge variant="secondary" className="text-[9px] font-medium opacity-85 uppercase tracking-wider py-0 px-1.5 bg-muted">
                              {t.exit_label?.replace("_", " ") ?? "force close"}
                            </Badge>
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
      )}
    </div>
  );
}
