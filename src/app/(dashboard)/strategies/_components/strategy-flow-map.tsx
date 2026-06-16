"use client";

import { useMemo } from "react";
import {
  IconCpu,
  IconChartBar,
  IconGitBranch,
  IconBolt,
  IconShield,
  IconActivity,
  IconArrowRight,
  IconCalendarTime,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
  if (!text) return <span className="text-zinc-500 italic">Always True (Pass Through)</span>;
  
  const tokens = text.split(/(\s+)/);
  return tokens.map((token, i) => {
    const trimmed = token.trim();
    if (!trimmed) return token; // Keep original whitespace spacing
    
    if (trimmed === "IF" || trimmed === "AND" || trimmed === "OR") {
      return <span key={i} className="text-indigo-400 font-extrabold tracking-wide">{trimmed}</span>;
    }
    if (["===", "==", "!=", ">=", "<=", ">", "<", "="].includes(trimmed)) {
      return <span key={i} className="text-amber-500 font-mono font-bold mx-1">{trimmed}</span>;
    }
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      return <span key={i} className="text-emerald-400 font-mono">{trimmed}</span>;
    }
    if (trimmed.includes("(")) {
      const parts = trimmed.split("(", 2);
      const name = parts[0];
      const rest = parts[1];
      return (
        <span key={i}>
          <span className="text-sky-400 font-semibold">{name}</span>
          <span className="text-zinc-500">({rest}</span>
        </span>
      );
    }
    if (trimmed.startsWith("Feed.") || trimmed.includes(".Close") || trimmed.includes(".value")) {
      return <span key={i} className="text-teal-400 font-mono">{trimmed}</span>;
    }
    return <span key={i} className="text-zinc-200">{trimmed}</span>;
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
      <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-zinc-800 rounded-2xl min-h-[260px] bg-zinc-950/20 backdrop-blur-sm">
        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 mb-3 shadow-inner">
          <IconCpu className="w-8 h-8 text-zinc-600 animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-zinc-300">No Strategy Blueprints Configured</p>
        <p className="text-xs text-zinc-500 mt-2 max-w-sm leading-relaxed">
          The pipeline definition is currently empty. Open the visual canvas editor to drag, connect, and customize nodes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full py-2">
      {/* Page Header Accent */}
      <div className="flex items-center gap-3 text-sky-400 font-bold font-mono text-xs tracking-[0.25em] pl-1 select-none">
        <div className="relative flex size-5 items-center justify-center bg-sky-950/40 rounded border border-sky-500/25">
          <IconCpu className="size-3.5 text-sky-400" />
          <span className="absolute -inset-0.5 rounded bg-sky-400/10 blur opacity-40"></span>
        </div>
        <span>STRATEGY PIPELINE & GRAPH BLUEPRINT</span>
      </div>

      <div className="flex flex-col gap-10">
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
              className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/10 backdrop-blur-xl transition-all duration-300 hover:border-zinc-700/60 hover:shadow-[0_0_40px_rgba(0,0,0,0.4)]"
            >
              {/* Top Accent Gradient Line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-sky-500/50 via-indigo-500/40 to-emerald-500/50 opacity-70 group-hover:opacity-100 transition-opacity"></div>

              {/* Pipeline Header */}
              <div className="bg-zinc-950/40 px-6 py-4 rounded-t-2xl border-b border-zinc-900 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-zinc-500 tracking-wider">PIPELINE {idx + 1}</span>
                      <span className="text-zinc-700 font-mono text-[9px]">•</span>
                      <span className="text-xs font-semibold text-emerald-400 font-mono">ACTIVE</span>
                    </div>
                    <span className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-400 tracking-tight">
                      {symbol}
                    </span>
                  </div>
                </div>

                {/* Pipeline Configurations */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-1 pr-2">
                    <div className="flex gap-1 items-center bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold font-mono px-2 py-0.5 rounded">
                      <IconCalendarTime className="size-3" />
                      {primaryTimeframe}
                    </div>
                    {secondaryTimeframes.length > 0 && (
                      <div className="flex items-center gap-1 pl-1.5">
                        <span className="text-zinc-600 font-mono text-[10px]">/</span>
                        {secondaryTimeframes.map((tf: string, i: number) => (
                          <span key={i} className="text-zinc-400 font-mono text-[10px] font-medium">
                            {tf}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold font-mono text-zinc-300 border-zinc-800 bg-zinc-950/80 py-1 px-3 rounded-lg shadow-sm"
                  >
                    ⚡ {leverage}X Leverage
                  </Badge>
                </div>
              </div>

              {/* Pipeline Logical Flow Grid */}
              <div className="p-6 grid grid-cols-1 xl:grid-cols-4 gap-6 relative">
                {/* Visual Data Connectors (Visible on Large Screens) */}
                <div className="hidden xl:block absolute top-1/2 left-[25%] -translate-y-1/2 text-zinc-800 pointer-events-none z-10">
                  <IconArrowRight className="size-5 animate-pulse text-zinc-800/80" />
                </div>
                <div className="hidden xl:block absolute top-1/2 left-[50%] -translate-y-1/2 text-zinc-800 pointer-events-none z-10">
                  <IconArrowRight className="size-5 animate-pulse text-zinc-800/80" />
                </div>
                <div className="hidden xl:block absolute top-1/2 left-[75%] -translate-y-1/2 text-zinc-800 pointer-events-none z-10">
                  <IconArrowRight className="size-5 animate-pulse text-zinc-800/80" />
                </div>

                {/* Column 1: Market Inputs & Indicators */}
                <Card className="bg-zinc-950/40 border border-zinc-900/60 rounded-xl overflow-hidden hover:border-zinc-800 transition-colors flex flex-col h-full">
                  <div className="px-4 py-3 bg-zinc-950/60 border-b border-zinc-900 flex items-center gap-2">
                    <IconChartBar className="size-4 text-sky-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-sans">Market Indicators</span>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col justify-start gap-3.5">
                    {indicators.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {indicators.flatMap((n: any) => n.data?.indicators || []).map((ind: any, i: number) => (
                          <div
                            key={i}
                            className="group/ind flex items-center justify-between p-2.5 rounded-lg border border-sky-500/5 bg-sky-950/[0.03] hover:bg-sky-500/[0.04] transition-colors"
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-mono font-bold text-sky-400">
                                {ind.indicator || ind.name || "Indicator"}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                period: {ind.period || 14} {ind.std !== undefined ? `| std: ${ind.std}` : ""}
                              </span>
                            </div>
                            <div className="size-1.5 rounded-full bg-sky-400/80 shadow-[0_0_6px_rgba(56,189,248,0.6)]"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-zinc-900 rounded-lg flex-1">
                        <IconActivity className="size-5 text-zinc-700 mb-1" />
                        <span className="text-[10px] text-zinc-600 font-mono">No Indicators</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Column 2: Execution Rules */}
                <Card className="bg-zinc-950/40 border border-zinc-900/60 rounded-xl overflow-hidden hover:border-zinc-800 transition-colors flex flex-col h-full">
                  <div className="px-4 py-3 bg-zinc-950/60 border-b border-zinc-900 flex items-center gap-2">
                    <IconGitBranch className="size-4 text-indigo-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-sans">Execution Logic</span>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col gap-3">
                    {conditions.length > 0 ? (
                      conditions.map((node: any) => {
                        let cond = node.data?.condition;
                        if (!cond && node.data?.ast_root) {
                          cond = renderAST(node.data.ast_root, canvasJson?.nodes || []);
                        }
                        return (
                          <div
                            key={node.id}
                            className="relative bg-zinc-950/90 border border-zinc-900 border-l-[3px] border-l-indigo-500 rounded-r-lg p-3 font-mono text-[11px] leading-relaxed break-all shadow-md group-hover:border-zinc-800 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1.5 text-[8px] text-zinc-500 font-bold uppercase tracking-wider">
                              <span>EVALUATOR</span>
                              <span className="size-1 rounded-full bg-indigo-500"></span>
                            </div>
                            <div className="text-zinc-100">{highlightCondition(cond)}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex-1 flex items-center justify-center bg-zinc-950/90 border border-dashed border-zinc-900 rounded-lg p-5 font-mono text-[11px] text-zinc-500 text-center">
                        Pass through logic
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Column 3: Dispatch Actions */}
                <Card className="bg-zinc-950/40 border border-zinc-900/60 rounded-xl overflow-hidden hover:border-zinc-800 transition-colors flex flex-col h-full">
                  <div className="px-4 py-3 bg-zinc-950/60 border-b border-zinc-900 flex items-center gap-2">
                    <IconBolt className="size-4 text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-sans">Routing & Dispatch</span>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col gap-3">
                    {actions.length > 0 ? (
                      actions.map((act: any) => {
                        const { actionType = "buy", sizing } = act.data || {};
                        const sizeVal = sizing?.value !== undefined ? sizing.value : "Market";
                        const sizeMode = sizing?.mode === "PERCENT_OF_EQUITY" ? "% Eq" : sizing?.mode === "FIXED_USD" ? " USD" : " Qty";
                        const sizeStr = sizing ? `${sizeVal}${sizeMode}` : "Market Sizing";
                        const isBuy = actionType.toLowerCase() === "buy";

                        return (
                          <div
                            key={act.id}
                            className="bg-zinc-950/90 border border-zinc-900 border-l-[3px] border-l-emerald-500 rounded-r-lg p-3 font-mono text-[11px] leading-relaxed shadow-md"
                          >
                            <div className="flex items-center justify-between mb-1.5 text-[8px] text-zinc-500 font-bold uppercase tracking-wider">
                              <span>ORDER DISPATCH</span>
                              <span className="size-1 rounded-full bg-emerald-500"></span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <div>
                                <span className="text-emerald-400 font-extrabold">THEN</span>
                                <span className="text-zinc-300"> dispatch:</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={`text-[9px] font-extrabold uppercase py-0 px-2 rounded font-mono ${
                                    isBuy
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  }`}
                                >
                                  {actionType}
                                </Badge>
                                <span className="text-[10px] text-zinc-500">at {sizeStr}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-6 text-center border border-dashed border-zinc-900 rounded-lg">
                        <span className="text-[10px] text-zinc-600 font-mono">No Actions Defined</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Column 4: Exit Safeguards */}
                <Card className="bg-zinc-950/40 border border-zinc-900/60 rounded-xl overflow-hidden hover:border-zinc-800 transition-colors flex flex-col h-full">
                  <div className="px-4 py-3 bg-zinc-950/60 border-b border-zinc-900 flex items-center gap-2">
                    <IconShield className="size-4 text-rose-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-sans">Risk Safeguards</span>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col gap-3">
                    {(() => {
                      const allPolicies = policies.flatMap((n: any) => n.data?.policies || []);
                      return allPolicies.length > 0 ? (
                        <div className="flex flex-col gap-2.5">
                          {allPolicies.map((pol: any, i: number) => {
                            const isStopLoss = pol.type === "stop_loss";
                            const typeLabelStr = isStopLoss ? "Stop Loss"
                              : pol.type === "take_profit" ? "Take Profit"
                              : pol.type === "trailing_stop" ? "Trailing Stop"
                              : pol.type === "break_even" ? "Break Even"
                              : pol.type || "Exit Policy";

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
                              <div
                                key={i}
                                className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${
                                  isStopLoss
                                    ? "bg-rose-950/[0.03] border-rose-500/10 text-rose-400"
                                    : "bg-amber-950/[0.03] border-amber-500/10 text-amber-400"
                                }`}
                              >
                                <IconShield className={`size-3.5 mt-0.5 shrink-0 ${isStopLoss ? "text-rose-400" : "text-amber-400"}`} />
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold font-mono tracking-wide">{typeLabelStr}</span>
                                  <span className="text-[10px] text-zinc-400 font-mono mt-0.5">{detail}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center p-6 text-center border border-dashed border-zinc-900 rounded-lg">
                          <span className="text-[10px] text-zinc-600 font-mono">No exit limits set</span>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

