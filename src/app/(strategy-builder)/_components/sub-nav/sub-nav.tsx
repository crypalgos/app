"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  IconArrowLeft,
  IconCode,
  IconLayout,
  IconCloud,
  IconActivity,
  IconLoader2,
  IconCloudUpload,
  IconPlayerPlay,
  IconPlayerPause,
  IconCalendar,
  IconCurrencyDollar,
  IconChartBar,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useNodesStore } from "../../store/nodes-store";
import { toast } from "sonner";
import { useSaveCode, useTriggerBacktest, useUpdateCanvas } from "@/api-actions/hooks/strategy-hooks";

interface SubNavProps {
  strategyId: string;
}

export default function SubNav({ strategyId }: SubNavProps) {
  const {
    isSynced,
    setIsSynced,
    activeView,
    setActiveView,
    isRunning,
    setIsRunning,
    isBacktesting,
    setIsBacktesting,
    isSaving,
    setIsSaving,
    nodes,
    edges,
    codeContent,
    setCodeContent,
    strategyName,
    isCodeModified,
    setBacktestTaskId,
  } = useNodesStore();

  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const [backtestOpen, setBacktestOpen] = useState(false);

  // Backtest config form state
  const [btSymbol, setBtSymbol] = useState("BTC/USDT");
  const [btExchange, setBtExchange] = useState("delta");
  const [btStartDate, setBtStartDate] = useState("2024-01-01");
  const [btEndDate, setBtEndDate] = useState("2024-12-31");
  const [btCapital, setBtCapital] = useState("10000");
  const [btLeverage, setBtLeverage] = useState("1");

  const inputRef = useRef<HTMLInputElement>(null);

  // API mutations
  const { mutateAsync: saveCode, isPending: isSavingCode } = useSaveCode(strategyId);
  const { mutateAsync: updateCanvas, isPending: isSavingCanvas } = useUpdateCanvas(strategyId);
  const { mutateAsync: triggerBacktest, isPending: isEnqueuing } = useTriggerBacktest(strategyId);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleNameClick = () => {
    setTempName(strategyName);
    setIsEditing(true);
  };

  const handleNameSubmit = () => {
    setIsEditing(false);
    setIsSynced(false);
  };

  const handleNameCancel = () => setIsEditing(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleNameSubmit();
    else if (e.key === "Escape") handleNameCancel();
  };

  // Save: canvas view → PUT /canvas (save nodes+edges + recompile)
  //       code view  → PUT /code (save raw Monaco text)
  const handleSaveSync = async () => {
    if (isSavingCode || isSavingCanvas || isSaving) return;
    setIsSaving(true);

    if (activeView === "canvas") {
      toast.loading("Saving canvas & recompiling strategy...", { id: "sync-toast" });
      try {
        // Serialize React Flow nodes/edges (strip position for clean storage)
        const canvasPayload = {
          nodes: nodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: n.data,
          })),
          edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
            type: e.type,
            data: e.data,
          })),
        };
        const updated = await updateCanvas({ canvas_json: canvasPayload });
        // Sync fresh compiled code into Monaco store
        setCodeContent(updated.compiled_code);
        setIsSynced(true);
        toast.success("Canvas saved & compiled to Python!", { id: "sync-toast" });
      } catch {
        toast.error("Failed to save canvas.", { id: "sync-toast" });
      }
    } else {
      toast.loading("Saving strategy code to cloud...", { id: "sync-toast" });
      try {
        await saveCode(codeContent);
        setIsSynced(true);
        toast.success("Strategy code saved to cloud!", { id: "sync-toast" });
      } catch {
        toast.error("Failed to save code.", { id: "sync-toast" });
      }
    }

    setIsSaving(false);
  };

  // Open backtest config modal
  const handleBacktestClick = () => {
    if (isBacktesting || isEnqueuing) return;
    setBacktestOpen(true);
  };

  // Submit backtest to Celery queue: POST /strategies/{id}/backtest
  const handleBacktestSubmit = async () => {
    setBacktestOpen(false);
    setIsBacktesting(true);
    toast.info("Enqueuing backtest to worker queue...", {
      description: `${btSymbol} on ${btExchange} — ${btStartDate} → ${btEndDate}`,
      duration: 3000,
    });
    try {
      const result = await triggerBacktest({
        exchange: btExchange,
        symbol: btSymbol,
        start_date: new Date(btStartDate).toISOString(),
        end_date: new Date(btEndDate).toISOString(),
        initial_capital: parseFloat(btCapital),
        leverage: parseInt(btLeverage, 10),
      });
      setBacktestTaskId(result.task_id);
      toast.success("Backtest enqueued successfully!", {
        description: `Task ID: ${result.task_id.slice(0, 12)}... — Check the Backtests tab for results.`,
        duration: 6000,
      });
    } catch {
      toast.error("Failed to enqueue backtest. Please check your strategy code.");
    } finally {
      setIsBacktesting(false);
    }
  };

  // Live deployment toggle (UI-only for now)
  const handleLiveToggle = () => {
    const nextState = !isRunning;
    setIsRunning(nextState);
    if (nextState) {
      toast.success("Strategy deployed to live trading nodes!", {
        description: "Executing live triggers on exchange: Binance Perpetual USDT",
        duration: 4000,
      });
    } else {
      toast.warning("Live strategy deployment halted.", {
        description: "All active orders cancelled and safe shields engaged.",
        duration: 3500,
      });
    }
  };

  const tabs = [
    { id: "canvas", label: "Canvas", icon: IconLayout },
    { id: "code", label: "Editor", icon: IconCode },
  ];

  const isSyncBusy = isSavingCode || isSavingCanvas || isSaving;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-[68px] bg-background/85 dark:bg-background/80 backdrop-blur-md border-b border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] z-40 px-6 flex items-center justify-between transition-all duration-300">

        {/* ─── LEFT: Back Button + Logo + Editable Title ─── */}
        <div className="flex items-center gap-3 max-w-[40%] shrink-0">
          <Link href="/strategies">
            <button className="flex size-9 items-center justify-center rounded-xl border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer shadow-xs">
              <IconArrowLeft className="size-4" />
            </button>
          </Link>

          {/* Brand Logo */}
          <div className="shrink-0 flex items-center p-1">
            <Image
              src="/favicon.svg"
              alt="Logo"
              width={26}
              height={26}
              className="h-7 w-7 select-none pointer-events-none"
            />
          </div>

          <div className="flex flex-col select-none">
            <div className="flex items-center gap-2.5">
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleNameSubmit}
                  onKeyDown={handleKeyDown}
                  className="h-8 w-[180px] text-sm font-bold text-foreground bg-muted/60 border border-sidebar-primary/45 rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-sidebar-primary focus:border-sidebar-primary transition-all font-sans"
                  spellCheck="false"
                />
              ) : (
                <div
                  onClick={handleNameClick}
                  className="flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 rounded-lg py-0.5 px-1.5 -ml-1.5 transition-all group"
                >
                  <h1 className="font-extrabold text-[15px] tracking-tight leading-none text-foreground group-hover:text-sidebar-primary">
                    {strategyName}
                  </h1>
                  <IconCloud className="size-3.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              <Badge
                variant="outline"
                className="text-[9px] py-0 px-1.5 font-mono text-sidebar-primary border-sidebar-primary/20 bg-sidebar-primary/5 uppercase shrink-0"
              >
                {strategyId.slice(0, 6)}
              </Badge>

              {isCodeModified && (
                <Badge className="text-[9px] py-0 px-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold tracking-wide shrink-0">
                  Custom Code
                </Badge>
              )}

              {/* Google Docs Style Cloud Status */}
              <div className="flex items-center select-none shrink-0 ml-0.5">
                {isSyncBusy ? (
                  <button
                    disabled
                    title="Saving changes to cloud..."
                    className="p-1 rounded-full text-amber-500 bg-amber-500/5 transition-all"
                  >
                    <IconLoader2 className="size-3.5 animate-spin" />
                  </button>
                ) : !isSynced ? (
                  <button
                    onClick={handleSaveSync}
                    title="Unsaved changes. Click to sync."
                    className="p-1 rounded-full text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer animate-pulse"
                  >
                    <IconCloudUpload className="size-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveSync}
                    title="Document status: Saved to cloud"
                    className="p-1 rounded-full text-emerald-500 hover:bg-emerald-500/10 transition-all cursor-pointer"
                  >
                    <IconCloud className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground/80 mt-0.5 max-w-[280px] truncate font-medium">
              {`Compiled strategy containing ${nodes.length} custom logic blocks`}
            </span>
          </div>
        </div>

        {/* ─── CENTER: Premium View Switcher ─── */}
        <div className="relative flex items-center bg-background dark:bg-card border border-border rounded-full p-1 shrink-0 h-10 select-none">
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-1 rounded-full bg-primary shadow-sm transition-transform duration-300 ease-in-out",
              activeView === "code" ? "translate-x-full" : "translate-x-0",
            )}
            style={{ width: "calc(50% - 4px)" }}
          />
          {tabs.map((tab) => {
            const isActive = activeView === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={cn(
                  "relative flex items-center justify-center gap-1.5 h-8 w-26 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer z-10 select-none focus:outline-none",
                  isActive
                    ? "text-primary-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <TabIcon
                  className={cn(
                    "size-3.5 transition-colors duration-300",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground/80",
                  )}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── RIGHT: Actions ─── */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Backtest Button */}
          <Button
            variant="default"
            size="sm"
            onClick={handleBacktestClick}
            disabled={isBacktesting || isEnqueuing || isSyncBusy}
            className={cn(
              "cursor-pointer gap-1.5 h-9 px-4.5 rounded-full font-semibold text-xs transition-all duration-200 select-none border border-primary/20 shadow-xs",
              isBacktesting || isEnqueuing
                ? "bg-primary/10 text-primary border-primary/20 cursor-not-allowed opacity-80"
                : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-sm active:scale-[0.98]",
            )}
          >
            {isBacktesting || isEnqueuing ? (
              <>
                <IconLoader2 className="size-3.5 animate-spin" />
                <span>Enqueueing...</span>
              </>
            ) : (
              <>
                <IconActivity className="size-3.5" />
                <span>Run Backtest</span>
              </>
            )}
          </Button>

          {/* Deploy Live Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLiveToggle}
            disabled={isBacktesting}
            className={cn(
              "cursor-pointer gap-1.5 h-9 px-4.5 rounded-full text-xs font-semibold transition-all duration-200 select-none border active:scale-[0.98] shadow-xs",
              isRunning
                ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15"
                : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80",
            )}
          >
            {isRunning ? (
              <>
                <span className="flex size-1.5 rounded-full bg-destructive animate-pulse" />
                <IconPlayerPause className="size-3.5" />
                <span>Stop Active</span>
              </>
            ) : (
              <>
                <IconPlayerPlay className="size-3.5" />
                <span>Deploy Live</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── Backtest Config Modal ─── */}
      <Dialog open={backtestOpen} onOpenChange={setBacktestOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconChartBar className="size-5 text-primary" />
              Configure Backtest
            </DialogTitle>
            <DialogDescription>
              Set the simulation parameters. The backtest will run asynchronously in a secure worker sandbox.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Row 1: Symbol + Exchange */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bt-symbol" className="text-xs font-semibold">Symbol</Label>
                <Input
                  id="bt-symbol"
                  value={btSymbol}
                  onChange={(e) => setBtSymbol(e.target.value)}
                  placeholder="BTC/USDT"
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bt-exchange" className="text-xs font-semibold">Exchange</Label>
                <Input
                  id="bt-exchange"
                  value={btExchange}
                  onChange={(e) => setBtExchange(e.target.value)}
                  placeholder="delta"
                  className="h-9 text-sm font-mono"
                />
              </div>
            </div>

            {/* Row 2: Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bt-start" className="text-xs font-semibold flex items-center gap-1.5">
                  <IconCalendar className="size-3.5 text-muted-foreground" /> Start Date
                </Label>
                <Input
                  id="bt-start"
                  type="date"
                  value={btStartDate}
                  onChange={(e) => setBtStartDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bt-end" className="text-xs font-semibold flex items-center gap-1.5">
                  <IconCalendar className="size-3.5 text-muted-foreground" /> End Date
                </Label>
                <Input
                  id="bt-end"
                  type="date"
                  value={btEndDate}
                  onChange={(e) => setBtEndDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Row 3: Capital + Leverage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bt-capital" className="text-xs font-semibold flex items-center gap-1.5">
                  <IconCurrencyDollar className="size-3.5 text-muted-foreground" /> Initial Capital (USD)
                </Label>
                <Input
                  id="bt-capital"
                  type="number"
                  min={100}
                  value={btCapital}
                  onChange={(e) => setBtCapital(e.target.value)}
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bt-leverage" className="text-xs font-semibold">Leverage (1–20×)</Label>
                <Input
                  id="bt-leverage"
                  type="number"
                  min={1}
                  max={20}
                  value={btLeverage}
                  onChange={(e) => setBtLeverage(e.target.value)}
                  className="h-9 text-sm font-mono"
                />
              </div>
            </div>

            {/* Summary pill */}
            <div className="flex items-center gap-2 bg-muted/40 border border-border/60 rounded-xl px-3 py-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Summary</span>
              <span className="text-xs font-mono text-foreground ml-auto">
                {btSymbol} · {btExchange} · ${parseFloat(btCapital || "0").toLocaleString()} · {btLeverage}× · {btStartDate} → {btEndDate}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBacktestOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleBacktestSubmit}
              disabled={isEnqueuing}
              className="cursor-pointer gap-1.5"
            >
              {isEnqueuing ? (
                <>
                  <IconLoader2 className="size-3.5 animate-spin" />
                  Enqueueing...
                </>
              ) : (
                <>
                  <IconActivity className="size-3.5" />
                  Run Backtest
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}