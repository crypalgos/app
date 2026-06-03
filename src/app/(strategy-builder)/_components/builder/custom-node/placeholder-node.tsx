import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Plus } from "lucide-react";
import { useNodesStore } from "../../../store/nodes-store";

interface PlaceholderNodeData {
  expectedType?: string;
  parentSourceId?: string;
  parentSourceHandleId?: string | null;
  originalTargetId?: string | null;
}

interface PlaceholderNodeProps {
  id: string;
  data: PlaceholderNodeData;
  selected?: boolean;
}

export default React.memo(function PlaceholderNode({ id, data, selected }: PlaceholderNodeProps) {
  const setActiveCreationType = useNodesStore((state) => state.setActiveCreationType);
  const setActiveCreationSource = useNodesStore((state) => state.setActiveCreationSource);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Open the creation catalog in "selector" mode to let the creator choose any compatible component
    setActiveCreationSource({
      nodeId: data.parentSourceId || "",
      handleId: data.parentSourceHandleId || null,
      placeholderId: id,
      originalTargetId: data.originalTargetId || null,
    });
    setActiveCreationType("selector");
  };

  return (
    <div className="relative">
      {/* React Flow target handle representing incoming flow path */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-white !border-2 !border-primary !rounded-full"
        style={{ top: -5 }}
      />

      {/* React Flow source handle representing outgoing flow path */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-white !border-2 !border-primary !rounded-full"
        style={{ bottom: -5 }}
      />
      
      {/* Square Professional Placeholder Node Card matching the standard w-80 h-24 layout */}
      <div
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-xl w-80 h-24 shadow-sm
          flex flex-col items-center justify-center gap-2 transition-all duration-300
          bg-white dark:bg-[#1B1D21] cursor-pointer group hover:shadow-md
          ${selected 
            ? "border-primary ring-2 ring-primary/20 bg-primary/5" 
            : "border-zinc-200 dark:border-zinc-800/80 hover:border-primary/50 dark:hover:border-primary/50"}
        `}
      >
        {/* Centered circular dashed outline button with Plus */}
        <div className="size-8 rounded-full border border-dashed border-zinc-500/50 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-primary group-hover:border-primary/50 transition-all duration-200">
          <Plus className="size-4 stroke-[2.5px]" />
        </div>
        <div className="flex flex-col text-center select-none">
          <span className="text-xs font-bold text-muted-foreground/90 group-hover:text-foreground transition-colors">
            Add Workflow Node
          </span>
          <span className="text-[9px] text-muted-foreground/60 font-mono mt-0.5">
            Click to choose component
          </span>
        </div>
      </div>
    </div>
  );
});
