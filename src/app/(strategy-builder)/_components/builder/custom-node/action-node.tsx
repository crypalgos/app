import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { IconBolt, IconTrash, IconSettings, IconCopy } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { useNodesStore } from "../../../store/nodes-store";

interface ActionNodeData {
  label?: string;
  actionType?: string;
  message?: string;
  url?: string;
  channel?: string;
  orderType?: string;
  sizeType?: string;
  sizeValue?: number;
  amount?: number;
  sl?: number;
  tp?: number;
}

interface ActionNodeProps {
  id: string;
  data: ActionNodeData;
  selected?: boolean;
}

export default React.memo(function ActionNode({ id, data, selected }: ActionNodeProps) {
  const {
    label,
    actionType = "buy",
    message,
    url,
    channel,
    amount,
    sl,
    tp,
  } = data || {};

  const [isHovered, setIsHovered] = useState(false);

  const setSelectedNodeId = useNodesStore((state) => state.setSelectedNodeId);
  const removeNode = useNodesStore((state) => state.removeNode);
  const duplicateNode = useNodesStore((state) => state.duplicateNode);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Single click to select the node - panel will open automatically
    setSelectedNodeId(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const isUtility = ["log_info", "trigger_webhook", "send_notification"].includes(actionType);

  const getSubtext = () => {
    if (actionType === "log_info") {
      return `Log: "${message || "Info Trace"}"`;
    }
    if (actionType === "trigger_webhook") {
      return `Webhook: ${url || "API endpoint"}`;
    }
    if (actionType === "send_notification") {
      return `Notify: ${channel || "Discord"}`;
    }
    if (actionType === "close_all") {
      return "Close All Positions";
    }
    
    // Standard trading actions
    const size = amount !== undefined ? `${amount} Contracts` : "Market Size";
    const brackets = (sl || tp) ? ` | SL: ${sl ?? "-"} TP: ${tp ?? "-"}` : "";
    return `${actionType.toUpperCase()} | ${size}${brackets}`;
  };

  const nodeLabel = label || (
    actionType === "log_info" ? "Log Info Trace" : 
    actionType === "trigger_webhook" ? "Webhook Alert" : 
    actionType === "send_notification" ? "Send Notification" : 
    "Action Gate"
  );

  return (
    <div 
      className="relative" 
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
          relative bg-white dark:bg-[#1B1D21] border
          rounded-tl-xl rounded-bl-xl rounded-br-xl p-4 w-80 h-24 shadow-md transition-all duration-300
          hover:shadow-lg group cursor-pointer
          ${isHovered || selected ? "rounded-tr-none" : "rounded-tr-xl"}
          ${selected 
            ? "border-primary shadow-[0_0_12px_rgba(59,130,246,0.25)]" 
            : "border-border hover:border-border"}
        `}
      >
        {/* Header with icon, title and badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`size-8 ${isUtility ? "bg-indigo-600" : "bg-emerald-600"} text-white rounded-md flex items-center justify-center`}>
              <IconBolt className="size-4" />
            </div>
            <div className="flex flex-col select-none">
              <h3 className="text-foreground font-semibold text-sm truncate max-w-[180px]">
                {nodeLabel}
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">
                {getSubtext()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 select-none">
            <Badge variant="secondary" className="text-[10px]">
              {isUtility ? "Utility" : "Actions"}
            </Badge>
          </div>
        </div>

        {/* Floating Toolbar top-right of the card (n8n style, connected) */}
        {(isHovered || selected) && (
          <div 
            className={`absolute right-[-1px] top-[-25px] h-[26px] bg-white dark:bg-[#1B1D21] border border-b-0 rounded-t-lg px-1.5 flex items-center gap-1 z-40 animate-in fade-in slide-in-from-bottom-1 duration-150 ${
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

            <div className="w-[1px] h-3 bg-border/60 mx-0.5" />

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
        className="!w-2.5 !h-2.5 !bg-white !border-2 !border-primary !rounded-full"
        style={{ top: -5 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-white !border-2 !border-primary !rounded-full"
        style={{ bottom: -5 }}
      />
    </div>
  );
});
