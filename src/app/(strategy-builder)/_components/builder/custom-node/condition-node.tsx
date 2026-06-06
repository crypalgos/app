import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { IconGitBranch, IconTrash, IconSettings, IconCopy } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { useNodesStore } from "../../../store/nodes-store";

// ---------- AST Types ----------
interface ConditionOperand {
  source?: string;
  field?: string;
}

interface ConditionLeaf {
  type: "CONDITION";
  left: ConditionOperand | number | string;
  operator: string;
  right: ConditionOperand | number | string;
}

interface ConditionGroup {
  type: "GROUP";
  operator: "AND" | "OR";
  children: (ConditionLeaf | ConditionGroup)[];
}

type ConditionAST = ConditionLeaf | ConditionGroup;

interface ConditionNodeData {
  label?: string;
  ast_root?: ConditionAST;
  // Legacy fallback
  expressions?: any[];
}

interface ConditionNodeProps {
  id: string;
  data: ConditionNodeData;
  selected?: boolean;
}

const OP_SYMBOLS: Record<string, string> = {
  GREATER_THAN: ">",
  LESS_THAN: "<",
  GREATER_THAN_EQUAL: ">=",
  LESS_THAN_EQUAL: "<=",
  EQUAL_TO: "==",
  NOT_EQUAL_TO: "!=",
  ">": ">",
  "<": "<",
  ">=": ">=",
  "<=": "<=",
  "==": "==",
  "!=": "!=",
};

function getIndicatorNodeLabel(node: any, indicatorType?: string): string {
  const data = node?.data || {};
  
  if (indicatorType && Array.isArray(data.indicators)) {
    const matched = data.indicators.find((item: any) => item.indicator === indicatorType);
    if (matched) {
      const name = matched.indicator;
      const params: string[] = [];
      if (matched.period !== undefined) params.push(String(matched.period));
      if (matched.std !== undefined) params.push(String(matched.std));
      return `${name}${params.length > 0 ? `(${params.join(",")})` : ""}`;
    }
  }
  
  const name = data.indicator || data.label || "Indicator";
  const params: string[] = [];
  if (data.period !== undefined) params.push(String(data.period));
  if (data.std !== undefined) params.push(String(data.std));
  return `${name}${params.length > 0 ? `(${params.join(",")})` : ""}`;
}

function renderOperand(op: any, nodes: any[] = []): string {
  if (typeof op === "number") return String(op);
  if (typeof op === "string") return op;
  if (op && typeof op === "object") {
    if (op.nodeId) {
      const node = nodes.find((n) => n.id === op.nodeId);
      const label = node ? getIndicatorNodeLabel(node, op.indicator) : op.nodeId;
      return `${label}.${op.output || "value"}`;
    }
    if (op.field) {
      return op.source ? `${op.source}.${op.field}` : op.field;
    }
  }
  return "?";
}

function renderAST(node: ConditionAST | undefined, nodes: any[] = []): string {
  if (!node) return "No condition set";
  if (node.type === "CONDITION") {
    const left = renderOperand(node.left, nodes);
    const op = OP_SYMBOLS[node.operator] || node.operator || ">";
    const right = renderOperand(node.right, nodes);
    return `${left} ${op} ${right}`;
  }
  if (node.type === "GROUP") {
    const children = (node.children || []).map((c) => renderAST(c, nodes));
    if (children.length === 0) return "Empty group";
    if (children.length === 1) return children[0];
    return `(${children.join(` ${node.operator} `)})`;
  }
  return "No condition set";
}

export default React.memo(function ConditionNode({ id, data, selected }: ConditionNodeProps) {
  const { label = "Condition Gate" } = data || {};

  const [isHovered, setIsHovered] = useState(false);

  const nodes = useNodesStore((state) => state.nodes);
  const setSelectedNodeId = useNodesStore((state) => state.setSelectedNodeId);
  const removeNode = useNodesStore((state) => state.removeNode);
  const duplicateNode = useNodesStore((state) => state.duplicateNode);
  const addPlaceholderNode = useNodesStore((state) => state.addPlaceholderNode);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const expressionText = data.ast_root ? renderAST(data.ast_root, nodes) : "No condition set";

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
            <div className="size-8 bg-blue-600 text-white rounded-md flex items-center justify-center">
              <IconGitBranch className="size-4" />
            </div>
            <div className="flex flex-col select-none">
              <h3 className="text-foreground font-semibold text-sm truncate max-w-[180px]">
                {label}
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">
                {expressionText}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 select-none">
            <Badge variant="secondary" className="text-[10px]">
              Logic
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
      
      {/* Output Path source handle (True) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!w-5 !h-5 !bg-white dark:!bg-zinc-800 !border !border-emerald-500 !rounded-full flex items-center justify-center text-emerald-500 hover:!bg-emerald-500 hover:!text-white transition-colors duration-200 shadow-md cursor-pointer font-bold text-[13px] pb-[1px] z-30"
        style={{ bottom: -10, pointerEvents: 'all' }}
        onClick={(e) => {
          e.stopPropagation();
          addPlaceholderNode(id, "true", "action");
        }}
        title="Drag to connect or click to spawn placeholder"
      >
        +
      </Handle>
    </div>
  );
});
