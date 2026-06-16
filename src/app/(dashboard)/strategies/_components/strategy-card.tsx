"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  IconChartBar,
  IconRocket,
  IconTrash,
  IconDotsVertical,
  IconPlayerPause,
  IconCalendar,
  IconCurrencyDollar,
  IconActivity,
  IconLoader2,
  IconEdit,
  IconExternalLink,
  IconCode,
  IconLayoutKanban,
  IconAlertTriangle,
  IconStar,
  IconStarFilled,
} from "@tabler/icons-react";
import { StatusBadge } from "./strategy-badges";
import type { Strategy, StrategyActions } from "./types";
import { useRenameStrategy, useTriggerBacktest, useSetGoldenVersion } from "@/api-actions/hooks/strategy-hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface StrategyCardProps extends StrategyActions {
  strategy: Strategy;
}

function getAccentClasses(type: string) {
  if (type.toLowerCase().includes("code"))
    return "from-violet-500/10 to-violet-500/5 border-violet-500/20 hover:border-violet-500/40";
  return "from-primary/8 to-primary/4 border-primary/15 hover:border-primary/35";
}

function getTypeIcon(type: string) {
  if (type.toLowerCase().includes("code"))
    return <IconCode className="size-3.5 text-violet-400" />;
  return <IconLayoutKanban className="size-3.5 text-primary" />;
}

