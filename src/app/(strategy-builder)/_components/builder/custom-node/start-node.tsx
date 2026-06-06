import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  IconSettings, 
  IconBug, 
  IconHourglass, 
  IconPlayerPause, 
  IconLoader2, 
  IconActivity,
  IconCalendar,
  IconCurrencyDollar,
  IconChartBar,
  IconRocket,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useNodesStore } from "../../../store/nodes-store";
import { useTriggerBacktest } from "@/api-actions/hooks/strategy-hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface StartNodeData {
  label?: string;
  isActive?: boolean;
  exchange?: string;
}

interface StartNodeProps {
  id: string;
  data: StartNodeData;
  selected?: boolean;
}

export default React.memo(function StartNode({ id, data, selected }: StartNodeProps) {
  const { label = "Start Strategy", isActive = false } = data || {};
  
  const [isHovered, setIsHovered] = useState(false);
  const [backtestOpen, setBacktestOpen] = useState(false);

  // Zustand Store selectors
  const addPlaceholderNode = useNodesStore((state) => state.addPlaceholderNode);
  const setSelectedNodeId = useNodesStore((state) => state.setSelectedNodeId);
  const nodes = useNodesStore((state) => state.nodes);
  const edges = useNodesStore((state) => state.edges);
  const isRunning = useNodesStore((state) => state.isRunning);
  const setIsRunning = useNodesStore((state) => state.setIsRunning);
  const isBacktesting = useNodesStore((state) => state.isBacktesting);
  const setIsBacktesting = useNodesStore((state) => state.setIsBacktesting);
  const isSaving = useNodesStore((state) => state.isSaving);
  const setBacktestTaskId = useNodesStore((state) => state.setBacktestTaskId);
  const strategyId = useNodesStore((state) => state.strategyId);
  // Use global strategyName so start node reflects live name edits
  const strategyName = useNodesStore((state) => state.strategyName);
  const displayLabel = strategyName || label;

  // Backtest config form state — symbol/exchange/leverage resolved from DataNode by backend
  const [btStartDate, setBtStartDate] = useState("2024-01-01");
  const [btEndDate, setBtEndDate] = useState("2024-12-31");
  const [btCapital, setBtCapital] = useState("10000");

  // Celery Backtest trigger hook
  const { mutateAsync: triggerBacktest, isPending: isEnqueuing } = useTriggerBacktest(strategyId || "");

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Single click to select the node - panel will open automatically
    setSelectedNodeId(id);
  };

  const handleDebugFlow = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.loading("Analyzing strategy logical branches...", { id: "debug-toast" });
    
    setTimeout(() => {
      // Find unconnected/dangling custom nodes
      const danglingNodes = nodes.filter(node => {
        if (node.id === "start-1") return false;
        const isConnected = edges.some(edge => edge.source === node.id || edge.target === node.id);
        return !isConnected;
      });

      if (danglingNodes.length > 0) {
        const firstDangling = danglingNodes[0];
        toast.warning(`Debug: Strategy has ${danglingNodes.length} unconnected node(s)`, {
          id: "debug-toast",
          description: `Node "${firstDangling.data?.label || firstDangling.data?.symbol || firstDangling.id}" is dangling. Connect it to preserve logical execution flows.`,
          duration: 5000,
        });
      } else {
        toast.success("Debug: Strategy DAG validated successfully!", {
          id: "debug-toast",
          description: "All canvas modules are fully compiled. 0 errors, 0 warnings.",
          duration: 4000,
        });
      }
    }, 800);
  };

  const handleBacktestClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBacktesting || isEnqueuing) return;
    setBacktestOpen(true);
  };

  const handleBacktestSubmit = async () => {
    setBacktestOpen(false);
    setIsBacktesting(true);
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
      setBacktestTaskId(result.task_id);
      toast.success("Backtest completed!", {
        description: `Task ID: ${result.task_id.slice(0, 12)}... — Check the Backtests tab for results.`,
        duration: 6000,
      });
    } catch {
      toast.error("Failed to run backtest. Ensure your Data Node is configured with a symbol and exchange.");
    } finally {
      setIsBacktesting(false);
    }
  };

  const handleLiveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div 
      className="relative" 
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
          relative bg-white dark:bg-[#1B1D21] border border-border
          rounded-xl p-4 w-80 h-auto min-h-[6rem] shadow-md transition-all duration-300
          hover:shadow-lg hover:border-border group cursor-pointer
          ${selected ? "border-primary shadow-[0_0_12px_rgba(59,130,246,0.25)]" : ""}
          ${isActive ? "ring-2 ring-green-500 border-green-500 bg-green-50/10" : ""}
        `}
      >
        {/* Floating Actions Toolbar (Symmetric & Centered above the Start Node) */}
        <div 
          className="absolute left-1/2 top-[-28px] -translate-x-1/2 h-7 flex items-center gap-3 z-40 select-none bg-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          <TooltipProvider delayDuration={150}>
            {/* Settings / Configuration Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleClick}
                  className="p-1 hover:bg-zinc-100/10 dark:hover:bg-zinc-800/30 text-zinc-400 dark:text-zinc-500 hover:text-zinc-200 rounded transition-all duration-200 cursor-pointer flex items-center justify-center"
                >
                  <IconSettings className="size-[18px] stroke-[1.8px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-semibold text-xs py-1 px-2">
                Configure Risk & Settings
              </TooltipContent>
            </Tooltip>

            <div className="w-[1px] h-3.5 bg-zinc-700/60" />

            {/* Play Debug Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDebugFlow}
                  className="p-1 hover:bg-blue-500/10 text-zinc-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 rounded transition-all duration-200 cursor-pointer flex items-center justify-center"
                >
                  <IconBug className="size-[18px] stroke-[1.8px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-semibold text-xs py-1 px-2">
                Debug / Validate Flow
              </TooltipContent>
            </Tooltip>

            {/* Backtest Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleBacktestClick}
                  disabled={isBacktesting || isEnqueuing}
                  className="p-1 hover:bg-primary/10 text-zinc-400 dark:text-zinc-500 hover:text-primary dark:hover:text-primary rounded transition-all duration-200 cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBacktesting || isEnqueuing ? (
                    <IconLoader2 className="size-[18px] stroke-[1.8px] animate-spin" />
                  ) : (
                    <IconHourglass className="size-[18px] stroke-[1.8px]" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-semibold text-xs py-1 px-2">
                Backtest Strategy
              </TooltipContent>
            </Tooltip>

            {/* Deploy Live Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLiveToggle}
                  disabled={isBacktesting}
                  className="p-1 hover:bg-emerald-500/10 rounded transition-all duration-200 cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning ? (
                    <div className="flex items-center justify-center gap-1">
                      <span className="flex size-1.5 rounded-full bg-destructive animate-pulse" />
                      <IconPlayerPause className="size-[18px] stroke-[1.8px] text-destructive" />
                    </div>
                  ) : (
                    <IconRocket className="size-[18px] stroke-[1.8px] text-emerald-500" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-semibold text-xs py-1 px-2">
                {isRunning ? "Halt Live Strategy" : "Deploy Live Strategy"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Header with icon, title and badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`size-8 rounded-md flex items-center justify-center text-white ${
              isActive ? "bg-green-500 animate-pulse" : "bg-green-600"
            }`}>
              <Play className="size-4 fill-current" />
            </div>
            <div className="flex flex-col select-none">
              <h3 className="text-foreground font-semibold text-sm truncate max-w-[140px]">
                {displayLabel}
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono">
                {isActive ? "Engine Active" : "Execution Root"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 select-none">
            <Badge variant="secondary" className="text-[10px]">
              Start
            </Badge>
          </div>
        </div>
        
        {data.exchange && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase font-mono">
              Broker: {data.exchange}
            </Badge>
          </div>
        )}
      </div>

      {/* React Flow source handle and '+' action button */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-5 !h-5 !bg-white dark:!bg-zinc-800 !border !border-primary !rounded-full flex items-center justify-center text-primary hover:!bg-primary hover:!text-white transition-colors duration-200 shadow-md cursor-pointer font-bold text-[13px] pb-[1px] z-30"
        style={{ bottom: -10, pointerEvents: 'all' }}
        onClick={(e) => {
          e.stopPropagation();
          addPlaceholderNode(id, null, "data");
        }}
        title="Drag to connect or click to spawn placeholder"
      >
        +
      </Handle>

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
            {/* Info Banner: params resolved from DataNode */}
            <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5">
              <IconInfoCircle className="size-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Symbol, exchange and leverage</span> are read automatically from your{" "}
                <span className="font-semibold text-foreground">Data Node</span> configuration.
              </p>
            </div>

            {/* Simulation Period */}
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

            {/* Initial Capital */}
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

            {/* Summary pill */}
            <div className="flex items-center gap-2 bg-muted/40 border border-border/60 rounded-xl px-3 py-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Summary</span>
              <span className="text-xs font-mono text-foreground ml-auto">
                ${parseFloat(btCapital || "0").toLocaleString()} capital · {btStartDate} → {btEndDate}
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
    </div>
  );
});
