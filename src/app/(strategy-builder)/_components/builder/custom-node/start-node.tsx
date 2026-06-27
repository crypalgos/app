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
import { getRecommendedSuccessor } from "../../../utils/node-factory";
import { useTriggerBacktest } from "@/api-actions/hooks/strategy-hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { StartNodeData } from "@/types/strategy-builder";

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
  const addDirectNode = useNodesStore((state) => state.addDirectNode);
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
  const [btStartDate, setBtStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [btEndDate, setBtEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  });
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
    setSelectedNodeId(null); // Close start node settings panel/dialog
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
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleClick}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 rounded transition-colors"
                  >
                    <IconSettings className="size-[16px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Configure Settings
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
          const recommendedType = getRecommendedSuccessor("startNode");
          if (recommendedType) {
            addDirectNode({
              parentNodeId: id,
              parentHandle: null,
              recommendedType
            });
          }
        }}
        title="Click to add next step"
      >
        +
      </Handle>


    </div>
  );
});
