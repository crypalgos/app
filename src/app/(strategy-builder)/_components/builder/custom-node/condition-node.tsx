import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { IconGitBranch, IconTrash, IconSettings, IconCopy } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { useNodesStore } from "../../../store/nodes-store";
import { getRecommendedSuccessor } from "../../../utils/node-factory";

import type { ConditionNodeData, ASTCondition, ASTGroup, ConditionOperand, CompilerDiagnostic } from "@/types/strategy-builder";

type ConditionAST = ASTCondition | ASTGroup;

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

function getIndicatorNodeLabel(node: any, indicatorType?: string, indicatorId?: string): string {
  const data = node?.data || {};
  
  if (Array.isArray(data.indicators)) {
    const matched = indicatorId 
      ? data.indicators.find((item: any) => item.id === indicatorId)
      : (indicatorType ? data.indicators.find((item: any) => item.indicator === indicatorType) : null);
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
      const label = node ? getIndicatorNodeLabel(node, op.indicator, op.indicatorId) : op.nodeId;
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

  const compileDiagnostics = useNodesStore((state) => state.compileDiagnostics);
  const nodeDiagnostics = compileDiagnostics?.filter((d) => d.node_id === id) || [];
  
  const highestDiagnostic = nodeDiagnostics.reduce<CompilerDiagnostic | null>((highest, current) => {
    if (!highest) return current;
    if (highest.severity === "ERROR") return highest;
    if (current.severity === "ERROR") return current;
    if (current.severity === "WARNING") return current;
    return highest;
  }, null);

  const nodes = useNodesStore((state) => state.nodes);
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

  const expressionText = data.ast_root ? renderAST(data.ast_root, nodes) : "No condition set";

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
            <div className="size-8 bg-blue-600 text-white rounded-md flex items-center justify-center">
              <IconGitBranch className="size-4" />
            </div>
            <div className="flex flex-col select-none">
              <h3 className="text-foreground font-semibold text-sm truncate max-w-[180px]">
                {expressionText !== "No condition set" ? label : "Unconfigured Node"}
              </h3>
              {expressionText !== "No condition set" ? (
                <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">
                  {expressionText}
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
              Logic
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
          const recommendedType = getRecommendedSuccessor("conditionNode");
          if (recommendedType) {
            addDirectNode({
              parentNodeId: id,
              parentHandle: "true",
              recommendedType
            });
          }
        }}
        title="Click to add next step (True Path)"
      >
        +
      </Handle>
    </div>
  );
});
