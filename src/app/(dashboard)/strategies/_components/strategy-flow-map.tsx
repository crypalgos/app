"use client";

import { useMemo } from "react";
import {
  IconCpu,
  IconChartBar,
  IconGitBranch,
  IconBolt,
  IconShield,
  IconCalendarTime,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCoinLogoUrl } from "@/lib/instruments";
import { cn } from "@/lib/utils";
import React from "react";

interface StrategyFlowMapProps {
  canvasJson?: any;
}

// ─── Constants for Operators & Triggers ──────────────────────────────────────

const OP_SYMBOLS: Record<string, string> = {
  GREATER_THAN: ">",
  LESS_THAN: "<",
  GREATER_THAN_EQUAL: ">=",
  LESS_THAN_EQUAL: "<=",
  EQUAL_TO: "==",
  NOT_EQUAL_TO: "!=",
};

// ─── AST Condition Renderer ──────────────────────────────────────────────────

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

// Render Condition Operand
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

// Render Full AST Group/Condition Trees
function renderAST(node: any, nodes: any[] = []): string {
  if (!node) return "No condition set";
  if (node.type === "CONDITION") {
    const left = renderOperand(node.left, nodes);
    const op = OP_SYMBOLS[node.operator] || node.operator || ">";
    const right = renderOperand(node.right, nodes);
    return `${left} ${op} ${right}`;
  }
  if (node.type === "GROUP") {
    const children = (node.children || []).map((c: any) => renderAST(c, nodes));
    if (children.length === 0) return "Empty group";
    if (children.length === 1) return children[0];
    return `(${children.join(` ${node.operator} `)})`;
  }
  return "No condition set";
}

// Helper for Syntax Highlighting Rules
function highlightCondition(text: string) {
  if (!text) return <span className="text-muted-foreground/60 italic font-sans">Always True (Pass Through)</span>;
  
  // Normalize string to fix missing spaces around operators from DB
  let normalized = text
    .replace(/\.valueAND/g, ".value AND ")
    .replace(/\.valueOR/g, ".value OR ")
    .replace(/([0-9])AND/g, "$1 AND ")
    .replace(/([0-9])OR/g, "$1 OR ")
    .replace(/AND([A-Z])/g, "AND $1")
    .replace(/OR([A-Z])/g, "OR $1");

  const tokens = normalized.split(/(\s+)/);
  return tokens.map((token, i) => {
    const trimmed = token.trim();
    if (!trimmed) return token; // Keep original whitespace spacing
    
    // Logic Operators
    if (["AND", "OR", "NOT"].includes(trimmed)) {
      return <span key={i} className="text-indigo-600 font-extrabold tracking-wide dark:text-indigo-400">{trimmed}</span>;
    }

    // Math / Comparison Operators
    if (["===", "==", "!=", ">=", "<=", ">", "<", "="].includes(trimmed)) {
      return <span key={i} className="text-amber-500 font-bold mx-1">{trimmed}</span>;
    }

    // Special Strategy Operators (CROSSES_ABOVE, CROSSES_BELOW, etc)
    if (trimmed.includes("CROSSES_ABOVE") || trimmed.includes("CROSSES_BELOW")) {
      return (
        <span key={i} className="text-fuchsia-600 dark:text-fuchsia-400 font-bold text-[10.5px] uppercase tracking-wider mx-1.5 bg-fuchsia-500/10 px-1.5 py-0.5 rounded border border-fuchsia-500/20 shadow-sm">
          {trimmed.replace(/_/g, " ")}
        </span>
      );
    }

    // Numbers
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      return <span key={i} className="text-emerald-600 font-mono font-semibold dark:text-emerald-400">{trimmed}</span>;
    }

    // Function calls with arguments e.g. EMA(30).value
    const funcMatch = trimmed.match(/^([A-Za-z0-9_]+)\(([^)]+)\)(\.[a-zA-Z0-9_]+)?$/);
    if (funcMatch) {
      const fnName = funcMatch[1];
      const arg = funcMatch[2];
      const property = funcMatch[3] || "";
      return (
        <span key={i} className="inline-flex items-baseline">
          <span className="text-blue-600 font-bold dark:text-blue-400">{fnName}</span>
          <span className="text-muted-foreground/60">(</span>
          <span className="text-emerald-600 font-semibold dark:text-emerald-400">{arg}</span>
          <span className="text-muted-foreground/60">)</span>
          {property && <span className="text-muted-foreground font-medium">{property}</span>}
        </span>
      );
    }

    // Dot notation generic (Feed.Close)
    if (trimmed.includes(".")) {
      const parts = trimmed.split(".");
      return (
        <span key={i}>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">{parts[0]}</span>
          <span className="text-muted-foreground">.</span>
          <span className="text-teal-600 dark:text-teal-400 font-medium">{parts.slice(1).join(".")}</span>
        </span>
      );
    }
    
    // Fallback variable names
    return <span key={i} className="text-foreground font-medium">{trimmed}</span>;
  });
}

