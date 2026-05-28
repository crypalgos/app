"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useStrategies,
  useStrategyBacktests,
  useDeleteBacktest,
} from "@/api-actions/hooks/strategy-hooks";
import { toUiStrategy } from "../strategies/_components/types";
import type { ApiBacktest } from "@/api-actions/strategy-actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { Input } from "@/components/ui/input";
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
  IconSearch,
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
    <div className="flex flex-col items-center gap-1 text-center">
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
                Unavailable
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
            <IconTrendingDown className="size-5 text-destructive animate-pulse" />
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
            <span>{new Date(bt.created_at).toLocaleDateString()}</span>
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
      className="hover:border-primary/40 cursor-pointer transition-all hover:shadow-md relative group"
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
        <div className="grid grid-cols-4 gap-2 rounded-xl border border-border/50 bg-muted/30 p-3">
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
            label="Max DD"
            value={`${(m.max_drawdown ?? 0).toFixed(1)}%`}
            positive={false}
            icon={IconTrendingDown}
          />
        </div>

        {/* Capital + Leverage */}
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-[10px] text-muted-foreground font-medium">
            Capital: <span className="font-bold text-foreground">${bt.initial_capital.toLocaleString()}</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            Leverage: <span className="font-bold text-foreground">{bt.leverage}×</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            Trades: <span className="font-bold text-foreground">{m.total_trades ?? 0}</span>
          </span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(bt.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Strategy Backtests Section ───────────────────────────────────────────────

interface StrategySectionProps {
  strategyId: string;
  strategyName: string;
  exchange: string;
  symbol: string;
  onSelectBacktest: (btId: string) => void;
}

function StrategySection({
  strategyId,
  strategyName,
  exchange,
  symbol,
  onSelectBacktest,
}: StrategySectionProps) {
  const [page, setPage] = useState(1);
  const limit = 6;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [exchange, symbol]);

  const { data: apiBacktests, isLoading } = useStrategyBacktests(
    strategyId,
    page,
    limit,
    exchange || undefined,
    symbol || undefined
  );
  const { mutate: deleteBacktest } = useDeleteBacktest(strategyId);

  const handleDeleteBacktest = (backtestId: string) => {
    deleteBacktest(backtestId, {
      onSuccess: () => toast.success("Backtest run deleted successfully."),
      onError: () => toast.error("Failed to delete backtest run."),
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-[180px] rounded-xl" />
      </div>
    );
  }

  const backtests = apiBacktests?.backtests ?? [];

  if (backtests.length === 0 && page === 1) {
    if (exchange || symbol) {
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-muted-foreground/30" />
            <h3 className="text-sm font-bold text-muted-foreground">{strategyName}</h3>
            <Badge variant="outline" className="text-[9px] font-mono opacity-50">
              0 runs
            </Badge>
          </div>
          <div className="text-center py-6 text-xs text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/50">
            No runs match exchange "{exchange}" or symbol "{symbol}".
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-primary" />
        <h3 className="text-sm font-bold text-foreground">{strategyName}</h3>
        <Badge variant="outline" className="text-[9px] font-mono">
          {apiBacktests?.total ?? 0} run{apiBacktests?.total !== 1 ? "s" : ""}
        </Badge>
      </div>

      {backtests.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground bg-muted/10 rounded-xl border border-border/50">
          No runs found on this page.
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {backtests.map((bt) => (
            <BacktestCard
              key={bt.id}
              bt={bt}
              onDelete={() => handleDeleteBacktest(bt.id)}
              onClick={() => onSelectBacktest(bt.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {apiBacktests && apiBacktests.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-7 text-[10px] cursor-pointer"
          >
            Previous
          </Button>
          <span className="text-[10px] text-muted-foreground font-medium">
            Page {apiBacktests.current_page} of {apiBacktests.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(apiBacktests.total_pages, p + 1))}
            disabled={page === apiBacktests.total_pages}
            className="h-7 text-[10px] cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BacktestsPage() {
  const [strategySearch, setStrategySearch] = useState("");
  const [exchangeFilter, setExchangeFilter] = useState("");
  const [symbolFilter, setSymbolFilter] = useState("");
  const router = useRouter();

  // Fetch up to 100 strategies to render the history lists
  const { data: apiStrategies, isLoading: isLoadingStrategies } = useStrategies(1, 100, strategySearch);
  const strategies = (apiStrategies?.strategies ?? []).map(toUiStrategy);

  const handleSelectBacktest = (stratId: string, btId: string) => {
    router.push(`/backtest/${btId}?strategyId=${stratId}`);
  };

  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto w-full px-4 md:px-6 pb-20 pt-2">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/40 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </div>
          <h2 className="text-[11px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
            Backtest History
          </h2>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          All historical backtest simulations across your strategies.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl border border-border/60 bg-muted/20 backdrop-blur-sm sm:flex-row sm:items-center">
        <div className="flex-1 relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
          <Input
            type="text"
            placeholder="Filter strategies by name..."
            value={strategySearch}
            onChange={(e) => setStrategySearch(e.target.value)}
            className="pl-9 bg-background/50 border-border/50"
          />
        </div>
        <div className="w-full sm:w-48">
          <Input
            type="text"
            placeholder="Exchange (e.g. delta)"
            value={exchangeFilter}
            onChange={(e) => setExchangeFilter(e.target.value)}
            className="bg-background/50 border-border/50"
          />
        </div>
        <div className="w-full sm:w-48">
          <Input
            type="text"
            placeholder="Symbol (e.g. BTC/USDT)"
            value={symbolFilter}
            onChange={(e) => setSymbolFilter(e.target.value)}
            className="bg-background/50 border-border/50"
          />
        </div>
        {(strategySearch || exchangeFilter || symbolFilter) && (
          <Button
            variant="ghost"
            onClick={() => {
              setStrategySearch("");
              setExchangeFilter("");
              setSymbolFilter("");
            }}
            className="text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer h-9 px-3"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Strategy backtests */}
      {isLoadingStrategies ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
          ))}
        </div>
      ) : strategies.length === 0 ? (
        <Empty className="border border-dashed border-border/60 min-h-[320px]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconChartLine />
            </EmptyMedia>
            <EmptyTitle>
              {strategySearch ? "No Strategies Match" : "No Strategies Yet"}
            </EmptyTitle>
            <EmptyDescription>
              {strategySearch
                ? "Try a different strategy name filter."
                : "Create a strategy and run a backtest to see results here."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-10">
          {strategies.map((s) => (
            <StrategySection
              key={s.id}
              strategyId={s.id}
              strategyName={s.name}
              exchange={exchangeFilter}
              symbol={symbolFilter}
              onSelectBacktest={(btId) => handleSelectBacktest(s.id, btId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
