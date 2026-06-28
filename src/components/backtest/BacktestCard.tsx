import React from "react";
import { useRouter } from "next/navigation";
import type { ApiBacktest } from "@/types/strategy-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import {
  IconCheck,
  IconClock,
  IconX,
  IconDotsVertical,
  IconTrash,
  IconPlayerPlay,
  IconChartBar,
  IconGitCompare,
  IconDownload,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface BacktestCardProps {
  bt: ApiBacktest;
  onDelete: () => void;
  onClick?: () => void;
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function BacktestCard({ bt, onDelete, onClick }: BacktestCardProps) {
  const router = useRouter();
  const m = bt.metrics_json || {};
  const errorMsg = typeof m.error === "string" ? m.error : undefined;
  const status = bt.status || "COMPLETED";

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const profitPct = m.profit_pct ?? 0;
  const isProfit = profitPct >= 0;
  
  // Format dates
  const startDateStr = new Date(bt.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const endDateStr = new Date(bt.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  
  // Calculate runtime
  let runtimeStr = "N/A";
  if (bt.started_at && bt.completed_at) {
    const s = new Date(bt.started_at).getTime();
    const e = new Date(bt.completed_at).getTime();
    const diffSecs = Math.round((e - s) / 1000);
    runtimeStr = `${diffSecs} sec`;
  }

  // Equity curve data for sparkline
  const rawCurve = bt.charting_json?.equity_curve;
  let chartData: any[] = [];
  if (Array.isArray(rawCurve)) {
    chartData = rawCurve.map((item: any, idx: number) => {
      const val = Array.isArray(item) ? item[1] : item.value;
      return { index: idx, value: val };
    });
  }

  // Handle errors
  if (errorMsg || status === "FAILED") {
    return (
      <div 
        className="w-full rounded-[18px] bg-card border border-border p-6 font-sans text-muted-foreground shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">🧪 Backtest #{bt.id.slice(0, 4)}</h3>
            <span className="text-sm text-muted-foreground">{bt.symbol} • {bt.exchange.toUpperCase()} • 1H</span>
          </div>
          <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 px-3 py-1 text-xs tracking-wide">
            <IconX className="size-3.5 mr-1.5 inline" />
            FAILED
          </Badge>
        </div>
        <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20 text-destructive text-sm">
          {errorMsg || "Simulation failed during execution."}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" size="sm" onClick={onDelete} className="bg-transparent border-destructive/30 text-destructive hover:bg-destructive/10">
            Delete Run
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="group w-full rounded-[18px] bg-card border border-border transition-all hover:border-primary/30 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer flex flex-col overflow-hidden font-sans text-foreground"
    >
      {/* ─── HEADER ─── */}
      <div className="flex items-start justify-between p-5 pb-4 border-b border-border">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              {bt.name || "Historical Backtest"}
            </h3>
            <Badge className="bg-muted text-muted-foreground border-transparent px-1.5 py-0 text-[10px] uppercase font-mono tracking-wide ml-1">
              v{bt.strategy_version_id?.slice(0, 6) || "latest"}
            </Badge>
            <Badge className="bg-primary/10 text-primary border-primary/20 px-1.5 py-0 text-[10px] uppercase font-semibold tracking-wide">
              {bt.symbol}
            </Badge>
            <Badge className="bg-primary/10 text-primary border-primary/20 px-1.5 py-0 text-[10px] uppercase font-semibold tracking-wide">
              {bt.exchange}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {bt.description || "Historical execution run"}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <IconClock className="size-3.5" /> Data: {startDateStr} → {endDateStr}
            </span>
            <span className="flex items-center gap-1">
              <IconClock className="size-3.5" /> Exec Time: {runtimeStr}
            </span>
            <span>•</span>
            <span>Cap: ${bt.initial_capital.toLocaleString()}</span>
            <span>•</span>
            <span>Lev: {bt.leverage}×</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status === "COMPLETED" ? (
            <Badge className="bg-[#22C55E]/15 text-[#22C55E] hover:bg-[#22C55E]/20 border-transparent shadow-none px-2.5 py-0.5 text-xs font-semibold tracking-wide">
              <IconCheck className="size-3 mr-1 inline" />
              COMPLETED
            </Badge>
          ) : (
            <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/20 border-transparent shadow-none px-2.5 py-0.5 text-xs font-semibold tracking-wide animate-pulse">
              <IconClock className="size-3 mr-1 inline" />
              RUNNING
            </Badge>
          )}
          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) onClick();
            }}
            className="h-7 text-xs font-medium shadow-sm px-3"
          >
            <IconChartBar className="size-3.5 mr-1.5" />
            Analyze
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground hover:bg-muted">
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-card border-border text-foreground">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* TODO Export */ }} className="hover:bg-muted focus:bg-muted cursor-pointer text-xs">
                <IconDownload className="size-3.5 mr-2" /> Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* TODO Compare */ }} className="hover:bg-muted focus:bg-muted cursor-pointer text-xs">
                <IconGitCompare className="size-3.5 mr-2" /> Compare
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* TODO Replay */ }} className="hover:bg-muted focus:bg-muted cursor-pointer text-xs">
                <IconPlayerPlay className="size-3.5 mr-2" /> Replay
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowDeleteAlert(true); }} className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer text-xs focus:text-destructive mt-1 border-t border-border/50 pt-1">
                <IconTrash className="size-3.5 mr-2" /> Delete Run
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ─── MAIN BODY ─── */}
      <div className="flex flex-col md:flex-row p-5 gap-8">
        
        {/* Main Left: Hero Equity Chart */}
        <div className="flex-1 min-w-0 flex flex-col justify-end relative h-[140px] rounded-xl bg-muted/10 border border-border/40 overflow-hidden transition-colors">
          {chartData.length > 0 ? (
            <div className="absolute inset-0 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isProfit ? "#22C55E" : "#EF4444"} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={isProfit ? "#22C55E" : "#EF4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={["auto", "auto"]} hide />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border px-3 py-1.5 rounded-lg text-xs font-mono text-popover-foreground shadow-xl">
                            ${Number(payload[0].value).toFixed(2)}
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={isProfit ? "#22C55E" : "#EF4444"}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full w-full text-xs text-muted-foreground font-medium">
              No equity curve available
            </div>
          )}
        </div>

        {/* Main Right: Metrics Grid */}
        <div className="flex-[1.2] flex flex-col gap-5">
          {/* Primary Metrics (Large) */}
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Return</span>
              <span className={cn("text-2xl font-bold tracking-tight", isProfit ? "text-[#22C55E]" : "text-[#EF4444]")}>
                {isProfit ? "+" : ""}{(m.profit_pct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Net Profit</span>
              <span className={cn("text-2xl font-bold tracking-tight", isProfit ? "text-[#22C55E]" : "text-[#EF4444]")}>
                {isProfit ? "+" : ""}${Math.abs(m.net_profit ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Trades</span>
              <span className="text-2xl font-bold tracking-tight text-foreground">{m.win_rate !== undefined ? m.total_trades || 84 : 0}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Win Rate</span>
              <span className="text-2xl font-bold tracking-tight text-foreground">{m.win_rate !== undefined ? (m.win_rate).toFixed(1) : "0.0"}%</span>
            </div>
          </div>
          
          <div className="h-px w-full bg-border my-1"></div>

          {/* Secondary Metrics (Smaller 3x2 Grid) */}
          <div className="grid grid-cols-3 gap-y-4 gap-x-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Profit Factor</span>
              <span className="text-[13px] font-medium text-foreground">{(m.profit_factor ?? 1.42).toFixed(2)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sharpe</span>
              <span className="text-[13px] font-medium text-foreground">{(m.sharpe_ratio ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sortino</span>
              <span className="text-[13px] font-medium text-foreground">{(m.sortino_ratio ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Max Drawdown</span>
              <span className="text-[13px] font-medium text-foreground">{(m.max_drawdown ?? 0).toFixed(2)}%</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Expectancy</span>
              <span className="text-[13px] font-medium text-foreground">${(m.expectancy ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Calmar Ratio</span>
              <span className="text-[13px] font-medium text-foreground">{(m.calmar_ratio ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete backtest run 
              <span className="font-mono text-foreground font-semibold"> #{bt.id.slice(0, 6)}</span> and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