export function StrategyFlowMap({ canvasJson }: StrategyFlowMapProps) {
  // Trace nodes horizontally into distinct logic pathways
  const pipelines = useMemo(() => {
    if (!canvasJson || !canvasJson.nodes) return [];
    const nodes = canvasJson.nodes || [];
    const edges = canvasJson.edges || [];

    // Identify asset data feeds to start pipelines
    const dataNodes = nodes.filter((n: any) => n.type === "dataNode");

    if (dataNodes.length === 0 && nodes.length > 0) {
      // Fallback: If no dataNodes are found, group all configured indicators/rules into a general list
      return [{
        dataNode: { data: { symbol: "Global Assets", timeframe: "N/A", leverage: "N/A" } },
        indicators: nodes.filter((n: any) => n.type === "indicatorNode"),
        conditions: nodes.filter((n: any) => n.type === "conditionNode"),
        actions: nodes.filter((n: any) => n.type === "actionNode"),
        policies: nodes.filter((n: any) => 
          n.type === "policyGroupNode" || 
          n.type === "riskManagementNode" || 
          n.type === "riskManagement" || 
          n.type === "policyGroup"
        ),
      }];
    }

    return dataNodes.map((dataNode: any) => {
      // Find all downstream nodes reachable from this dataNode
      const visited = new Set<string>();
      const queue = [dataNode.id];
      visited.add(dataNode.id);

      while (queue.length > 0) {
        const currId = queue.shift()!;
        const targets = edges.filter((e: any) => e.source === currId).map((e: any) => e.target);
        for (const targetId of targets) {
          if (!visited.has(targetId)) {
            visited.add(targetId);
            queue.push(targetId);
          }
        }
      }

      // Filter the reached nodes by their respective types
      const pipelineNodes = Array.from(visited)
        .map(id => nodes.find((n: any) => n.id === id))
        .filter(Boolean);

      const indicatorNodes = pipelineNodes.filter((n: any) => n.type === "indicatorNode");
      const conditionNodes = pipelineNodes.filter((n: any) => n.type === "conditionNode");
      const actionNodes = pipelineNodes.filter((n: any) => n.type === "actionNode");
      const policyNodes = pipelineNodes.filter((n: any) => 
        n.type === "policyGroupNode" || 
        n.type === "riskManagementNode" || 
        n.type === "riskManagement" || 
        n.type === "policyGroup"
      );

      return {
        dataNode,
        indicators: indicatorNodes,
        conditions: conditionNodes,
        actions: actionNodes,
        policies: policyNodes,
      };
    });
  }, [canvasJson]);

  if (pipelines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-border rounded-2xl min-h-[260px] bg-muted/20 backdrop-blur-sm">
        <div className="p-3 bg-muted rounded-xl border border-border mb-3 shadow-inner">
          <IconCpu className="w-8 h-8 text-muted-foreground animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-foreground">No Strategy Blueprints Configured</p>
        <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
          The pipeline definition is currently empty. Open the visual canvas editor to drag, connect, and customize nodes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full py-2">
      <div className="flex flex-col gap-8">
        {pipelines.map((pipeline: any, idx: number) => {
          const { dataNode, indicators, conditions, actions, policies } = pipeline;
          const symbol = dataNode?.data?.symbol || "Global Asset";
          const timeframesArray = dataNode?.data?.timeframes;
          const primaryTimeframe = Array.isArray(timeframesArray) && timeframesArray.length > 0
            ? timeframesArray[0]
            : (dataNode?.data?.timeframe || "1h");
          const secondaryTimeframes = Array.isArray(timeframesArray) && timeframesArray.length > 1
            ? timeframesArray.slice(1)
            : [];
          const leverage = dataNode?.data?.leverage || 10;

          return (
            <div
              key={idx}
              className="group relative rounded-2xl border border-border/60 bg-card/30 backdrop-blur-xl transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:-translate-y-[2px]"
            >
              {/* Pipeline Header */}
              <div className="px-6 py-5 rounded-t-2xl border-b border-border/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={getCoinLogoUrl(symbol.replace(/USD[T]?|PERP/i, ''))} 
                      alt={symbol}
                      className="w-7 h-7 rounded-full shadow-sm"
                      onError={(e) => {
                         (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${symbol}&background=random`;
                      }}
                    />
                    <span className="text-lg font-extrabold text-foreground tracking-tight">
                      {symbol}
                    </span>
                    <div className="h-4 w-px bg-border/60 mx-2" />
                    <span className="text-[10px] font-mono font-bold text-muted-foreground/70 uppercase tracking-widest">
                      Pipeline {idx + 1}
                    </span>
                  </div>
                </div>

                {/* Pipeline Configurations */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Timeframe Tag */}
                  <div className="flex items-center border border-border/60 rounded-md bg-muted/10 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 border-r border-border/50">
                      <IconCalendarTime className="size-3.5" />
                      <span className="text-[10.5px] font-mono font-extrabold tracking-wide">{primaryTimeframe}</span>
                    </div>
                    {secondaryTimeframes.length > 0 && (
                      <div className="flex items-center gap-1 px-2">
                        {secondaryTimeframes.map((tf: string, i: number) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span className="text-muted-foreground/40 font-mono text-[10px]">/</span>}
                            <span className="text-muted-foreground/80 font-mono text-[10px] font-semibold">{tf}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Leverage Tag */}
                  <div className="flex items-center border border-border/60 rounded-md bg-muted/10 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2.5 py-1">
                      <span className="text-xs">⚡</span>
                      <span className="text-[10.5px] font-mono font-extrabold tracking-wide">{leverage}X Leverage</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2x2 Grid Layout Contents */}
              <CardContent className="p-6 flex flex-col gap-6">
                
                {/* Row 1: Market Inputs & Exit Safeguards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-border/30 pb-6">
                  
                  {/* Left Column: Indicators Configured */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-2 mb-2">
                      <IconChartBar className="size-4 text-muted-foreground/70" />
                      Indicators Configured
                    </span>
                    <div className="flex flex-wrap gap-2.5 mt-1">
                      {indicators.length > 0 ? (
                        indicators.flatMap((n: any) => n.data?.indicators || []).map((ind: any, i: number) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="font-mono text-[11px] font-bold py-1 px-3.5 rounded-full border shadow-sm border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-500"
                          >
                            {ind.indicator || ind.name || "Indicator"} 
                            <span className="text-cyan-700/70 dark:text-cyan-500/70 font-medium ml-1.5">({ind.period || 14})</span>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic pl-1">No technical indicators configured.</span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Exit Safeguards */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-2 mb-2">
                      <IconShield className="size-4 text-muted-foreground/70" />
                      Exit Safeguards
                    </span>
                    <div className="flex flex-wrap gap-2.5 mt-1">
                      {(() => {
                        const allPolicies = policies.flatMap((n: any) => n.data?.policies || []);
                        return allPolicies.length > 0 ? (
                          allPolicies.map((pol: any, i: number) => {
                            const isStopLoss = pol.type === "stop_loss";
                            const typeLabelStr = isStopLoss ? "Stop Loss"
                              : pol.type === "take_profit" ? "Take Profit"
                              : pol.type === "trailing_stop" ? "Trailing Stop"
                              : pol.type === "break_even" ? "Break Even"
                              : pol.type || "Exit";

                            let detail = "";
                            if (pol.type === "break_even") {
                              detail = `Trigger: ${pol.trigger_rr || 0} RR`;
                            } else {
                              const modeSymbol = pol.mode === "PERCENTAGE" ? "%"
                                : pol.mode === "ATR_MULTIPLE" ? "x ATR"
                                : pol.mode === "FIXED_PRICE" ? " USD"
                                : pol.mode === "TICKS" ? " Ticks"
                                : pol.mode || "";
                              detail = `${pol.value || 0}${modeSymbol}`;
                              if (pol.quantity_pct !== undefined && pol.quantity_pct !== null) {
                                detail += ` (${(pol.quantity_pct * 100).toFixed(0)}% qty)`;
                              }
                            }

                            return (
                              <Badge
                                key={i}
                                variant="outline"
                                className={`font-mono text-[11px] font-bold py-1 px-3.5 rounded-full border shadow-sm ${
                                  isStopLoss
                                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                                    : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-500"
                                }`}
                              >
                                {typeLabelStr}: {detail}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground italic pl-1">No custom exit policies configured.</span>
                        );
                      })()}
                    </div>
                  </div>

                </div>

                {/* Row 2: Logic Rules & Dispatch Actions */}
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-2">
                      <IconGitBranch className="size-4 text-muted-foreground/70" />
                      Execution Rules
                    </span>
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-2 hidden md:flex">
                      <IconBolt className="size-4 text-muted-foreground/70" />
                      Dispatch Actions
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    {Array.from({ length: Math.max(conditions.length || 1, actions.length || 1) }).map((_, i) => {
                      const node = conditions[i];
                      const act = actions[i];

                      return (
                        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                          {/* Left Column: Rule */}
                          <div className="h-full">
                            {node ? (() => {
                              let cond = node.data?.condition;
                              if (!cond && node.data?.ast_root) {
                                cond = renderAST(node.data.ast_root, canvasJson?.nodes || []);
                              }
                              return (
                                <div className={cn(
                                  "group h-full relative bg-card dark:bg-[#0a0a0a] border border-black/5 dark:border-[#1e1e1e] rounded-[16px] p-5 font-mono text-xs text-foreground shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none flex flex-col justify-start transition-all duration-300 ease-out cursor-default",
                                  "hover:-translate-y-0.5 hover:border-indigo-500/30 hover:shadow-[0_8px_30px_-10px_rgba(99,102,241,0.15)] dark:hover:shadow-[0_8px_30px_-10px_rgba(99,102,241,0.2)]"
                                )}>
                                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-[16px] pointer-events-none" />
                                  <div className="flex items-center justify-between mb-4 relative z-10">
                                    <span className="text-[9.5px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-sm">
                                      Rule Evaluator
                                    </span>
                                  </div>
                                  <div className="relative z-10 text-[13px] leading-relaxed flex items-center flex-wrap gap-y-2">
                                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 mr-2 tracking-wide">IF</span>
                                    {highlightCondition(cond)}
                                  </div>
                                </div>
                              );
                            })() : (
                              <div className="h-full bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 rounded-[16px] p-6 font-mono text-[13px] text-muted-foreground text-center flex flex-col justify-center shadow-inner">
                                Always True (Pass Through)
                              </div>
                            )}
                          </div>

                          {/* Right Column: Action */}
                          <div className="h-full">
                            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-2 md:hidden mb-2">
                              <IconBolt className="size-4 text-muted-foreground/70" />
                              Dispatch Actions
                            </span>
                            {act ? (() => {
                              const { actionType = "buy", sizing } = act.data || {};
                              const sizeVal = sizing?.value !== undefined ? sizing.value : "Market";
                              const sizeMode = sizing?.mode === "PERCENT_OF_EQUITY" ? "% Eq" : sizing?.mode === "FIXED_USD" ? " USD" : " Qty";
                              const sizeStr = sizing ? `${sizeVal}${sizeMode}` : "Market Sizing";
                              const isBuy = actionType.toLowerCase() === "buy";

                              return (
                                <div className={cn(
                                  "group h-full relative bg-card dark:bg-[#0a0a0a] border border-black/5 dark:border-[#1e1e1e] rounded-[16px] p-5 font-mono text-xs text-foreground shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none flex flex-col justify-start transition-all duration-300 ease-out cursor-default",
                                  isBuy 
                                    ? "hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_-10px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_8px_30px_-10px_rgba(16,185,129,0.2)]"
                                    : "hover:-translate-y-0.5 hover:border-amber-500/30 hover:shadow-[0_8px_30px_-10px_rgba(245,158,11,0.15)] dark:hover:shadow-[0_8px_30px_-10px_rgba(245,158,11,0.2)]"
                                )}>
                                  <div className={cn(
                                    "absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-[16px] pointer-events-none",
                                    isBuy ? "from-emerald-500/5" : "from-amber-500/5"
                                  )} />
                                  <div className="flex items-center justify-between mb-4 relative z-10">
                                    <span className={`text-[9.5px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded border shadow-sm ${isBuy ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20'}`}>
                                      Order Dispatcher
                                    </span>
                                  </div>
                                  <div className="relative z-10 text-[13px] leading-relaxed flex items-center flex-wrap gap-y-2">
                                    <span className={`font-extrabold mr-2 tracking-wide ${isBuy ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500'}`}>THEN</span>
                                    <span className="text-foreground/80 font-medium mr-1.5">Execute order:</span>
                                    <Badge
                                      className={`text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded shadow-sm font-mono ${
                                        isBuy
                                          ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                          : "bg-amber-500 text-white hover:bg-amber-600"
                                      }`}
                                    >
                                      {actionType}
                                    </Badge>
                                    <span className="text-muted-foreground/80 text-[11px] ml-2 font-medium border border-border/50 bg-background/50 px-2 py-0.5 rounded shadow-sm">
                                      {sizeStr} sizing
                                    </span>
                                  </div>
                                </div>
                              );
                            })() : (
                              <div className="h-full bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 rounded-[16px] p-6 font-mono text-[13px] text-muted-foreground text-center flex flex-col justify-center shadow-inner">
                                No Dispatch Action Configured
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </CardContent>
            </div>
          );
        })}
      </div>
    </div>
  );
}
