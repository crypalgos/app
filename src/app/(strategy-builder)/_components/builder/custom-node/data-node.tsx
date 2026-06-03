import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { IconDatabase, IconTrash, IconSettings, IconCopy } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { useNodesStore } from "../../../store/nodes-store";

interface DataNodeData {
  label?: string;
  dataType?: string;
  source?: string;
  assetClass?: "SPOT" | "FUTURE" | "PERPETUAL" | "OPTION";
  symbol?: string;
  timeframe?: string;
  leverage?: number;
}

interface DataNodeProps {
  id: string;
  data: DataNodeData;
  selected?: boolean;
}

export default React.memo(function DataNode({ id, data, selected }: DataNodeProps) {
  const {
    label = "Market Data Feed",
    assetClass = "SPOT",
    symbol = "BTC/USDT",
    timeframe = "1m",
    leverage = 1,
    dataType = "OHLCV",
  } = data || {};

  const [isHovered, setIsHovered] = useState(false);

  const setSelectedNodeId = useNodesStore((state) => state.setSelectedNodeId);
  const removeNode = useNodesStore((state) => state.removeNode);
  const duplicateNode = useNodesStore((state) => state.duplicateNode);
  const addPlaceholderNode = useNodesStore((state) => state.addPlaceholderNode);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Single click to select the node - panel will open automatically
    setSelectedNodeId(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
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
            <div className="size-8 bg-purple-600 text-white rounded-md flex items-center justify-center">
              <IconDatabase className="size-4" />
            </div>
            <div className="flex flex-col select-none">
              <h3 className="text-foreground font-semibold text-sm truncate max-w-[180px]">
                {symbol}
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono">
                {assetClass} | {timeframe} | {leverage}x | {dataType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 select-none">
            <Badge variant="secondary" className="text-[10px]">
              Data
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
      
      {/* React Flow source handle and '+' action button */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-5 !h-5 !bg-white dark:!bg-zinc-800 !border !border-primary !rounded-full flex items-center justify-center text-primary hover:!bg-primary hover:!text-white transition-colors duration-200 shadow-md cursor-pointer font-bold text-[13px] pb-[1px] z-30"
        style={{ bottom: -10, pointerEvents: 'all' }}
        onClick={(e) => {
          e.stopPropagation();
          addPlaceholderNode(id, null, "indicator");
        }}
        title="Drag to connect or click to spawn placeholder"
      >
        +
      </Handle>
    </div>
  );
});
