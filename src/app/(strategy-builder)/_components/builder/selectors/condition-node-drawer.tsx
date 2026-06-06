"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  IconGitBranch,
  IconX,
  IconPlus,
  IconTrash,
  IconGripVertical,
  IconChevronDown,
  IconChevronRight,
  IconDatabase,
  IconPlugConnected,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";
import { useNodesStore } from "../../../store/nodes-store";
import { cn } from "@/lib/utils";

// ─── AST Types ───
interface ConditionOperand {
  source?: string;
  field?: string;
  nodeId?: string;
  indicator?: string;
  output?: string;
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

interface UnifiedIndicator {
  nodeId: string;
  indicator: string;
  period?: number;
  std?: number;
  label: string;
  key: string;
}

// ─── Indicator Output Mapping ───
const INDICATOR_OUTPUTS: Record<string, string[]> = {
  EMA: ["value"],
  SMA: ["value"],
  ATR: ["value"],
  RSI: ["value"],
  BB: ["upper", "middle", "lower", "value"],
  BollingerBands: ["upper", "middle", "lower", "value"],
  MACD: ["macd", "signal", "histogram", "value"],
};

const OPERATORS = [
  { value: ">", label: "Greater Than (>)" },
  { value: "<", label: "Less Than (<)" },
  { value: ">=", label: "Greater Or Equal (≥)" },
  { value: "<=", label: "Less Or Equal (≤)" },
  { value: "==", label: "Equal (==)" },
  { value: "!=", label: "Not Equal (≠)" },
] as const;

const OP_SYMBOLS: Record<string, string> = {
  ">": ">", "<": "<", ">=": ">=", "<=": "<=", "==": "==", "!=": "!=",
  GREATER_THAN: ">", LESS_THAN: "<", GREATER_THAN_EQUAL: ">=",
  LESS_THAN_EQUAL: "<=", EQUAL_TO: "==", NOT_EQUAL_TO: "!=",
};

const OPERATOR_MAP: Record<string, string> = {
  "GREATER_THAN": ">",
  "LESS_THAN": "<",
  "EQUAL_TO": "==",
  "NOT_EQUAL_TO": "!=",
  "GREATER_THAN_EQUAL": ">=",
  "LESS_THAN_EQUAL": "<=",
  ">": ">",
  "<": "<",
  "==": "==",
  "!=": "!=",
  ">=": ">=",
  "<=": "<="
};

const PRICE_FIELDS = ["Open", "High", "Low", "Close", "Volume"];

// ─── Helpers ───
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
  if (data.fast_period !== undefined) params.push(String(data.fast_period));
  if (data.slow_period !== undefined) params.push(String(data.slow_period));
  if (data.signal_period !== undefined) params.push(String(data.signal_period));
  
  const paramStr = params.length > 0 ? `(${params.join(",")})` : "";
  return `${name}${paramStr}`;
}

function renderOperand(op: any, nodes: any[] = []): string {
  if (typeof op === "number" || typeof op === "string") return String(op) || "?";
  if (op && typeof op === "object") {
    if (op.nodeId) {
      const node = nodes.find((n) => n.id === op.nodeId);
      const label = node ? getIndicatorNodeLabel(node, op.indicator) : op.nodeId;
      return `${label || "?"}.${op.output || "?"}`;
    }
    if (op.field) {
      return op.source ? `${op.source}.${op.field}` : op.field;
    }
    if (op.source) {
      return `${op.source}.?`;
    }
  }
  return "?";
}

function renderAST(node: ConditionAST, nodes: any[] = []): string {
  if (node.type === "CONDITION") {
    return `${renderOperand(node.left, nodes)} ${OP_SYMBOLS[node.operator] || node.operator || "?"} ${renderOperand(node.right, nodes)}`;
  }
  if (node.type === "GROUP") {
    const parts = (node.children || []).map((child) => renderAST(child, nodes));
    if (parts.length === 0) return "Empty";
    if (parts.length === 1) return `(${parts[0]})`;
    return `(${parts.join(` ${node.operator} `)})`;
  }
  return "?";
}

function makeDefaultLeaf(sourceSymbol: string = "BTCUSD"): ConditionLeaf {
  return {
    type: "CONDITION",
    left: { source: sourceSymbol, field: "" },
    operator: "",
    right: "",
  };
}

