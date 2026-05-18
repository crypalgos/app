import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  IconChartLine,
  IconPlayerPlay,
  IconPlayerPause,
  IconPencil,
  IconTrash,
  IconDotsVertical,
} from "@tabler/icons-react";
import { StatusBadge, PerfDisplay } from "./strategy-badges";
import type { Strategy, StrategyActions } from "./types";

interface StrategyCardProps extends StrategyActions {
  strategy: Strategy;
}

export function StrategyCard({
  strategy: strat,
  onBacktest,
  onToggleLive,
  onEdit,
  onDelete,
}: StrategyCardProps) {
  return (
    <Card className="group flex flex-col justify-between hover:border-primary/25 transition-all hover:shadow-md">
      {/* Header: Type badge + Status + Menu */}
      <CardHeader className="gap-3 pb-2">
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className="text-[10px] uppercase tracking-wider"
          >
            {strat.type}
          </Badge>
          <div className="flex items-center gap-2">
            <StatusBadge status={strat.status} />

            {/* Context menu — visible on hover */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-full cursor-pointer text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => onEdit(strat.id)}
                  className="cursor-pointer"
                >
                  <IconPencil data-icon="inline-start" /> Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(strat.id)}
                  variant="destructive"
                  className="cursor-pointer"
                >
                  <IconTrash data-icon="inline-start" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Name + Description */}
        <div className="flex flex-col gap-1">
          <CardTitle className="text-[15px] leading-snug group-hover:text-primary transition-colors">
            {strat.name}
          </CardTitle>
          <CardDescription className="text-[11px] leading-relaxed line-clamp-2">
            {strat.description}
          </CardDescription>
        </div>
      </CardHeader>

      {/* Metrics strip */}
      <CardContent className="pt-3 pb-4">
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/50 bg-muted/30 p-3 text-center">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              Perf
            </span>
            <PerfDisplay value={strat.performance} />
          </div>
          <div className="flex flex-col items-center gap-0.5 border-x border-border/40">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              Trades
            </span>
            <span className="text-xs font-bold text-foreground tabular-nums">
              {strat.trades.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              Created
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">
              {strat.created}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Action buttons */}
      <CardFooter className="pt-0">
        <div className="grid w-full grid-cols-2 gap-2">
          <Button
            onClick={() => onBacktest(strat.id)}
            size="sm"
            className="cursor-pointer"
          >
            <IconChartLine data-icon="inline-start" /> Backtest
          </Button>
          <Button
            onClick={() => onToggleLive(strat.id)}
            variant="outline"
            size="sm"
            className="cursor-pointer"
          >
            {strat.status === "active" ? (
              <>
                <IconPlayerPause data-icon="inline-start" /> Pause
              </>
            ) : (
              <>
                <IconPlayerPlay data-icon="inline-start" /> Go Live
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