export function StrategyCard({
  strategy: strat,
  onBacktest,
  onToggleLive,
  onEdit,
  onDelete,
  onRestore,
}: StrategyCardProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(strat.is_golden || false);

  // ── Edit meta dialog ─────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(strat.name);
  const [editDesc, setEditDesc] = useState(strat.description);
  const { mutateAsync: renameStrategy, isPending: isRenaming } = useRenameStrategy();
  const { mutateAsync: setGolden } = useSetGoldenVersion();

  const handleSaveMeta = async () => {
    if (!editName.trim()) return;
    try {
      await renameStrategy({ strategyId: strat.id, name: editName.trim(), description: editDesc });
      toast.success("Strategy updated.");
      setEditOpen(false);
    } catch {
      toast.error("Failed to update strategy.");
    }
  };

  // ── Delete confirmation dialog ───────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleConfirmDelete = () => {
    onDelete(strat.id);
    setDeleteOpen(false);
  };

  // ── Backtest config dialog ───────────────────────────────────────────────
  const [backtestOpen, setBacktestOpen] = useState(false);
  const [btStartDate, setBtStartDate] = useState("2024-01-01");
  const [btEndDate, setBtEndDate] = useState("2024-12-31");
  const [btCapital, setBtCapital] = useState("10000");

  const { mutateAsync: triggerBacktest, isPending: isEnqueuing } = useTriggerBacktest(strat.id);

  const handleBacktestSubmit = async () => {
    setBacktestOpen(false);
    toast.info("Starting backtest...", {
      description: `${btStartDate} → ${btEndDate} · $${parseFloat(btCapital).toLocaleString()} capital`,
      duration: 3000,
    });
    try {
      const result = await triggerBacktest({
        start_date: new Date(btStartDate).toISOString(),
        end_date: new Date(btEndDate).toISOString(),
        initial_capital: parseFloat(btCapital),
      });
      toast.success("Backtest completed!", {
        description: `Task ${result.task_id.slice(0, 12)}... — Open strategy to see results.`,
        duration: 6000,
        action: { label: "Open", onClick: () => router.push(`/workflow/${strat.id}`) },
      });
    } catch {
      toast.error("Failed to run backtest. Ensure your Data Node is configured.");
    }
  };

  const dataNode = strat.canvas_json?.nodes?.find((n: any) => n.type === "dataNode");
  const symbol = (dataNode?.data as any)?.symbol || "BTCUSD";
  const timeframe = (dataNode?.data as any)?.timeframe || "1H";

  return (
    <>
      {/* ─── Card ─────────────────────────────────────────────────────────── */}
      <div
        onClick={() => router.push(`/strategies/${strat.id}`)}
        className={cn(
          "group relative flex flex-col rounded-2xl border bg-card/30 backdrop-blur-xs transition-all duration-300 cursor-pointer select-none overflow-hidden",
          "hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border-border/50 hover:border-primary/40",
          getAccentClasses(strat.type)
        )}
      >
        {/* Top row: Favorite + Title + Menu */}
        <div className="flex items-start justify-between px-4 pt-4">
          <div className="flex items-center gap-2 min-w-0">
            <button 
              onClick={async (e) => {
                e.stopPropagation();
                const targetState = !isFavorite;
                setIsFavorite(targetState);
                try {
                  await setGolden({ strategyId: strat.id, version: strat.current_version || 0 });
                  toast.success(targetState ? "Golden version set." : "Golden version removed.");
                } catch {
                  setIsFavorite(!targetState);
                  toast.error("Failed to update golden version.");
                }
              }}
              className="p-1 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-amber-500 cursor-pointer shrink-0"
            >
              {isFavorite ? (
                <IconStarFilled className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <IconStar className="w-3.5 h-3.5" />
              )}
            </button>
            <h3 className="font-bold text-[15px] leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-1 truncate">
              {strat.name}
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
              v1.0
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {strat.is_golden && (
              <span className="font-bold text-[9px] py-0.5 px-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md shrink-0">
                Golden
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="size-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                  <IconDotsVertical className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                {strat.is_archived ? (
                  <DropdownMenuItem onClick={() => onRestore?.(strat.id)} className="cursor-pointer">
                    <IconRocket className="size-3.5 mr-2 text-emerald-500" /> Restore Strategy
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem
                      onClick={() => { setEditName(strat.name); setEditDesc(strat.description); setEditOpen(true); }}
                      className="cursor-pointer"
                    >
                      <IconEdit className="size-3.5 mr-2" /> Edit Name & Description
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(strat.id)} className="cursor-pointer">
                      <IconExternalLink className="size-3.5 mr-2" /> Open Builder
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  variant="destructive"
                  className="cursor-pointer"
                >
                  <IconTrash className="size-3.5 mr-2" /> {strat.is_archived ? "Permanently Delete" : "Delete Strategy"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Description */}
        {strat.description && (
          <p className="px-4 pt-1 text-xs text-muted-foreground/85 line-clamp-2 leading-relaxed">
            {strat.description}
          </p>
        )}

        {/* Subheader: Type • Symbol • Timeframe */}
        <div className="flex items-center gap-1.5 px-4 pt-1.5 text-xs text-muted-foreground">
          <span>{strat.type}</span>
          <span>•</span>
          <span>{symbol}</span>
          <span>•</span>
          <span>{timeframe}</span>
        </div>

        {/* Performance metrics row */}
        <div className="grid grid-cols-3 gap-2 px-4 pt-4">
          <div>
            <div className="text-base font-bold text-emerald-500">
              {strat.latest_metrics?.return_pct !== undefined ? `${strat.latest_metrics.return_pct > 0 ? "+" : ""}${strat.latest_metrics.return_pct.toFixed(1)}%` : "--"}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Return</div>
          </div>
          <div>
            <div className="text-base font-bold text-foreground">
              {strat.latest_metrics?.sharpe !== undefined && strat.latest_metrics.sharpe !== null ? strat.latest_metrics.sharpe.toFixed(2) : "--"}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Sharpe</div>
          </div>
          <div>
            <div className="text-base font-bold text-rose-500">
              {strat.latest_metrics?.drawdown !== undefined ? `${strat.latest_metrics.drawdown.toFixed(1)}%` : "--"}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Max DD</div>
          </div>
        </div>

        {/* Mini Equity Curve Graph */}
        <div className="h-28 px-4 pt-4 relative">
          {strat.equity_preview && strat.equity_preview.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={strat.equity_preview.map(([time, value]) => ({ value }))}>
                <defs>
                  <linearGradient id={`colorPreview-${strat.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill={`url(#colorPreview-${strat.id})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-100 h-100 flex items-center justify-center border border-dashed border-border/40 rounded-lg text-[10px] text-muted-foreground/50">
              No equity curve preview
            </div>
          )}
        </div>

        {/* Updated timestamp */}
        <div className="px-4 pt-3 text-[10px] text-muted-foreground/40 font-medium">
          Updated recently
        </div>

        {/* Button to open or restore strategy */}
        <div className="p-4 mt-auto flex gap-2">
          {strat.is_archived ? (
            <>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore?.(strat.id);
                }}
                className="flex-1 text-xs font-bold h-9 rounded-xl cursor-pointer"
              >
                Restore Strategy
              </Button>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/strategies/${strat.id}`);
                }}
                className="text-xs font-bold h-9 px-3 rounded-xl cursor-pointer shrink-0"
              >
                <IconExternalLink className="size-3.5" />
              </Button>
            </>
          ) : (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/strategies/${strat.id}`);
              }}
              className="w-full text-xs font-bold h-9 rounded-xl cursor-pointer"
            >
              Open Strategy
            </Button>
          )}
        </div>
      </div>


      {/* ─── Delete Confirmation Dialog ───────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <IconAlertTriangle className="size-5" />
              Delete Strategy?
            </DialogTitle>
            <DialogDescription className="pt-1">
              You are about to permanently delete{" "}
              <span className="font-semibold text-foreground">&ldquo;{strat.name}&rdquo;</span>.
              This action cannot be undone. All nodes, edges, and compiled code will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)} className="cursor-pointer flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              className="cursor-pointer flex-1 gap-1.5"
            >
              <IconTrash className="size-3.5" /> Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Name & Description Dialog ──────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconEdit className="size-4 text-primary" />
              Edit Strategy Details
            </DialogTitle>
            <DialogDescription>
              Update the name and description for{" "}
              <span className="font-semibold text-foreground">&ldquo;{strat.name}&rdquo;</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`edit-name-${strat.id}`} className="text-xs font-semibold">
                Strategy Name
              </Label>
              <Input
                id={`edit-name-${strat.id}`}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. BTC Volatility Mean Reversion"
                className="h-9 font-semibold"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveMeta()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`edit-desc-${strat.id}`} className="text-xs font-semibold">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id={`edit-desc-${strat.id}`}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Briefly describe trading logic, signals, and risk approach..."
                className="resize-none text-sm min-h-[80px]"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveMeta}
              disabled={isRenaming || !editName.trim()}
              className="cursor-pointer gap-1.5"
            >
              {isRenaming ? (
                <><IconLoader2 className="size-3.5 animate-spin" /> Saving...</>
              ) : (
                <><IconActivity className="size-3.5" /> Save Changes</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Backtest Config Dialog ────────────────────────────────────────── */}
      <Dialog open={backtestOpen} onOpenChange={setBacktestOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconChartBar className="size-5 text-primary" />
              Configure Backtest
            </DialogTitle>
            <DialogDescription>
              Simulation parameters for{" "}
              <span className="font-semibold text-foreground">&ldquo;{strat.name}&rdquo;</span>.
              Runs asynchronously in a secure sandbox.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Info Banner */}
            <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5">
              <IconChartBar className="size-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Symbol, exchange and leverage</span> are read from your{" "}
                <span className="font-semibold text-foreground">Data Node</span> configuration automatically.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`bt-start-${strat.id}`} className="text-xs font-semibold flex items-center gap-1">
                  <IconCalendar className="size-3.5 text-muted-foreground" /> Start Date
                </Label>
                <Input id={`bt-start-${strat.id}`} type="date" value={btStartDate} onChange={(e) => setBtStartDate(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`bt-end-${strat.id}`} className="text-xs font-semibold flex items-center gap-1">
                  <IconCalendar className="size-3.5 text-muted-foreground" /> End Date
                </Label>
                <Input id={`bt-end-${strat.id}`} type="date" value={btEndDate} onChange={(e) => setBtEndDate(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`bt-capital-${strat.id}`} className="text-xs font-semibold flex items-center gap-1">
                <IconCurrencyDollar className="size-3.5 text-muted-foreground" /> Initial Capital (USD)
              </Label>
              <Input id={`bt-capital-${strat.id}`} type="number" min={100} value={btCapital} onChange={(e) => setBtCapital(e.target.value)} className="h-9 text-sm font-mono" />
            </div>
            {/* Summary */}
            <div className="flex items-center gap-2 bg-muted/40 border border-border/60 rounded-xl px-3 py-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Summary</span>
              <span className="text-xs font-mono text-foreground ml-auto">
                ${parseFloat(btCapital || "0").toLocaleString()} · {btStartDate} → {btEndDate}
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setBacktestOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button size="sm" onClick={handleBacktestSubmit} disabled={isEnqueuing} className="cursor-pointer gap-1.5">
              {isEnqueuing ? (
                <><IconLoader2 className="size-3.5 animate-spin" /> Enqueueing...</>
              ) : (
                <><IconActivity className="size-3.5" /> Run Backtest</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
