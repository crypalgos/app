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
} from "@tabler/icons-react";
import { StatusBadge } from "./strategy-badges";
import type { Strategy, StrategyActions } from "./types";
import { useRenameStrategy, useTriggerBacktest } from "@/api-actions/hooks/strategy-hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
}: StrategyCardProps) {
  const router = useRouter();

  // ── Edit meta dialog ─────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(strat.name);
  const [editDesc, setEditDesc] = useState(strat.description);
  const { mutateAsync: renameStrategy, isPending: isRenaming } = useRenameStrategy();

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

  return (
    <>
      {/* ─── Card ─────────────────────────────────────────────────────────── */}
      <div
        onClick={() => onEdit(strat.id)}
        className={cn(
          "group relative flex flex-col rounded-2xl border bg-gradient-to-br transition-all duration-300 cursor-pointer select-none",
          "hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          getAccentClasses(strat.type)
        )}
      >
        {/* Top row: type badge + status + menu */}
        <div className="flex items-center justify-between px-4 pt-4 pb-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border/60 bg-muted/40 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {getTypeIcon(strat.type)}
            <span className="ml-0.5">{strat.type}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={strat.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="size-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                  <IconDotsVertical className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onClick={() => { setEditName(strat.name); setEditDesc(strat.description); setEditOpen(true); }}
                  className="cursor-pointer"
                >
                  <IconEdit className="size-3.5 mr-2" /> Edit Name & Description
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(strat.id)} className="cursor-pointer">
                  <IconExternalLink className="size-3.5 mr-2" /> Open Builder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  variant="destructive"
                  className="cursor-pointer"
                >
                  <IconTrash className="size-3.5 mr-2" /> Delete Strategy
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Name + Description */}
        <div className="px-4 pt-3 pb-4">
          <h3 className="font-bold text-[15px] leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {strat.name}
          </h3>
          <p className="text-[11px] text-muted-foreground/80 leading-relaxed line-clamp-2 mt-1 min-h-[32px]">
            {strat.description || "No description yet — open the builder and double-click the Start Node to add one."}
          </p>

          {/* Created date inline — minimal */}
          <p className="text-[10px] text-muted-foreground/50 mt-2 font-mono">
            Created {strat.created}
          </p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 px-4 pb-4" onClick={(e) => e.stopPropagation()}>
          <Button
            onClick={() => setBacktestOpen(true)}
            size="sm"
            className="cursor-pointer font-bold text-xs h-9 rounded-xl"
          >
            <IconChartBar className="size-3.5 mr-1.5" /> Backtest
          </Button>
          <Button
            onClick={() => onToggleLive(strat.id)}
            variant="outline"
            size="sm"
            className="cursor-pointer font-bold text-xs h-9 rounded-xl"
          >
            {strat.status === "active" ? (
              <><IconPlayerPause className="size-3.5 mr-1.5" /> Pause</>
            ) : (
              <><IconRocket className="size-3.5 mr-1.5" /> Go Live</>
            )}
          </Button>
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