function makeDefaultGroup(sourceSymbol: string = "BTCUSD", op: "AND" | "OR" = "AND"): ConditionGroup {
  return { type: "GROUP", operator: op, children: [makeDefaultLeaf(sourceSymbol)] };
}

// Helper to move a node inside the AST recursively for HTML5 drag-and-drop
function moveNodeInAST(root: ConditionGroup, srcPath: number[], destPath: number[]): ConditionGroup {
  const newRoot = JSON.parse(JSON.stringify(root));

  const getParentAndIndex = (ast: ConditionGroup, path: number[]): { parent: ConditionGroup; index: number } => {
    let current: any = ast;
    for (let i = 0; i < path.length - 1; i++) {
      current = current.children[path[i]];
    }
    return { parent: current, index: path[path.length - 1] };
  };

  // Remove the dragged node from source index
  const { parent: srcParent, index: srcIndex } = getParentAndIndex(newRoot, srcPath);
  const [draggedNode] = srcParent.children.splice(srcIndex, 1);

  // Adjust target index if sibling shift happened in same parent
  const adjustedDestPath = [...destPath];
  const sameParent = srcPath.slice(0, -1).join(",") === destPath.slice(0, -1).join(",");
  if (sameParent && srcIndex < destPath[destPath.length - 1]) {
    adjustedDestPath[adjustedDestPath.length - 1]--;
  }

  // Resolve target node type to append or insert
  let currentTarget: any = newRoot;
  for (let i = 0; i < adjustedDestPath.length; i++) {
    if (currentTarget.children) {
      currentTarget = currentTarget.children[adjustedDestPath[i]];
    }
  }

  if (currentTarget && currentTarget.type === "GROUP") {
    // If dropped directly on a group card, append to that group
    currentTarget.children.push(draggedNode);
  } else {
    // Otherwise insert it at index of target sibling node
    const { parent: destParent, index: destIndex } = getParentAndIndex(newRoot, adjustedDestPath);
    destParent.children.splice(destIndex, 0, draggedNode);
  }

  return newRoot;
}

// ─── Theme-Adaptive Syntax Highlighter Preview (Recursive, One-Liner) ───
function renderASTWithHighlight(node: ConditionAST, nodes: any[] = []): React.ReactNode {
  if (node.type === "CONDITION") {
    const formatOp = (op: any) => {
      if (typeof op === "number" || typeof op === "string") {
        return <span className="text-amber-600 dark:text-amber-500 font-mono font-semibold">{op || "?"}</span>;
      }
      if (op && typeof op === "object") {
        if (op.nodeId) {
          const matchedNode = nodes.find((n) => n.id === op.nodeId);
          const label = matchedNode ? getIndicatorNodeLabel(matchedNode, op.indicator) : op.nodeId;
          return (
            <span className="text-cyan-600 dark:text-cyan-400 font-mono">
              {label || "?"}.<span className="text-blue-600 dark:text-blue-400 font-semibold">{op.output || "?"}</span>
            </span>
          );
        }
        if (op.field) {
          return (
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">
              {op.source ? `${op.source}.${op.field}` : op.field}
            </span>
          );
        }
        if (op.source) {
          return (
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">
              {op.source}.<span className="text-red-500 font-bold">?</span>
            </span>
          );
        }
      }
      return <span className="text-red-500 font-mono">?</span>;
    };

    const opSymbol = OP_SYMBOLS[node.operator] || node.operator || "?";

    return (
      <span className="inline-flex items-center font-mono text-xs">
        {formatOp(node.left)}
        <span className="text-rose-600 dark:text-rose-500 font-bold mx-1">{opSymbol === "?" ? <span className="text-red-500 font-bold">?</span> : opSymbol}</span>
        {formatOp(node.right)}
      </span>
    );
  }

  if (node.type === "GROUP") {
    const children = node.children || [];
    if (children.length === 0) {
      return (
        <span className="text-muted-foreground italic font-mono text-xs">
          (Empty)
        </span>
      );
    }
    if (children.length === 1) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-xs">
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">(</span>
          {renderASTWithHighlight(children[0], nodes)}
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">)</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center flex-wrap gap-1 font-mono text-xs">
        <span className="text-indigo-600 dark:text-indigo-400 font-bold">(</span>
        {children.map((child, idx) => (
          <React.Fragment key={idx}>
            {renderASTWithHighlight(child, nodes)}
            {idx < children.length - 1 && (
              <span className={cn(
                "font-bold uppercase mx-1.5 select-none font-mono text-[11px]",
                node.operator === "AND" ? "text-blue-500 dark:text-blue-400" : "text-amber-500 dark:text-amber-400"
              )}>
                {node.operator}
              </span>
            )}
          </React.Fragment>
        ))}
        <span className="text-indigo-600 dark:text-indigo-400 font-bold">)</span>
      </span>
    );
  }

  return null;
}



