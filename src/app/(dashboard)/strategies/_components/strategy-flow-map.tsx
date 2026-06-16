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
  if (!text) return <span className="text-muted-foreground/60 italic font-sans">Always True (Pass Through)</span>;
  
  const tokens = text.split(/(\s+)/);
  return tokens.map((token, i) => {
    const trimmed = token.trim();
    if (!trimmed) return token; // Keep original whitespace spacing
    
    if (trimmed === "IF" || trimmed === "AND" || trimmed === "OR") {
      return <span key={i} className="text-primary font-extrabold tracking-wide dark:text-sky-400">{trimmed}</span>;
    }
    if (["===", "==", "!=", ">=", "<=", ">", "<", "="].includes(trimmed)) {
      return <span key={i} className="text-amber-500 font-mono font-bold mx-1">{trimmed}</span>;
    }
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      return <span key={i} className="text-emerald-500 font-mono dark:text-emerald-400">{trimmed}</span>;
    }
    if (trimmed.includes("(")) {
      const parts = trimmed.split("(", 2);
      const name = parts[0];
      const rest = parts[1];
      return (
        <span key={i}>
          <span className="text-indigo-600 font-bold dark:text-indigo-400">{name}</span>
          <span className="text-muted-foreground">({rest}</span>
        </span>
      );
    }
    if (trimmed.startsWith("Feed.") || trimmed.includes(".Close") || trimmed.includes(".value")) {
      return <span key={i} className="text-teal-600 font-mono dark:text-teal-400">{trimmed}</span>;
    }
    return <span key={i} className="text-foreground">{trimmed}</span>;
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
      {/* Page Header Accent */}
      <div className="flex items-center gap-3 text-primary font-bold font-mono text-xs tracking-[0.25em] pl-1 select-none">
        <div className="relative flex size-5 items-center justify-center bg-primary/10 rounded border border-primary/20">
          <IconCpu className="size-3.5 text-primary" />
          <span className="absolute -inset-0.5 rounded bg-primary/20 blur opacity-45"></span>
        </div>
        <span>STRATEGY PIPELINE & GRAPH BLUEPRINT</span>
      </div>

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
              {/* Top Accent Gradient Line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-primary/50 via-indigo-500/40 to-emerald-500/50 opacity-70 group-hover:opacity-100 transition-opacity"></div>

              {/* Pipeline Header */}
              <div className="bg-muted/30 px-6 py-4 rounded-t-2xl border-b border-border flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-wider">PIPELINE {idx + 1}</span>
                      <span className="text-border font-mono text-[9px]">•</span>
                      <span className="text-xs font-semibold text-success font-mono">ACTIVE</span>
                    </div>
                    <span className="text-base font-extrabold text-foreground tracking-tight">
                      {symbol}
                    </span>
                  </div>
                </div>

                {/* Pipeline Configurations */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center bg-muted/80 border border-border/80 rounded-lg p-1 pr-2">
                    <div className="flex gap-1 items-center bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold font-mono px-2 py-0.5 rounded">
                      <IconCalendarTime className="size-3" />
                      {primaryTimeframe}
                    </div>
                    {secondaryTimeframes.length > 0 && (
                      <div className="flex items-center gap-1 pl-1.5">
                        <span className="text-muted-foreground/60 font-mono text-[10px]">/</span>
                        {secondaryTimeframes.map((tf: string, i: number) => (
                          <span key={i} className="text-muted-foreground font-mono text-[10px] font-medium">
                            {tf}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold font-mono text-foreground border-border bg-muted/85 py-1 px-3 rounded-lg shadow-sm"
                  >
                    ⚡ {leverage}X Leverage
                  </Badge>
                </div>
              </div>

              {/* Pipeline Logical Flow Grid */}
              <div className="p-6 grid grid-cols-1 xl:grid-cols-4 gap-6 relative">
                {/* Visual Data Connectors (Visible on Large Screens) */}
                <div className="hidden xl:block absolute top-1/2 left-[25%] -translate-y-1/2 text-muted-foreground/30 pointer-events-none z-10">
                  <IconArrowRight className="size-5 animate-pulse text-muted-foreground/45" />
                </div>
                <div className="hidden xl:block absolute top-1/2 left-[50%] -translate-y-1/2 text-muted-foreground/30 pointer-events-none z-10">
                  <IconArrowRight className="size-5 animate-pulse text-muted-foreground/45" />
                </div>
                <div className="hidden xl:block absolute top-1/2 left-[75%] -translate-y-1/2 text-muted-foreground/30 pointer-events-none z-10">
                  <IconArrowRight className="size-5 animate-pulse text-muted-foreground/45" />
                </div>

                {/* Column 1: Market Inputs & Indicators */}
                <Card className="bg-card/40 border border-border/50 rounded-xl overflow-hidden hover:border-border transition-colors flex flex-col h-full">
                  <div className="px-4 py-3 bg-muted/40 border-b border-border/50 flex items-center gap-2">
                    <IconChartBar className="size-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-sans">Market Indicators</span>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col justify-start gap-3">
                    {indicators.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {indicators.flatMap((n: any) => n.data?.indicators || []).map((ind: any, i: number) => (
                          <div
                            key={i}
                            className="group/ind flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-mono font-bold text-primary">
                                {ind.indicator || ind.name || "Indicator"}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                period: {ind.period || 14} {ind.std !== undefined ? `| std: ${ind.std}` : ""}
                              </span>
                            </div>
                            <div className="size-1.5 rounded-full bg-primary/80 shadow-[0_0_6px_rgba(56,189,248,0.4)]"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-border rounded-lg flex-1">
                        <IconActivity className="size-5 text-muted-foreground/40 mb-1" />
                        <span className="text-[10px] text-muted-foreground font-mono">No Indicators</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Column 2: Execution Rules */}
                <Card className="bg-card/40 border border-border/50 rounded-xl overflow-hidden hover:border-border transition-colors flex flex-col h-full">
                  <div className="px-4 py-3 bg-muted/40 border-b border-border/50 flex items-center gap-2">
                    <IconGitBranch className="size-4 text-indigo-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-sans">Execution Logic</span>
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
                            className="relative bg-muted/30 border border-border border-l-[3px] border-l-indigo-500 rounded-r-lg p-3 font-mono text-[11px] leading-relaxed break-all shadow-sm transition-colors hover:border-border/80"
                          >
                            <div className="flex items-center justify-between mb-1.5 text-[8px] text-muted-foreground font-bold uppercase tracking-wider">
                              <span>EVALUATOR</span>
                              <span className="size-1 rounded-full bg-indigo-500"></span>
                            </div>
                            <div className="text-foreground">{highlightCondition(cond)}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex-1 flex items-center justify-center bg-muted/10 border border-dashed border-border rounded-lg p-5 font-mono text-[11px] text-muted-foreground text-center">
                        Pass through logic
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Column 3: Dispatch Actions */}
                <Card className="bg-card/40 border border-border/50 rounded-xl overflow-hidden hover:border-border transition-colors flex flex-col h-full">
                  <div className="px-4 py-3 bg-muted/40 border-b border-border/50 flex items-center gap-2">
                    <IconBolt className="size-4 text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-sans">Routing & Dispatch</span>
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
                            className="bg-muted/30 border border-border border-l-[3px] border-l-emerald-500 rounded-r-lg p-3 font-mono text-[11px] leading-relaxed shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-1.5 text-[8px] text-muted-foreground font-bold uppercase tracking-wider">
                              <span>ORDER DISPATCH</span>
                              <span className="size-1 rounded-full bg-emerald-500"></span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <div>
                                <span className="text-emerald-500 font-extrabold">THEN</span>
                                <span className="text-muted-foreground"> dispatch:</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={`text-[9px] font-extrabold uppercase py-0 px-2 rounded font-mono ${
                                    isBuy
                                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400"
                                      : "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400"
                                  }`}
                                >
                                  {actionType}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-sans">at {sizeStr}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-6 text-center border border-dashed border-border rounded-lg">
                        <span className="text-[10px] text-muted-foreground font-mono">No Actions Defined</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Column 4: Exit Safeguards */}
                <Card className="bg-card/40 border border-border/50 rounded-xl overflow-hidden hover:border-border transition-colors flex flex-col h-full">
                  <div className="px-4 py-3 bg-muted/40 border-b border-border/50 flex items-center gap-2">
                    <IconShield className="size-4 text-destructive" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-sans">Risk Safeguards</span>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col gap-3">
                    {(() => {
                      const allPolicies = policies.flatMap((n: any) => n.data?.policies || []);
                      return allPolicies.length > 0 ? (
                        <div className="flex flex-col gap-2">
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
                                    ? "bg-destructive/5 border-destructive/15 text-destructive"
                                    : "bg-amber-500/5 border-amber-500/15 text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                <IconShield className="size-3.5 mt-0.5 shrink-0" />
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold font-mono tracking-wide">{typeLabelStr}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{detail}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center p-6 text-center border border-dashed border-border rounded-lg">
                          <span className="text-[10px] text-muted-foreground font-mono">No exit limits set</span>
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
