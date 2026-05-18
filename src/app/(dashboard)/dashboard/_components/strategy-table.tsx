import { Button } from "@/components/ui/button";
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
  IconDots,
} from "@tabler/icons-react";
import { StatusBadge, PerfDisplay } from "./strategy-badges";
import type { Strategy, StrategyActions } from "./types";

interface StrategyTableProps extends StrategyActions {
  strategies: Strategy[];
}

export function StrategyTable({
  strategies,
  onBacktest,
  onToggleLive,
  onEdit,
  onDelete,
}: StrategyTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="border-b border-border text-[10px] font-bold text-muted-foreground tracking-[0.12em] uppercase">
            <th className="px-4 py-3">Strategy</th>
            <th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-center">Created</th>
            <th className="px-4 py-3 text-center">Performance</th>
            <th className="px-4 py-3 text-center">Trades</th>
            <th className="px-4 py-3 text-center">Author</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {strategies.map((strat) => (
            <tr
              key={strat.id}
              className="hover:bg-muted/30 transition-colors group"
            >
              {/* Name cell */}
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 border border-primary/10">
                    <span className="text-[10px] font-bold text-primary">
                      {strat.type[0]}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {strat.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[250px]">
                      {strat.description}
                    </span>
                  </div>
                </div>
              </td>

              {/* Status */}
              <td className="px-4 py-3.5 text-center">
                <StatusBadge status={strat.status} />
              </td>

              {/* Created */}
              <td className="px-4 py-3.5 text-center text-xs text-muted-foreground">
                {strat.created}
              </td>

              {/* Performance */}
              <td className="px-4 py-3.5 text-center">
                <PerfDisplay value={strat.performance} />
              </td>

              {/* Trades */}
              <td className="px-4 py-3.5 text-center text-xs font-semibold text-foreground tabular-nums">
                {strat.trades.toLocaleString()}
              </td>

              {/* Author */}
              <td className="px-4 py-3.5 text-center text-xs text-muted-foreground">
                {strat.author}
              </td>

              {/* Actions */}
              <td className="px-4 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1.5">
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
                        <IconPlayerPlay data-icon="inline-start" /> Live
                      </>
                    )}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-full cursor-pointer text-muted-foreground hover:text-foreground"
                      >
                        <IconDots className="size-4" />
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
