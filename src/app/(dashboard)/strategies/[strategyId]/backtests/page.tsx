"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useStrategyBacktests,
  useDeleteBacktest,
} from "@/api-actions/hooks/strategy-hooks";
import type { ApiBacktest } from "@/api-actions/strategy-actions";

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
import { toast } from "sonner";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import {
  IconChartLine,
  IconTrendingUp,
  IconTrendingDown,
  IconActivity,
  IconCalendar,
  IconCurrencyDollar,
  IconPercentage,
  IconTrash,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// ─── Metric Tile ──────────────────────────────────────────────────────────────

function MetricTile({
  label,
  value,
  positive,
  icon: Icon,
}: {
  label: string;
  value: string;
  positive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center bg-muted/20 border border-border/20 p-2.5 rounded-xl">
      <Icon className="size-4 text-muted-foreground/60 mb-0.5" />
      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span
        className={cn(
          "text-xs font-bold tabular-nums",
          positive === true
            ? "text-emerald-500"
            : positive === false
              ? "text-destructive"
              : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Backtest Card ────────────────────────────────────────────────────────────

function BacktestCard({ 
  bt, 
  onDelete,
  onClick
}: { 
  bt: ApiBacktest; 
  onDelete: () => void;
  onClick?: () => void;
}) {
  const m = bt.metrics_json;
  const errorMsg = typeof m.error === "string" ? m.error : undefined;

  if (errorMsg) {
    return (
      <Card className="hover:border-destructive/30 border-destructive/50 bg-destructive/5 dark:bg-destructive/10 transition-all hover:shadow-md relative group">
        <CardHeader className="pb-2 gap-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-mono bg-destructive/15 text-destructive border border-destructive/20">
              {bt.symbol}
            </Badge>
            <div className="flex items-center gap-1.5">
              <Badge className="text-[10px] font-bold bg-destructive/20 text-destructive border border-destructive/30">
                Failed
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-md transition-colors"
              >
                <IconTrash className="size-3.5" />
              </Button>
            </div>
          </div>
          <div>
            <CardTitle className="text-[14px] text-destructive font-bold">{bt.exchange.toUpperCase()}</CardTitle>
            <CardDescription className="text-[11px] flex items-center gap-1">
              <IconCalendar className="size-3" />
              {new Date(bt.start_date).toLocaleDateString()} → {new Date(bt.end_date).toLocaleDateString()}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-1">
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 flex flex-col items-center justify-center text-center min-h-[96px] gap-2">
            <IconTrendingDown className="size-5 text-destructive" />
            <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">
              Simulation Failed
            </span>
            <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
              {errorMsg}
            </p>
          </div>

          <div className="flex items-center justify-between mt-3 px-1 text-[10px] text-muted-foreground">
            <span>Capital: <span className="font-semibold">${bt.initial_capital.toLocaleString()}</span></span>
            <span>Leverage: <span className="font-semibold">{bt.leverage}×</span></span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const profitPct = m.profit_pct ?? 0;
  const isProfit = profitPct >= 0;

  return (
    <Card 
      onClick={onClick}
      className="hover:border-primary/40 cursor-pointer transition-all hover:shadow-md relative group border-border/50 bg-card/30"
    >
      <CardHeader className="pb-2 gap-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-mono">
            {bt.symbol}
          </Badge>
          <div className="flex items-center gap-1.5">
            <Badge
              className={cn(
                "text-[10px] font-bold",
                isProfit
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20",
              )}
            >
              {isProfit ? <IconTrendingUp className="size-3 mr-1 inline" /> : <IconTrendingDown className="size-3 mr-1 inline" />}
              {isProfit ? "+" : ""}{profitPct.toFixed(2)}%
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-md transition-colors"
            >
              <IconTrash className="size-3.5" />
            </Button>
          </div>
        </div>
        <div>
          <CardTitle className="text-[14px]">{bt.exchange.toUpperCase()}</CardTitle>
          <CardDescription className="text-[11px] flex items-center gap-1">
            <IconCalendar className="size-3" />
            {new Date(bt.start_date).toLocaleDateString()} → {new Date(bt.end_date).toLocaleDateString()}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-4 gap-2 rounded-xl border border-border/40 bg-muted/20 p-2.5">
          <MetricTile
            label="Net P/L"
            value={`$${(m.net_profit ?? 0).toFixed(0)}`}
            positive={isProfit}
            icon={IconCurrencyDollar}
          />
          <MetricTile
            label="Win Rate"
            value={`${(m.win_rate ?? 0).toFixed(1)}%`}
            icon={IconPercentage}
          />
          <MetricTile
            label="Sharpe"
            value={(m.sharpe_ratio ?? 0).toFixed(2)}
            positive={(m.sharpe_ratio ?? 0) >= 1}
            icon={IconActivity}
          />
          <MetricTile
            label="Drawdown"
            value={`${(m.max_drawdown ?? 0).toFixed(1)}%`}
            positive={false}
            icon={IconTrendingDown}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function StrategyBacktestsPage() {
  const params = useParams();
  const router = useRouter();
  const strategyId = params?.strategyId as string;

  const [page, setPage] = useState(1);
  const limit = 9;

  const { data: apiBacktests, isLoading } = useStrategyBacktests(
    strategyId,
    page,
    limit
  );

  const { mutate: deleteBacktest } = useDeleteBacktest(strategyId);

  const handleDeleteBacktest = (backtestId: string) => {
    deleteBacktest(backtestId, {
      onSuccess: () => {
        toast.success("Backtest run deleted successfully.");
      },
      onError: () => toast.error("Failed to delete backtest run."),
    });
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[180px] rounded-xl" />
        ))}
      </div>
    );
  }

  const backtests = apiBacktests?.backtests ?? [];

  if (backtests.length === 0 && page === 1) {
    return (
      <Empty className="border border-dashed border-border/40 min-h-[300px]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconChartLine />
          </EmptyMedia>
          <EmptyTitle>No Backtest Runs</EmptyTitle>
          <EmptyDescription>
            You haven't run any backtest simulations on this strategy yet. Open the visual builder to run your first simulation.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }


  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
          <span>Backtest Execution History</span>
          <Badge variant="outline" className="text-[10px] font-mono">
            {apiBacktests?.total ?? 0} total runs
          </Badge>
        </h2>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {backtests.map((bt) => (
          <BacktestCard
            key={bt.id}
            bt={bt}
            onDelete={() => handleDeleteBacktest(bt.id)}
            onClick={() => router.push(`/strategies/${strategyId}/backtests/${bt.id}`)}
          />
        ))}
      </div>

      {/* Pagination */}
      {apiBacktests && apiBacktests.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="cursor-pointer"
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground font-medium">
            Page {apiBacktests.current_page} of {apiBacktests.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(apiBacktests.total_pages, p + 1))}
            disabled={page === apiBacktests.total_pages}
            className="cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}

    </div>
  );
}
