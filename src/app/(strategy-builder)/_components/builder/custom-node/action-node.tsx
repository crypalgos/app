import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { IconBolt, IconTrash, IconSettings, IconCopy } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { useNodesStore } from "../../../store/nodes-store";
import { getRecommendedSuccessor } from "../../../utils/node-factory";
const TRIGGER_LABELS: Record<string, string> = {
  IMMEDIATE: "On Bar",
  ON_FILL: "On Fill",
  ON_POSITION_OPEN: "On Position Open",
  ON_POSITION_CLOSE: "On Position Close",
  ON_PROFIT_TARGET: "On TP Hit",
  ON_STOP_LOSS: "On SL Hit",
  ON_BAR_CLOSE: "On Bar Close",
};

import type { ActionNodeData, CompilerDiagnostic } from "@/types/strategy-builder";

interface ActionNodeProps {
  id: string;
  data: ActionNodeData;
  selected?: boolean;
}

export default React.memo(function ActionNode({ id, data, selected }: ActionNodeProps) {
  const { label } = data || {};

  const [isHovered, setIsHovered] = useState(false);

  const compileDiagnostics = useNodesStore((state) => state.compileDiagnostics);
  const nodeDiagnostics = compileDiagnostics?.filter((d) => d.node_id === id) || [];
  
  const highestDiagnostic = nodeDiagnostics.reduce<CompilerDiagnostic | null>((highest, current) => {
    if (!highest) return current;
    if (highest.severity === "ERROR") return highest;
    if (current.severity === "ERROR") return current;
    if (current.severity === "WARNING") return current;
    return highest;
  }, null);

  const setSelectedNodeId = useNodesStore((state) => state.setSelectedNodeId);
  const removeNode = useNodesStore((state) => state.removeNode);
  const duplicateNode = useNodesStore((state) => state.duplicateNode);
  const addDirectNode = useNodesStore((state) => state.addDirectNode);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const actionType = data.actionType || "buy";
  const trigger = data.trigger || "IMMEDIATE";
  const triggerLabel = TRIGGER_LABELS[trigger] || trigger;
  const isConfigured = !!data.actionType;

  const getSubtext = () => {
    if (actionType === "close_all") return "Close All Positions";
    if (actionType === "cancel_all_orders") return "Cancel All Orders";

    const sizeStr = data.sizing ? `${data.sizing.value} ${data.sizing.mode === "PERCENT_OF_EQUITY" ? "%" : data.sizing.mode === "FIXED_USD" ? "$" : "Units"}` : "Market Size";
    return `${actionType.toUpperCase()} | ${sizeStr}`;
  };

  const nodeLabel = label || "Action Node";

  return (
    <div 
      className="relative" 
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >


      {/* Rich hover diagnostics tooltip */}
      {isHovered && nodeDiagnostics.length > 0 && (
        <div className="absolute bottom-full left-0 mb-8 w-80 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg p-3 shadow-xl z-50 text-xs flex flex-col gap-1.5 pointer-events-none border border-zinc-200 dark:border-zinc-700 animate-in fade-in zoom-in-95 duration-150">
          {nodeDiagnostics.map((diag, index) => (
            <div key={index} className="flex flex-col gap-0.5 border-b border-zinc-200 dark:border-zinc-800 last:border-0 pb-1.5 last:pb-0">
              <div className="flex items-center gap-1.5 font-semibold">
                <span className={
                  diag.severity === "ERROR" ? "text-red-600 dark:text-red-400" :
                  diag.severity === "WARNING" ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                }>
                  {diag.severity === "ERROR" ? "Error" : diag.severity === "WARNING" ? "Warning" : "Info"}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 text-[10px] font-mono">[{diag.error_code}]</span>
              </div>
              <p className="text-zinc-700 dark:text-zinc-200 leading-normal">{diag.message}</p>
              {diag.suggestions && diag.suggestions.length > 0 && (
                <div className="mt-1 flex flex-col gap-0.5 pl-2 border-l border-zinc-300 dark:border-zinc-700">
                  {diag.suggestions.map((sug, sIdx) => (
                    <p key={sIdx} className="text-zinc-500 dark:text-zinc-400 text-[10px] italic">💡 {sug}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        className={`
          relative bg-white dark:bg-[#1B1D21] border
          rounded-tl-xl rounded-bl-xl rounded-br-xl p-4 w-80 min-h-[6rem] h-auto shadow-md transition-all duration-300
          hover:shadow-lg group cursor-pointer
          ${isHovered || selected ? "rounded-tr-none" : "rounded-tr-xl"}
          ${highestDiagnostic
            ? highestDiagnostic.severity === "ERROR"
              ? "border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)] dark:border-red-500 animate-pulse"
              : highestDiagnostic.severity === "WARNING"
              ? "border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)] dark:border-amber-500"
              : "border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)] dark:border-blue-500"
            : selected 
              ? "border-primary shadow-[0_0_12px_rgba(59,130,246,0.25)]" 
              : "border-border hover:border-border"}
        `}
      >
        {/* Header with icon, title and badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-emerald-600 text-white rounded-md flex items-center justify-center">
              <IconBolt className="size-4" />
            </div>
            <div className="flex flex-col select-none">
              <h3 className="text-foreground font-semibold text-sm truncate max-w-[180px]">
                {isConfigured ? nodeLabel : "Unconfigured Node"}
              </h3>
              {isConfigured ? (
                <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">
                  {getSubtext()}
                </p>
              ) : (
                <p className="text-[10px] text-orange-400 font-mono">
                  Click gear to configure
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 select-none">
            <Badge variant="secondary" className="text-[10px]">
              {triggerLabel}
            </Badge>
          </div>
        </div>
        {nodeDiagnostics.length > 0 && (
          <div className={`text-[10px] font-medium truncate max-w-[280px] mt-1 select-none ${
            highestDiagnostic?.severity === "ERROR" ? "text-red-500" :
            highestDiagnostic?.severity === "WARNING" ? "text-amber-500" : "text-blue-500"
          }`} title={highestDiagnostic?.message || ""}>
            {highestDiagnostic?.message}
          </div>
        )}

        {/* Floating Toolbar top-right of the card (n8n style, connected) */}
        {(isHovered || selected) && (
          <div 
            className={`absolute -right-px top-[-25px] h-[26px] bg-white dark:bg-[#1B1D21] border border-b-0 rounded-t-lg px-1.5 flex items-center gap-1 z-40 animate-in fade-in slide-in-from-bottom-1 duration-150 ${
              selected ? "border-primary shadow-[0_-3px_8px_rgba(59,130,246,0.15)]" : "border-border shadow-xs"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClick}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
              title="Configure Node Parameters"
            >
              <IconSettings className="size-3.5" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                duplicateNode(id);
              }}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
              title="Duplicate Node"
            >
              <IconCopy className="size-3.5" />
            </button>

            <div className="w-px h-3 bg-border/60 mx-0.5" />

            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded transition-colors cursor-pointer"
              title="Delete Node"
            >
              <IconTrash className="size-3.5 text-red-500" />
            </button>
          </div>
        )}
      </div>

      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5! h-2.5! bg-white! border-2! border-primary! rounded-full!"
        style={{ top: -5 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-5 !h-5 !bg-white dark:!bg-zinc-800 !border !border-primary !rounded-full flex items-center justify-center text-primary hover:!bg-primary hover:!text-white transition-colors duration-200 shadow-md cursor-pointer font-bold text-[13px] pb-[1px] z-30"
        style={{ bottom: -10, pointerEvents: 'all' }}
        onClick={(e) => {
          e.stopPropagation();
          const recommendedType = getRecommendedSuccessor("actionNode");
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