// ─── Unified Horizontal Condition Card Editor ───
function ConditionLeafEditor({
  leaf,
  onChange,
  onRemove,
  index,
  path,
  draggedPath,
  setDraggedPath,
  onDrop,
  availableIndicators,
  upstreamSymbol,
}: {
  leaf: ConditionLeaf;
  onChange: (updated: ConditionLeaf) => void;
  onRemove: () => void;
  index: number;
  path: number[];
  draggedPath: number[] | null;
  setDraggedPath: (path: number[] | null) => void;
  onDrop: (e: React.DragEvent, targetPath: number[]) => void;
  availableIndicators: UnifiedIndicator[];
  upstreamSymbol: string;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedPath(path);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("opacity-40");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedPath(null);
    e.currentTarget.classList.remove("opacity-40");
  };

  const currentOp = OPERATOR_MAP[leaf.operator] || leaf.operator || "";

  // Right operand is static if it's a number or a string (not an object with nodeId or field)
  const isRightStatic = typeof leaf.right === "number" || typeof leaf.right === "string";

  // Build unified list of variable options
  const variableOptions = useMemo(() => {
    const options = [
      { group: "Price Fields", items: PRICE_FIELDS.map(f => ({ label: `${upstreamSymbol}.${f}`, value: `price:${f}` })) }
    ];
    if (availableIndicators.length > 0) {
      options.push({
        group: "Indicator Outputs",
        items: availableIndicators.flatMap(ind => {
          const outputs = INDICATOR_OUTPUTS[ind.indicator] || ["value"];
          return outputs.map(out => ({
            label: `${ind.label}.${out}`,
            value: `indicator:${ind.nodeId}:${ind.indicator}:${out}`
          }));
        })
      });
    }
    return options;
  }, [upstreamSymbol, availableIndicators]);

  // Helper to convert operand object/value to select string value
  const getSelectedValue = (op: any) => {
    if (op && typeof op === "object") {
      if (op.nodeId) return `indicator:${op.nodeId}:${op.indicator}:${op.output}`;
      if (op.field) return `price:${op.field}`;
    }
    return "";
  };

  // Helper to convert select string value back to operand object
  const handleSelectChange = (key: string, side: "left" | "right") => {
    if (key.startsWith("price:")) {
      const field = key.split(":")[1];
      onChange({ ...leaf, [side]: { source: upstreamSymbol, field } });
    } else if (key.startsWith("indicator:")) {
      const [, nodeId, indicator, output] = key.split(":");
      onChange({ ...leaf, [side]: { nodeId, indicator, output } });
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        onDrop(e, path);
      }}
      className={cn(
        "p-3 border border-border bg-card rounded-xl flex flex-col md:flex-row items-center gap-3 relative group transition-all duration-200",
        isDragOver && "border-blue-500/80 bg-blue-500/[0.02] shadow-md scale-[1.01]"
      )}
    >
      {/* Drag & Number indicator */}
      <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
        <div className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0">
          <IconGripVertical className="size-4" />
        </div>
        <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider font-mono">#{index + 1}</span>
      </div>

      {/* Left Operand Select */}
      <div className="w-full md:w-auto md:flex-1 min-w-[200px]">
        <Select
          value={getSelectedValue(leaf.left)}
          onValueChange={(val) => handleSelectChange(val, "left")}
        >
          <SelectTrigger className="w-full text-xs h-9 bg-background border-input text-foreground font-mono px-3 rounded-xl">
            <SelectValue placeholder="Select Left Variable" />
          </SelectTrigger>
          <SelectContent position="popper" className="bg-popover border border-border text-popover-foreground font-mono text-xs max-h-[300px] min-w-[240px] z-50 rounded-xl">
            {variableOptions.map(group => (
              <SelectGroup key={group.group}>
                <SelectLabel className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider px-3 py-1.5 border-b border-border/40 mb-1">{group.group}</SelectLabel>
                {group.items.map(item => (
                  <SelectItem key={item.value} value={item.value} className="text-xs px-3 py-2">
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Operator Select (Inline and sleek) */}
      <div className="shrink-0 w-24">
        <Select
          value={currentOp}
          onValueChange={(val) => onChange({ ...leaf, operator: val })}
        >
          <SelectTrigger className="w-full text-xs h-9 bg-background border-input text-foreground px-3 flex justify-between font-bold rounded-xl">
            <span className="font-bold">{currentOp || "Op"}</span>
          </SelectTrigger>
          <SelectContent position="popper" className="bg-popover border border-border text-popover-foreground text-xs min-w-[140px] z-50 rounded-xl">
            {OPERATORS.map(op => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right Operand Wrapper (Unified with Static/Variable Toggle) */}
      <div className="w-full md:w-auto md:flex-1 min-w-[240px] flex items-center gap-2">
        {/* Toggle between Static (123) and Variable (VAR) */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-9 shrink-0 rounded-xl transition-all border",
            isRightStatic 
              ? "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400"
              : "bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400"
          )}
          onClick={() => {
            if (isRightStatic) {
              // Switch to Variable
              onChange({ ...leaf, right: { source: upstreamSymbol, field: "" } });
            } else {
              // Switch to Static (Constant)
              onChange({ ...leaf, right: "" });
            }
          }}
          title={isRightStatic ? "Switch to Variable (Price/Indicator)" : "Switch to Static Value (Number)"}
        >
          {isRightStatic ? (
            <span className="font-mono text-xs font-bold">123</span>
          ) : (
            <span className="font-mono text-[10px] font-bold">VAR</span>
          )}
        </Button>

        {/* Dynamic Right Input based on selected type */}
        <div className="flex-1">
          {isRightStatic ? (
            <Input
              type="text"
              value={leaf.right !== undefined && leaf.right !== null ? String(leaf.right) : ""}
              onChange={(e) => {
                const val = e.target.value;
                const num = Number(val);
                onChange({ ...leaf, right: isNaN(num) || val === "" ? val : num });
              }}
              className="font-mono text-xs h-9 bg-background border-input text-foreground w-full px-3 rounded-xl"
              placeholder="e.g. 1000"
            />
          ) : (
            <Select
              value={getSelectedValue(leaf.right)}
              onValueChange={(val) => handleSelectChange(val, "right")}
            >
              <SelectTrigger className="w-full text-xs h-9 bg-background border-input text-foreground font-mono px-3 rounded-xl">
                <SelectValue placeholder="Select Right Variable" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-popover border border-border text-popover-foreground font-mono text-xs max-h-[300px] min-w-[240px] z-50 rounded-xl">
                {variableOptions.map(group => (
                  <SelectGroup key={group.group}>
                    <SelectLabel className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider px-3 py-1.5 border-b border-border/40 mb-1">{group.group}</SelectLabel>
                    {group.items.map(item => (
                      <SelectItem key={item.value} value={item.value} className="text-xs px-3 py-2">
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="size-8 h-8 w-8 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-xl md:opacity-0 group-hover:opacity-100 transition-opacity self-end md:self-center shrink-0 cursor-pointer"
      >
        <IconX className="size-4" />
      </Button>
    </div>
  );
}

// ─── Nested Group Editor with Expand/Collapse & Drag-Drop ───
function ConditionGroupEditor({
  group,
  onChange,
  onRemove,
  depth,
  path,
  draggedPath,
  setDraggedPath,
  availableIndicators,
  upstreamSymbol,
  operatorTrail = ["ROOT"],
}: {
  group: ConditionGroup;
  onChange: (updated: ConditionGroup) => void;
  onRemove?: () => void;
  depth: number;
  path: number[];
  draggedPath: number[] | null;
  setDraggedPath: (path: number[] | null) => void;
  availableIndicators: UnifiedIndicator[];
  upstreamSymbol: string;
  operatorTrail?: string[];
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const updateChild = (index: number, updated: ConditionAST) => {
    const newChildren = [...group.children];
    newChildren[index] = updated;
    onChange({ ...group, children: newChildren });
  };

  const removeChild = (index: number) => {
    const newChildren = group.children.filter((_, i) => i !== index);
    onChange({ ...group, children: newChildren });
  };

  const addLeaf = () => {
    onChange({ ...group, children: [...group.children, makeDefaultLeaf(upstreamSymbol)] });
  };

  const addSubGroup = (op: "AND" | "OR") => {
    onChange({ ...group, children: [...group.children, makeDefaultGroup(upstreamSymbol, op)] });
  };



  // Reorder drop logic
  const handleDrop = (e: React.DragEvent, targetPath: number[]) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!draggedPath) return;

    const srcPath = draggedPath;
    setDraggedPath(null);

    if (srcPath.join(",") === targetPath.join(",")) return;

    // Trigger update up the tree
    const updatedAST = moveNodeInAST(group, srcPath.slice(depth), targetPath.slice(depth));
    onChange(updatedAST);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (depth === 0) return; // Cannot drag root
    e.stopPropagation();
    setDraggedPath(path);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("opacity-40");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedPath(null);
    e.currentTarget.classList.remove("opacity-40");
  };

  // Nesting Depth borders & backgrounds
  const depthColors = [
    { card: "border border-blue-100/70 dark:border-slate-800/80 border-l-4 border-l-blue-500 dark:border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/5", label: "text-blue-600 dark:text-blue-400" },
    { card: "border border-purple-100/70 dark:border-slate-800/80 border-l-4 border-l-purple-500 dark:border-l-purple-500 bg-purple-50/30 dark:bg-purple-950/10", label: "text-purple-600 dark:text-purple-400" },
    { card: "border border-amber-100/70 dark:border-slate-800/80 border-l-4 border-l-amber-500 dark:border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10", label: "text-amber-600 dark:text-amber-400" }
  ];
  const color = depthColors[depth % depthColors.length];

  // Operator selector styling color-coded by value rather than depth
  const operatorBadgeClass = group.operator === "AND"
    ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
    : "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20";

  return (
    <div
      draggable={depth > 0}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        handleDrop(e, path);
      }}
      className={cn(
        "rounded-2xl p-4 transition-all duration-200 flex flex-col gap-4 relative",
        color.card,
        isDragOver && "border-blue-500/80 bg-blue-500/[0.03] shadow-lg scale-[1.005]"
      )}
    >
      {/* Group header */}
      <div className="flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          {depth > 0 && (
            <div className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0 mr-1">
              <IconGripVertical className="size-4" />
            </div>
          )}
          
          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-muted/60 rounded text-muted-foreground hover:text-foreground shrink-0 transition-colors"
          >
            {isCollapsed ? (
              <IconChevronRight className="size-4" />
            ) : (
              <IconChevronDown className="size-4" />
            )}
          </button>

          {/* Logic select */}
          <Select
            value={group.operator}
            onValueChange={(val: any) => onChange({ ...group, operator: val })}
          >
            <SelectTrigger className={cn("w-20 text-[10px] h-6 font-bold uppercase tracking-wider rounded border z-10 px-2", operatorBadgeClass)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="min-w-[4rem] text-[10px] font-bold z-50">
              <SelectItem value="AND">AND</SelectItem>
              <SelectItem value="OR">OR</SelectItem>
            </SelectContent>
          </Select>

          {/* Local Breadcrumb indicator */}
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono hidden md:flex ml-2 tracking-wide font-medium bg-muted/40 px-2 py-0.5 rounded-md border border-border/20 select-none">
            {operatorTrail.map((op, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-muted-foreground/30">/</span>}
                <span className={cn(
                  idx === operatorTrail.length - 1 ? "text-foreground font-bold" : "text-muted-foreground/75"
                )}>
                  {op}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-medium tracking-wide">
            {group.children.length} {group.children.length === 1 ? "Item" : "Items"}
          </Badge>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="size-6 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
            >
              <IconTrash className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Children list (if not collapsed) */}
      {!isCollapsed && (
        <div className="flex flex-col gap-4 pl-6 border-l border-dashed border-border/40 ml-2">
          {group.children.map((child, i) => {
            const childPath = [...path, i];
            return (
              <div key={i}>
                {child.type === "CONDITION" ? (
                  <ConditionLeafEditor
                    leaf={child}
                    onChange={(updated) => updateChild(i, updated)}
                    onRemove={() => removeChild(i)}
                    index={i}
                    path={childPath}
                    draggedPath={draggedPath}
                    setDraggedPath={setDraggedPath}
                    onDrop={handleDrop}
                    availableIndicators={availableIndicators}
                    upstreamSymbol={upstreamSymbol}
                  />
                ) : (
                  <ConditionGroupEditor
                    group={child}
                    onChange={(updated) => updateChild(i, updated)}
                    onRemove={() => removeChild(i)}
                    depth={depth + 1}
                    path={childPath}
                    draggedPath={draggedPath}
                    setDraggedPath={setDraggedPath}
                    availableIndicators={availableIndicators}
                    upstreamSymbol={upstreamSymbol}
                    operatorTrail={[...operatorTrail, group.operator]}
                  />
                )}
              </div>
            );
          })}

          {/* Add buttons and Group Templates Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 shrink-0">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 text-[10px] border-dashed hover:bg-muted" onClick={addLeaf}>
                <IconPlus className="size-3 mr-1 text-emerald-500" /> Condition
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] border-dashed hover:bg-muted" onClick={() => addSubGroup("AND")}>
                <IconPlus className="size-3 mr-1 text-blue-500" /> AND Group
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] border-dashed hover:bg-muted" onClick={() => addSubGroup("OR")}>
                <IconPlus className="size-3 mr-1 text-purple-500" /> OR Group
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Drawer ───
export default function ConditionNodeDrawer() {
  const {
    nodes,
    edges,
    selectedNodeId,
    setSelectedNodeId,
    updateNodeData,
    setIsSynced,
  } = useNodesStore();

  const activeNode = nodes.find((n) => n.id === selectedNodeId);
  const isOpen = !!(activeNode && activeNode.type === "conditionNode");

  const [astRoot, setAstRoot] = useState<ConditionGroup>(() => makeDefaultGroup("BTCUSD"));
  const [draggedPath, setDraggedPath] = useState<number[] | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Resolve upstream symbol (datasource) connected to this condition node
  const upstreamSymbol: string = React.useMemo(() => {
    if (!activeNode || !edges || !nodes) return "BTCUSD";
    
    const findDataSource = (nodeId: string, visited = new Set<string>()): string | null => {
      if (visited.has(nodeId)) return null;
      visited.add(nodeId);
      
      const incomingEdges = edges.filter((e) => e.target === nodeId);
      for (const edge of incomingEdges) {
        const srcNode = nodes.find((n) => n.id === edge.source);
        if (!srcNode) continue;
        if (srcNode.type === "dataNode") {
          return (srcNode.data?.symbol as string) || null;
        }
        const sym = findDataSource(srcNode.id, visited);
        if (sym) return sym;
      }
      return null;
    };
    
    return findDataSource(activeNode.id) || "BTCUSD";
  }, [activeNode, edges, nodes]);

  // Resolve upstream dataNode object itself to show all its details
  const upstreamDataNode = React.useMemo(() => {
    if (!activeNode || !edges || !nodes) return null;
    
    const findDataNode = (nodeId: string, visited = new Set<string>()): any | null => {
      if (visited.has(nodeId)) return null;
      visited.add(nodeId);
      
      const incomingEdges = edges.filter((e) => e.target === nodeId);
      for (const edge of incomingEdges) {
        const srcNode = nodes.find((n) => n.id === edge.source);
        if (!srcNode) continue;
        if (srcNode.type === "dataNode") return srcNode;
        const res = findDataNode(srcNode.id, visited);
        if (res) return res;
      }
      return null;
    };
    
    return findDataNode(activeNode.id);
  }, [activeNode, edges, nodes]);

  // Resolve connected indicators upstream of this condition node
  const upstreamIndicatorNodes = React.useMemo(() => {
    if (!activeNode || !edges || !nodes) return [];
    const incoming = edges.filter((e) => e.target === activeNode.id);
    return incoming
      .map((e) => nodes.find((n) => n.id === e.source))
      .filter((n): n is NonNullable<typeof n> => !!n)
      .filter((n) => n.type === "indicatorNode");
  }, [activeNode, edges, nodes]);

  // Construct a unified flat list of all indicators configured inside connected indicator nodes
  const availableIndicators = React.useMemo(() => {
    const list: UnifiedIndicator[] = [];
    upstreamIndicatorNodes.forEach((node) => {
      const data = (node.data || {}) as any;
      if (Array.isArray(data.indicators)) {
        data.indicators.forEach((ind: any) => {
          const params: string[] = [];
          if (ind.period !== undefined) params.push(String(ind.period));
          if (ind.std !== undefined) params.push(String(ind.std));
          const paramStr = params.length > 0 ? `(${params.join(",")})` : "";
          list.push({
            nodeId: node.id,
            indicator: ind.indicator,
            period: ind.period,
            std: ind.std,
            label: `${ind.indicator}${paramStr}`,
            key: `${node.id}:${ind.indicator}`,
          });
        });
      } else if (data.indicator) {
        const params: string[] = [];
        if (data.period !== undefined) params.push(String(data.period));
        if (data.std !== undefined) params.push(String(data.std));
        const paramStr = params.length > 0 ? `(${params.join(",")})` : "";
        list.push({
          nodeId: node.id,
          indicator: data.indicator as string,
          period: data.period as number | undefined,
          std: data.std as number | undefined,
          label: `${data.indicator}${paramStr}`,
          key: `${node.id}:${data.indicator}`,
        });
      }
    });
    return list;
  }, [upstreamIndicatorNodes]);

  // Downstream targets
  const branches = React.useMemo(() => {
    if (!activeNode || !edges || !nodes) return { trueTargets: [] };
    const outgoing = edges.filter((e) => e.source === activeNode.id);
    const trueTargets = outgoing
      .filter((e) => e.sourceHandle === "true" || !e.sourceHandle)
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter(Boolean);
    return { trueTargets };
  }, [activeNode, edges, nodes]);

  useEffect(() => {
    if (isOpen && activeNode) {
      const data = activeNode.data as any;
      if (data.ast_root && data.ast_root.type === "GROUP") {
        setAstRoot(data.ast_root as ConditionGroup);
      } else if (data.expressions && Array.isArray(data.expressions)) {
        // Migrate legacy flat expressions to AST
        const children: ConditionLeaf[] = data.expressions.map((expr: any) => {
          const isRightStatic = !isNaN(Number(expr.rightOperand));
          return {
            type: "CONDITION" as const,
            left: { source: upstreamSymbol, field: expr.leftOperand || "Close" },
            operator: OP_SYMBOLS[expr.operator] || expr.operator || ">",
            right: isRightStatic 
              ? Number(expr.rightOperand) 
              : { source: upstreamSymbol, field: expr.rightOperand },
          };
        });
        setAstRoot({
          type: "GROUP",
          operator: data.expressions[1]?.logical_gate === "OR" ? "OR" : "AND",
          children: children.length > 0 ? children : [makeDefaultLeaf(upstreamSymbol)],
        });
      } else {
        setAstRoot(makeDefaultGroup(upstreamSymbol));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedNodeId, upstreamSymbol]);

  const handleApply = () => {
    if (!selectedNodeId) return;
    updateNodeData(selectedNodeId, {
      ...activeNode?.data,
      ast_root: astRoot,
      expressions: undefined,
      condition: renderAST(astRoot, nodes),
    });
    setIsSynced(false);
    setSelectedNodeId(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (selectedNodeId && activeNode) {
        updateNodeData(selectedNodeId, {
          ...activeNode.data,
          ast_root: astRoot,
          expressions: undefined,
          condition: renderAST(astRoot, nodes),
        });
        setIsSynced(false);
      }
      setSelectedNodeId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="fixed !top-6 !left-6 !w-[calc(100vw-3rem)] !h-[calc(100vh-3rem)] !max-w-none !max-h-none !translate-x-0 !translate-y-0 !transform-none !gap-0 !rounded-2xl !border !border-border !shadow-2xl !p-0 bg-background text-foreground flex flex-col z-50 overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-border px-6 flex items-center justify-between shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
              <IconGitBranch className="size-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
                Configure Condition AST
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Node ID: {activeNode?.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenChange(false)}
              className="size-8 text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer"
            >
              <IconX className="size-4" />
            </Button>
          </div>
        </div>

        {/* 2-Column Split Layout */}
        <div className="grow overflow-hidden flex bg-background">
          {/* Column 1: Available Variables (Left Sidebar) */}
          <div className="w-72 border-r border-border bg-slate-50/50 dark:bg-slate-900/10 flex flex-col h-full shrink-0">
            <div className="p-4 border-b border-border/60 shrink-0 flex items-center justify-between bg-card/50">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Available Variables
              </span>
            </div>
            <ScrollArea className="h-full w-full">
              <div className="p-4 space-y-5">
                {/* Data Source Variables */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                    <IconDatabase className="size-3.5 text-purple-500" />
                    <span>Price Fields ({upstreamSymbol})</span>
                  </div>
                  <div className="space-y-1.5">
                    {PRICE_FIELDS.map((field) => {
                      const variableText = `${upstreamSymbol}.${field}`;
                      const isCopied = copiedKey === variableText;
                      return (
                        <div
                          key={field}
                          className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/60 hover:border-border hover:shadow-xs transition-all text-xs font-mono group"
                        >
                          <span className="text-foreground font-medium">{variableText}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(variableText)}
                            className="size-6 h-6 w-6 text-muted-foreground hover:bg-muted"
                          >
                            {isCopied ? (
                              <IconCheck className="size-3 text-emerald-500" />
                            ) : (
                              <IconCopy className="size-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Technical Indicators */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                    <IconPlugConnected className="size-3.5 text-blue-500" />
                    <span>Indicator Outputs</span>
                  </div>
                  {availableIndicators.length > 0 ? (
                    <div className="space-y-2">
                      {availableIndicators.map((ind, i) => {
                        const outputs = INDICATOR_OUTPUTS[ind.indicator] || ["value"];
                        return (
                          <div key={`${ind.key}-${i}`} className="space-y-1 bg-card border border-border/60 rounded-xl p-2.5 shadow-2xs">
                            <div className="text-[10px] font-bold text-muted-foreground font-mono truncate border-b border-border/40 pb-1 mb-1.5">
                              {ind.label} ({ind.nodeId})
                            </div>
                            <div className="space-y-1">
                              {outputs.map((out) => {
                                const variableText = `${ind.label}.${out}`;
                                const isCopied = copiedKey === variableText;
                                return (
                                  <div
                                    key={out}
                                    className="flex items-center justify-between p-1.5 rounded-md bg-muted/40 text-[11px] font-mono hover:bg-muted/80 transition-colors group"
                                  >
                                    <span className="text-foreground/90">{out}</span>
                                    <button
                                      onClick={() => copyToClipboard(variableText)}
                                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                                      title={`Copy ${variableText}`}
                                    >
                                      {isCopied ? (
                                        <IconCheck className="size-3 text-emerald-500" />
                                      ) : (
                                        <IconCopy className="size-3 opacity-60 group-hover:opacity-100" />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center border border-dashed border-border rounded-lg text-[10px] text-muted-foreground select-none">
                      No upstream indicators connected.
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Column 2: Main AST builder workspace area with Shadcn ScrollArea */}
          <div className="flex-1 min-w-0 flex flex-col h-full">
            <ScrollArea className="h-full w-full">
              <div className="p-6 space-y-6">
                
                {/* Breadcrumb Info Bar */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                  <span>Nesting Breadcrumb:</span>
                  <span className="text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40 font-mono">
                    {astRoot.operator === "AND" ? "ROOT (AND)" : "ROOT (OR)"}
                  </span>
                </div>

                {/* Recursive AST Workspace */}
                <div className="p-1 border border-slate-200 dark:border-border/60 rounded-2xl bg-slate-50/30 dark:bg-card/10 grow min-h-[300px]">
                  <ConditionGroupEditor
                    group={astRoot}
                    onChange={setAstRoot}
                    depth={0}
                    path={[]}
                    draggedPath={draggedPath}
                    setDraggedPath={setDraggedPath}
                    availableIndicators={availableIndicators}
                    upstreamSymbol={upstreamSymbol}
                  />
                </div>

              </div>
            </ScrollArea>
          </div>

          {/* Column 3 removed */}
        </div>

        {/* Footer actions */}
        <div className="h-16 border-t border-border bg-card px-6 flex items-center justify-between shrink-0">
          {/* Compiled Expression Preview (Left aligned in footer) */}
          <div className="flex-1 min-w-0 max-w-[calc(100%-260px)] mr-4">
            <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 dark:bg-[#1a1b1c] border border-slate-200 dark:border-slate-800/80 px-3.5 py-1.5 rounded-xl select-none">
              <span className="bg-blue-600/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/20 font-black text-[10px] tracking-wider uppercase shrink-0">IF</span>
              <div className="overflow-x-auto whitespace-nowrap grow scrollbar-none flex items-center gap-1.5">
                {renderASTWithHighlight(astRoot, nodes)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              className="h-8 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="h-8 text-xs cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold"
            >
              Apply Condition AST
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
