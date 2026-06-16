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
  IconPlayerPlay,
  IconExternalLink,
  IconEdit,
  IconLoader2,
  IconActivity,
  IconCalendar,
  IconCurrencyDollar,
  IconAlertTriangle,
  IconCode,
  IconLayoutKanban,
} from "@tabler/icons-react";
import { StatusBadge, PerfDisplay } from "./strategy-badges";
import type { Strategy, StrategyActions } from "./types";
import { useRenameStrategy, useTriggerBacktest } from "@/api-actions/hooks/strategy-hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StrategyTableProps extends StrategyActions {
  strategies: Strategy[];
}

function TypeAvatar({ type }: { type: string }) {
  const isCode = type.toLowerCase().includes("code");
  return (
    <div className={cn(
      "flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
      isCode
        ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
        : "bg-primary/10 border-primary/15 text-primary"
    )}>
      {isCode
        ? <IconCode className="size-4" />
        : <IconLayoutKanban className="size-4" />
      }
    </div>
  );
}

/** Row-level actions — each row gets its own delete/edit/backtest state */
function StrategyRow({
  strat,
  onToggleLive,
  onEdit,
  onDelete,
  onRestore,
}: { strat: Strategy } & Pick<StrategyActions, "onToggleLive" | "onEdit" | "onDelete" | "onRestore">) {
  const router = useRouter();

  // Delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const handleConfirmDelete = () => { onDelete(strat.id); setDeleteOpen(false); };

  // Edit meta
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

  // Backtest — symbol/exchange/leverage resolved from DataNode by backend
  const [backtestOpen, setBacktestOpen] = useState(false);
  const [btStartDate, setBtStartDate] = useState("2024-01-01");
  const [btEndDate, setBtEndDate] = useState("2024-12-31");
  const [btCapital, setBtCapital] = useState("10000");
  const { mutateAsync: triggerBacktest, isPending: isEnqueuing } = useTriggerBacktest(strat.id);

  const handleBacktestSubmit = async () => {
    setBacktestOpen(false);
    toast.info("Starting backtest...", { description: `${btStartDate} → ${btEndDate}`, duration: 3000 });
    try {
      const result = await triggerBacktest({
        start_date: new Date(btStartDate).toISOString(),
        end_date: new Date(btEndDate).toISOString(),
        initial_capital: parseFloat(btCapital),
      });
      toast.success("Backtest completed!", {
        description: `Task ${result.task_id.slice(0, 12)}...`,
        duration: 6000,
        action: { label: "Open", onClick: () => router.push(`/workflow/${strat.id}`) },
      });
    } catch {
      toast.error("Failed to run backtest. Ensure your Data Node is configured.");
    }
  };

  return (
    <>
      <tr className="group border-b border-border/40 hover:bg-muted/20 transition-colors duration-150">
        {/* Name + description */}
        <td className="px-5 py-3.5">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push(`/strategies/${strat.id}`)}
          >
            <TypeAvatar type={strat.type} />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors leading-tight truncate max-w-[220px]">
                {strat.name}
              </span>
              <span className="text-[11px] text-muted-foreground/70 truncate max-w-[220px]">
                {strat.description || "No description"}
              </span>
            </div>
          </div>
        </td>

        {/* Type */}
        <td className="px-4 py-3.5">
          <span className={cn(
            "inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
            strat.type.toLowerCase().includes("code")
              ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
              : "bg-primary/10 border-primary/15 text-primary"
          )}>
            {strat.type}
          </span>
        </td>

        {/* Status */}
        <td className="px-4 py-3.5">
          <StatusBadge status={strat.status} />
        </td>

        {/* Created */}
        <td className="px-4 py-3.5 text-[12px] text-muted-foreground font-mono whitespace-nowrap">
          {strat.created}
        </td>

        {/* Actions */}
        <td className="px-5 py-3.5">
          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {strat.is_archived ? (
              <Button
                onClick={() => onRestore?.(strat.id)}
                size="sm"
                className="cursor-pointer h-7 text-[11px] font-bold rounded-lg gap-1 px-2.5"
              >
                <IconRocket className="size-3" /> Restore
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setBacktestOpen(true)}
                  size="sm"
                  className="cursor-pointer h-7 text-[11px] font-bold rounded-lg gap-1 px-2.5"
                >
                  <IconChartBar className="size-3" /> Backtest
                </Button>
                <Button
                  onClick={() => onToggleLive(strat.id)}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer h-7 text-[11px] font-bold rounded-lg gap-1 px-2.5"
                >
                  {strat.status === "active"
                    ? <><IconPlayerPause className="size-3" /> Pause</>
                    : <><IconRocket className="size-3" /> Go Live</>
                  }
                </Button>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent hover:border-border/50 transition-all cursor-pointer">
                  <IconDotsVertical className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
        </td>
      </tr>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <IconAlertTriangle className="size-5" /> Delete Strategy?
            </DialogTitle>
            <DialogDescription className="pt-1">
              You are about to permanently delete{" "}
              <span className="font-semibold text-foreground">&ldquo;{strat.name}&rdquo;</span>.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)} className="cursor-pointer flex-1">Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmDelete} className="cursor-pointer flex-1 gap-1.5">
              <IconTrash className="size-3.5" /> Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Meta */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconEdit className="size-4 text-primary" /> Edit Strategy Details
            </DialogTitle>
            <DialogDescription>
              Update <span className="font-semibold text-foreground">&ldquo;{strat.name}&rdquo;</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`tbl-name-${strat.id}`} className="text-xs font-semibold">Strategy Name</Label>
              <Input id={`tbl-name-${strat.id}`} value={editName} onChange={(e) => setEditName(e.target.value)}
                className="h-9 font-semibold" autoFocus onKeyDown={(e) => e.key === "Enter" && handleSaveMeta()} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`tbl-desc-${strat.id}`} className="text-xs font-semibold">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea id={`tbl-desc-${strat.id}`} value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Briefly describe your strategy logic..." className="resize-none text-sm min-h-[80px]" rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button size="sm" onClick={handleSaveMeta} disabled={isRenaming || !editName.trim()} className="cursor-pointer gap-1.5">
              {isRenaming ? <><IconLoader2 className="size-3.5 animate-spin" /> Saving...</> : <><IconActivity className="size-3.5" /> Save</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backtest Config */}
      <Dialog open={backtestOpen} onOpenChange={setBacktestOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconChartBar className="size-5 text-primary" /> Configure Backtest
            </DialogTitle>
            <DialogDescription>
              Parameters for <span className="font-semibold text-foreground">&ldquo;{strat.name}&rdquo;</span>
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
                <Label className="text-xs font-semibold flex items-center gap-1"><IconCalendar className="size-3.5 text-muted-foreground" /> Start Date</Label>
                <Input type="date" value={btStartDate} onChange={(e) => setBtStartDate(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1"><IconCalendar className="size-3.5 text-muted-foreground" /> End Date</Label>
                <Input type="date" value={btEndDate} onChange={(e) => setBtEndDate(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1"><IconCurrencyDollar className="size-3.5 text-muted-foreground" /> Initial Capital (USD)</Label>
              <Input type="number" min={100} value={btCapital} onChange={(e) => setBtCapital(e.target.value)} className="h-9 text-sm font-mono" />
            </div>
            <div className="flex items-center gap-2 bg-muted/40 border border-border/60 rounded-xl px-3 py-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Summary</span>
              <span className="text-xs font-mono text-foreground ml-auto">
                ${parseFloat(btCapital || "0").toLocaleString()} · {btStartDate} → {btEndDate}
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setBacktestOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button size="sm" onClick={handleBacktestSubmit} disabled={isEnqueuing} className="cursor-pointer gap-1.5">
              {isEnqueuing ? <><IconLoader2 className="size-3.5 animate-spin" /> Running...</> : <><IconActivity className="size-3.5" /> Run Backtest</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function StrategyTable({
  strategies,
  onBacktest,
  onToggleLive,
  onEdit,
  onDelete,
  onRestore,
}: StrategyTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm">
      <table className="w-full text-left border-collapse min-w-[780px]">
        <thead>
          <tr className="border-b border-border/60">
            <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground tracking-[0.14em] uppercase">Strategy</th>
            <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground tracking-[0.14em] uppercase">Type</th>
            <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground tracking-[0.14em] uppercase">Status</th>
            <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground tracking-[0.14em] uppercase">Created</th>
            <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground tracking-[0.14em] uppercase text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {strategies.map((strat) => (
            <StrategyRow
              key={strat.id}
              strat={strat}
              onToggleLive={onToggleLive}
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
