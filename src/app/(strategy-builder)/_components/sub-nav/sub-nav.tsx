"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  IconArrowLeft,
  IconCpu,
  IconDeviceFloppy,
  IconCheck,
  IconPlayerPlay,
  IconPlayerPause,
  IconCode,
  IconLayout,
  IconCloud,
  IconActivity,
  IconLoader2,
  IconCloudUpload
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNodesStore } from "../../store/nodes-store";
import { toast } from "sonner";

interface SubNavProps {
  workflowId?: string;
  templateId?: string | null;
}

export default function SubNav({
  workflowId = "new-strat",
  templateId,
}: SubNavProps) {
  const {
    isSynced,
    setIsSynced,
    activeView,
    setActiveView,
    isRunning,
    setIsRunning,
    isBacktesting,
    setIsBacktesting,
    nodes
  } = useNodesStore();

  const [strategyName, setStrategyName] = useState("BTC Scalper Strategy");
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (tempName.trim()) {
      setStrategyName(tempName.trim());
      setIsSynced(false);
    }
    setIsEditing(false);
  };

  const handleNameCancel = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSubmit();
    } else if (e.key === "Escape") {
      handleNameCancel();
    }
  };

  // Trigger simulated highly realistic cloud synchronization
  const handleSaveSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    toast.loading("Syncing strategy modules with institutional secure vault...", { id: "sync-toast" });
    
    setTimeout(() => {
      setIsSyncing(false);
      setIsSynced(true);
      toast.success("Strategy synchronized securely to CrypAlgos Cloud!", { id: "sync-toast" });
    }, 1200);
  };

  // Trigger high-fidelity strategy backtest simulator
  const handleBacktest = () => {
    if (isBacktesting) return;
    setIsBacktesting(true);
    toast.info("Initializing backtester: Calibrating 90-day spot market matrix...", {
      description: "Running historical tick simulations for BTC/USDT",
      duration: 3000
    });

    setTimeout(() => {
      setIsBacktesting(false);
      toast.success("Backtest simulation completed successfully!", {
        description: `📈 Sharpe: 2.84 | Win Rate: 72.5% | Max DD: -4.2% | Profit: +18.4%`,
        duration: 5000,
      });
    }, 3200);
  };

  // Trigger live deployment toggle
  const handleLiveToggle = () => {
    const nextState = !isRunning;
    setIsRunning(nextState);
    if (nextState) {
      toast.success("Strategy deployed successfully to live trading nodes!", {
        description: "Executing live triggers on exchange: Binance Perpetual USDT",
        duration: 4000
      });
    } else {
      toast.warning("Live strategy deployment halted.", {
        description: "All active orders cancelled and safe shields engaged.",
        duration: 3500
      });
    }
  };

  const tabs = [
    { id: "canvas", label: "Canvas", icon: IconLayout },
    { id: "code", label: "Editor", icon: IconCode }
  ];

  return (
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

            <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-mono text-sidebar-primary border-sidebar-primary/20 bg-sidebar-primary/5 uppercase shrink-0">
              {workflowId.substring(0, 6)}
            </Badge>

            {templateId && (
              <Badge className="text-[9px] py-0 px-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold tracking-wide shrink-0">
                Preset
              </Badge>
            )}

            {/* Google Docs Style Cloud Status Icon Indicator */}
            <div className="flex items-center select-none shrink-0 ml-0.5">
              {isSyncing ? (
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
            {templateId ? "Pre-configured deployment template" : `Compiled strategy containing ${nodes.length} custom logic blocks`}
          </span>
        </div>
      </div>

      {/* ─── CENTER: Premium View Switcher (Pricing Page Style) ─── */}
      <div className="relative flex items-center bg-background dark:bg-card border border-border rounded-full p-1 shrink-0 h-10 select-none">
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-1 rounded-full bg-primary shadow-sm transition-transform duration-300 ease-in-out",
            activeView === "code" 
              ? "translate-x-full" 
              : "translate-x-0"
          )}
          style={{
            width: "calc(50% - 4px)"
          }}
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
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TabIcon className={cn("size-3.5 transition-colors duration-300", isActive ? "text-primary-foreground" : "text-muted-foreground/80")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── RIGHT: Beautiful backtest, live, and cloud sync actions ─── */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Dynamic Backtester Action Button (Global Primary Brand style) */}
        <Button
          variant="default"
          size="sm"
          onClick={handleBacktest}
          disabled={isBacktesting || isSyncing}
          className={cn(
            "cursor-pointer gap-1.5 h-9 px-4.5 rounded-full font-semibold text-xs transition-all duration-200 select-none border border-primary/20 shadow-xs",
            isBacktesting
              ? "bg-primary/10 text-primary border-primary/20 cursor-not-allowed opacity-80"
              : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-sm active:scale-[0.98]"
          )}
        >
          {isBacktesting ? (
            <>
              <IconLoader2 className="size-3.5 animate-spin" />
              <span>Backtesting...</span>
            </>
          ) : (
            <>
              <IconActivity className="size-3.5" />
              <span>Run Backtest</span>
            </>
          )}
        </Button>

        {/* Deploy Live / Stop Active Action Button (Global CSS colors) */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleLiveToggle}
          disabled={isBacktesting}
          className={cn(
            "cursor-pointer gap-1.5 h-9 px-4.5 rounded-full text-xs font-semibold transition-all duration-200 select-none border active:scale-[0.98] shadow-xs",
            isRunning
              ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15"
              : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
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
  );
}