"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconArrowLeft,
  IconCode,
  IconLayout,
  IconColumns,
  IconCloud,
  IconLoader2,
  IconCloudUpload,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNodesStore } from "../../store/nodes-store";
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
import { toast } from "sonner";
import { useSaveCode, useTriggerBacktest, useUpdateCanvas } from "@/api-actions/hooks/strategy-hooks";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import ProfileDropdown from "@/components/kokonutui/profile-dropdown";
import { useUser } from "@/api-actions/hooks/user-hooks";
import { useAuthStore } from "@/store/auth-store";
import { Loader2 } from "lucide-react";

interface SubNavProps {
  strategyId: string;
}

export default function SubNav({ strategyId }: SubNavProps) {
  const {
    isSynced,
    setIsBacktesting,
    isSaving,
    nodes,
    strategyName,
    strategyDescription,
    isCodeModified,
    setStrategyMeta,
    setBacktestTaskId,
    activeView,
    setActiveView,
  } = useNodesStore();

  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const [backtestOpen, setBacktestOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingView, setPendingView] = useState<string | null>(null);

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
    const newName = tempName.trim() || strategyName;
    if (strategyId && (newName !== strategyName)) {
      setStrategyMeta(strategyId, newName, strategyDescription, isCodeModified);
    }
    setIsEditing(false);
  };

  const handleNameCancel = () => setIsEditing(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleNameSubmit();
    else if (e.key === "Escape") handleNameCancel();
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



  const { data: user } = useUser();
  const { isAuthenticated } = useAuthStore();

  const isSyncBusy = isSavingCode || isSavingCanvas || isSaving;

  return (
    <>
      {/* Outer bar — position:relative so we can absolute-center the toggle */}
      <div className="fixed top-0 left-0 right-0 h-[68px] bg-background/85 dark:bg-background/80 backdrop-blur-md border-b border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] z-40 transition-all duration-300">

        {/* ─── LEFT: Back + Logo + Editable Title ─── */}
        <div className="absolute left-0 top-0 bottom-0 flex items-center gap-3 pl-6 max-w-[42%] min-w-0">
          <Link href="/strategies">
            <button className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer shadow-xs">
              <IconArrowLeft className="size-4" />
            </button>
          </Link>

          {/* Brand Logo */}
          <div className="shrink-0 flex items-center p-1">
            <Image src="/favicon.svg" alt="Logo" width={26} height={26} className="h-7 w-7 select-none pointer-events-none" />
          </div>

          <div className="flex flex-col min-w-0 select-none">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleNameSubmit}
                  onKeyDown={handleKeyDown}
                  className="h-7 w-[160px] text-sm font-bold text-foreground bg-muted/60 border border-sidebar-primary/45 rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-sidebar-primary focus:border-sidebar-primary transition-all font-sans"
                  spellCheck="false"
                />
              ) : (
                <div
                  onClick={handleNameClick}
                  className="flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 rounded-lg py-0.5 px-1.5 -ml-1.5 transition-all group min-w-0"
                >
                  <h1 className="font-extrabold text-[15px] tracking-tight leading-none text-foreground group-hover:text-sidebar-primary truncate max-w-[200px]">
                    {strategyName}
                  </h1>
                  <IconCloud className="size-3.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              )}

              {isCodeModified && (
                <Badge className="text-[9px] py-0 px-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold tracking-wide shrink-0">
                  Custom
                </Badge>
              )}

              {/* Cloud sync status */}
              <div className="flex items-center select-none shrink-0">
                {isSyncBusy ? (
                  <span title="Auto-saving..." className="p-1 rounded-full text-amber-500 bg-amber-500/5">
                    <IconLoader2 className="size-3.5 animate-spin" />
                  </span>
                ) : !isSynced ? (
                  <span title="Unsaved changes — saving automatically..." className="p-1 rounded-full text-amber-500 animate-pulse">
                    <IconCloudUpload className="size-3.5" />
                  </span>
                ) : (
                  <span title="All changes saved ✓" className="p-1 rounded-full text-emerald-500">
                    <IconCloud className="size-3.5" />
                  </span>
                )}
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground/70 mt-0.5 truncate font-medium">
              {`${nodes.length} logic blocks`}
            </span>
          </div>
        </div>

        {/* ─── CENTER: Segmented View Mode Controller ─── */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex p-0.5 bg-muted/60 border border-border/80 rounded-full shadow-xs">
            <button
              onClick={() => {
                if (isCodeModified && activeView === "code") {
                  setPendingView("canvas");
                  setConfirmOpen(true);
                } else {
                  setActiveView("canvas");
                }
              }}
              className={cn(
                "flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none border border-transparent",
                activeView === "canvas"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <IconLayout className="size-3.5" />
              <span>Canvas</span>
            </button>

            <button
              onClick={() => {
                if (isCodeModified && activeView === "code") {
                  setPendingView("both");
                  setConfirmOpen(true);
                } else {
                  setActiveView("both");
                }
              }}
              className={cn(
                "flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none border border-transparent",
                activeView === "both"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <IconColumns className="size-3.5" />
              <span>Both</span>
            </button>

            <button
              onClick={() => setActiveView("code")}
              className={cn(
                "flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none border border-transparent",
                activeView === "code"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <IconCode className="size-3.5" />
              <span>Code</span>
            </button>
          </div>
        </div>

        {/* ─── RIGHT: Theme toggle + Profile ─── */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-6 shrink-0">
          <ThemeToggle className="scale-90" />
          {user ? (
            <ProfileDropdown className="scale-95 origin-right" />
          ) : isAuthenticated ? (
            <div className="w-8 h-8 flex items-center justify-center">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground/60" />
            </div>
          ) : null}
        </div>

      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="sm:max-w-[440px] border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl rounded-2xl p-6">
          <AlertDialogHeader className="gap-2.5 select-none flex flex-col items-start">
            <div className="flex size-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-xs">
              <IconAlertTriangle className="size-5" />
            </div>
            <AlertDialogTitle className="text-[17px] font-extrabold tracking-tight text-foreground leading-snug">
              Confirm Visual Switch
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground/80 font-medium leading-relaxed mt-1 text-left">
              {pendingView === "both"
                ? "Warning: Exposing the canvas in split-screen mode will allow block-editing. Any block action will overwrite your custom Python code. You will lose all manual changes. Do you want to proceed?"
                : "Warning: Leaving the code-only editor will allow block-editing. Any block action will overwrite your custom Python code. You will lose all manual changes. Do you want to proceed?"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6 flex flex-row items-center justify-end gap-2.5">
            <AlertDialogCancel
              onClick={() => setConfirmOpen(false)}
              className="h-9.5 px-5 rounded-full border border-border text-xs font-bold hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all duration-200 shadow-xs"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingView) {
                  setActiveView(pendingView);
                }
                setConfirmOpen(false);
              }}
              className="h-9.5 px-5 rounded-full text-xs font-bold bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-md shadow-red-950/20 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200 border-0"
            >
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

