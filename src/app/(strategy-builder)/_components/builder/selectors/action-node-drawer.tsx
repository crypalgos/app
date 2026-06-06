"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FieldGroup, Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  IconBolt,
  IconX,
  IconGitBranch,
  IconInfoCircle,
  IconArrowRight,
} from "@tabler/icons-react";
import { useNodesStore } from "../../../store/nodes-store";
import { cn } from "@/lib/utils";

const ACTION_TYPES = [
  { value: "buy", label: "Market Buy / Long Position", group: "Trading" },
  { value: "sell", label: "Market Sell / Short Position", group: "Trading" },
  { value: "place_limit_order", label: "Limit Order Placement", group: "Trading" },
  { value: "close_all", label: "Close All Positions", group: "Trading" },
  { value: "reduce_position", label: "Reduce Active Sizing", group: "Trading" },
  { value: "cancel_all_orders", label: "Cancel Pending Orders", group: "Trading" },
] as const;

const TRIGGERS = [
  { value: "IMMEDIATE", label: "Immediate (On Bar)" },
  { value: "ON_FILL", label: "On Order Fill" },
  { value: "ON_POSITION_OPEN", label: "On Position Opened" },
  { value: "ON_POSITION_CLOSE", label: "On Position Closed" },
  { value: "ON_PROFIT_TARGET", label: "On Take Profit Hit" },
  { value: "ON_STOP_LOSS", label: "On Stop Loss Hit" },
  { value: "ON_BAR_CLOSE", label: "On Bar Close" },
] as const;

export default function ActionNodeDrawer() {
  const {
    nodes,
    edges,
    selectedNodeId,
    setSelectedNodeId,
    updateNodeData,
    setIsSynced,
  } = useNodesStore();

  const activeNode = nodes.find((n) => n.id === selectedNodeId);
  const isOpen = !!(
    activeNode &&
    (activeNode.type === "actionNode" || activeNode.type === "utilityNode")
  );

  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (isOpen && activeNode) {
      const data = activeNode.data || {};
      // If legacy steps[] exist, migrate the first step to flat params
      if ((data as any).steps && Array.isArray((data as any).steps) && (data as any).steps.length > 0) {
        const step = (data as any).steps[0];
        const sizing = (step.sizing || {}) as any;
        let sizingMode = sizing.mode;
        let sizingValue = sizing.value;
        if (!sizingMode) {
          if (step.amount !== undefined && step.amount !== null) {
            sizingMode = "FIXED_QUANTITY";
            sizingValue = step.amount;
          } else {
            sizingMode = "PERCENT_OF_EQUITY";
            sizingValue = 10;
          }
        } else if (sizingMode === "PERCENT_OF_EQUITY") {
          sizingValue = sizingValue !== undefined ? sizingValue * 100 : 10;
        }

        setFormData({
          ...data,
          actionType: step.actionType || "buy",
          sl: step.sl,
          tp: step.tp,
          limit_price: step.limit_price,
          percentage: step.percentage,
          side: step.side,
          trigger: (data as any).trigger || "IMMEDIATE",
          sizing_mode: sizingMode,
          sizing_value: sizingValue,
          steps: undefined,
        });
      } else {
        const sizing = (data.sizing || {}) as any;
        let sizingMode = sizing.mode;
        let sizingValue = sizing.value;
        if (!sizingMode) {
          if (data.amount !== undefined && data.amount !== null) {
            sizingMode = "FIXED_QUANTITY";
            sizingValue = data.amount;
          } else {
            sizingMode = "PERCENT_OF_EQUITY";
            sizingValue = 10;
          }
        } else if (sizingMode === "PERCENT_OF_EQUITY") {
          sizingValue = sizingValue !== undefined ? sizingValue * 100 : 10;
        }

        setFormData({
          actionType: "buy",
          trigger: "IMMEDIATE",
          ...data,
          sizing_mode: sizingMode,
          sizing_value: sizingValue,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedNodeId]);

  // Upstream condition nodes
  const upstreamConditions = React.useMemo(() => {
    if (!activeNode || !edges || !nodes) return [];
    const incoming = edges.filter((e) => e.target === activeNode.id);
    return incoming
      .map((e) => nodes.find((n) => n.id === e.source))
      .filter((n): n is NonNullable<typeof n> => !!n)
      .filter((n) => n.type === "conditionNode");
  }, [activeNode, edges, nodes]);

  // Downstream actions (for DAG branching visualization)
  const downstreamActions = React.useMemo(() => {
    if (!activeNode || !edges || !nodes) return [];
    const outgoing = edges.filter((e) => e.source === activeNode.id);
    return outgoing
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter((n): n is NonNullable<typeof n> => !!n);
  }, [activeNode, edges, nodes]);

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const sanitize = (data: Record<string, any>) => {
    const type = data.actionType || "buy";
    const result = { ...data };
    if (type === "buy" || type === "sell") {
      const mode = data.sizing_mode || "PERCENT_OF_EQUITY";
      let val = isNaN(Number(data.sizing_value)) ? 10 : Number(data.sizing_value);
      if (mode === "PERCENT_OF_EQUITY") {
        val = val / 100;
      }
      result.sizing = {
        mode: mode,
        value: val
      };
      delete result.sizing_mode;
      delete result.sizing_value;
      delete result.amount;
      if (result.sl !== undefined && result.sl !== "") result.sl = Number(result.sl);
      if (result.tp !== undefined && result.tp !== "") result.tp = Number(result.tp);
    } else if (type === "place_limit_order") {
      result.limit_price = isNaN(Number(result.limit_price)) ? 55000 : Number(result.limit_price);
      result.amount = isNaN(Number(result.amount)) ? 0.5 : Number(result.amount);
      delete result.sizing;
    } else if (type === "reduce_position") {
      result.percentage = isNaN(Number(result.percentage)) ? 0.25 : Number(result.percentage);
      delete result.sizing;
    } else {
      delete result.sizing;
    }
    // Remove legacy steps
    delete result.steps;
    return result;
  };

  const handleApply = () => {
    if (!selectedNodeId) return;
    updateNodeData(selectedNodeId, sanitize(formData));
    setIsSynced(false);
    setSelectedNodeId(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (selectedNodeId && activeNode) {
        updateNodeData(selectedNodeId, sanitize(formData));
        setIsSynced(false);
      }
      setSelectedNodeId(null);
    }
  };

  const actionType = formData.actionType || "buy";

  // Dynamic live summary card
  const renderLiveSummary = () => {
    const matchedType = ACTION_TYPES.find((a) => a.value === actionType);
    const matchedTrigger = TRIGGERS.find((t) => t.value === (formData.trigger || "IMMEDIATE"));
    
    return (
      <div className="bg-slate-50 dark:bg-[#1a1b1c] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Active Configuration</div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-black text-foreground">{matchedType?.label || actionType}</span>
            <span className="text-muted-foreground/30 font-mono">|</span>
            <span className="text-xs font-medium text-muted-foreground">{matchedTrigger?.label || formData.trigger}</span>
          </div>
        </div>
        
        {/* Badges/Details */}
        <div className="flex flex-wrap items-center gap-2.5">
          {(actionType === "buy" || actionType === "sell") && (
            <>
              <Badge variant="outline" className="font-mono text-xs border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-semibold py-1 px-2.5 rounded-lg">
                Sizing: {(() => {
                  const mode = formData.sizing_mode || (formData.sizing?.mode) || "PERCENT_OF_EQUITY";
                  let val = formData.sizing_value;
                  if (val === undefined || val === null) {
                    val = formData.sizing?.value;
                    if (val !== undefined && val !== null && mode === "PERCENT_OF_EQUITY") {
                      val = val * 100;
                    }
                  }
                  if (val === undefined || val === null) {
                    val = mode === "PERCENT_OF_EQUITY" ? 10 : mode === "FIXED_USD" ? 1000 : 0.1;
                  }
                  
                  return mode === "PERCENT_OF_EQUITY" 
                    ? `${val}% Equity` 
                    : mode === "FIXED_USD" 
                    ? `$${val}` 
                    : `${val} Qty`;
                })()}
              </Badge>
              {formData.sl && (
                <Badge variant="outline" className="font-mono text-xs border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 font-semibold py-1 px-2.5 rounded-lg">
                  SL: {formData.sl}
                </Badge>
              )}
              {formData.tp && (
                <Badge variant="outline" className="font-mono text-xs border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-semibold py-1 px-2.5 rounded-lg">
                  TP: {formData.tp}
                </Badge>
              )}
            </>
          )}
          {actionType === "place_limit_order" && (
            <>
              <Badge variant="outline" className="font-mono text-xs border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-semibold py-1 px-2.5 rounded-lg">
                Size: {formData.amount ?? 0.5}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400 font-semibold py-1 px-2.5 rounded-lg">
                Limit: {formData.limit_price ?? 55000}
              </Badge>
            </>
          )}
          {actionType === "reduce_position" && (
            <Badge variant="outline" className="font-mono text-xs border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-semibold py-1 px-2.5 rounded-lg">
              Reduce: {(formData.percentage ?? 0.25) * 100}%
            </Badge>
          )}
          {(actionType === "close_all" || actionType === "cancel_all_orders") && (
            <Badge variant="outline" className="font-mono text-xs border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 font-semibold py-1 px-2.5 rounded-lg">
              {actionType === "close_all" ? "Close Position" : "Cancel All Orders"}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="fixed !top-6 !left-6 !w-[calc(100vw-3rem)] !h-[calc(100vh-3rem)] !max-w-none !max-h-none !translate-x-0 !translate-y-0 !transform-none !gap-0 !rounded-2xl !border !border-border !shadow-2xl !p-0 bg-background text-foreground flex flex-col z-50 overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-border px-6 flex items-center justify-between shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-emerald-600/10 flex items-center justify-center border border-emerald-500/20">
              <IconBolt className="size-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">Configure Action Node</h1>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Node ID: {activeNode?.id}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenChange(false)}
            className="size-8 text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer"
          >
            <IconX className="size-4" />
          </Button>
        </div>

        {/* 2-Column Split Layout */}
        <div className="grow overflow-hidden flex bg-background">
          {/* Column 1: Context (Left Sidebar) */}
          <div className="w-72 border-r border-border bg-slate-50/50 dark:bg-slate-900/10 flex flex-col h-full shrink-0 p-5 select-none">
            <span className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-4">
              Upstream Triggers
            </span>
            <ScrollArea className="flex-1 w-full min-h-0">
              <div className="space-y-2 pr-2.5">
                {upstreamConditions.length > 0 ? (
                  upstreamConditions.map((node: any) => (
                    <div key={node.id} className="p-2.5 rounded-xl border border-border bg-card flex items-center gap-2 shadow-2xs hover:border-blue-500/30 transition-colors">
                      <IconGitBranch className="size-3.5 text-blue-500 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-foreground truncate">{node.data?.label || "Condition"}</span>
                        <span className="text-[8px] text-muted-foreground font-mono truncate">ID: {node.id}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center border border-dashed border-border rounded-xl text-[10px] text-muted-foreground select-none">
                    No upstream condition nodes connected.
                  </div>
                )}
              </div>

              <Separator className="my-5" />

              <span className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-4 block">
                Downstream Actions (DAG)
              </span>
              <div className="space-y-2 pr-2.5">
                {downstreamActions.length > 0 ? (
                  downstreamActions.map((node: any) => (
                    <div key={node.id} className="p-2.5 rounded-xl border border-border bg-card flex items-center gap-2 shadow-2xs hover:border-emerald-500/30 transition-colors">
                      <IconArrowRight className="size-3.5 text-emerald-500 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-foreground truncate">{node.data?.label || node.data?.actionType || "Node"}</span>
                        <span className="text-[8px] text-muted-foreground font-mono truncate">ID: {node.id}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center border border-dashed border-border rounded-xl text-[10px] text-muted-foreground select-none">
                    No downstream nodes.
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Event Architecture Guidance */}
            <div className="mt-4 p-4 bg-blue-500/[0.03] dark:bg-blue-500/[0.02] border border-blue-500/10 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                <IconInfoCircle className="size-3.5 shrink-0" />
                <span>Event Architecture</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Each action node is an independent graph node in the execution DAG. 
                Connect multiple actions downstream to create cascading workflows 
                (e.g., Buy → TP1, TP2, StopLoss). The <strong className="text-foreground">trigger</strong> field 
                determines which event activates this node.
              </p>
            </div>
          </div>

          {/* Column 2: Parameters Form Workspace */}
          <div className="flex-grow flex flex-col h-full bg-background">
            <ScrollArea className="h-full w-full">
              <div className="p-6 space-y-6 max-w-3xl mx-auto">
                {/* Live summary card at the top */}
                {renderLiveSummary()}

                {/* Parameters header */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="text-xs font-black text-foreground uppercase tracking-wider">
                    Action Configuration Parameters
                  </span>
                </div>

                <div className="space-y-6">
                  {/* Action Type */}
                  <FieldGroup>
                    <Field>
                      <FieldLabel className="text-xs font-bold text-foreground">Action Type</FieldLabel>
                      <Select value={actionType} onValueChange={(val) => updateField("actionType", val)}>
                        <SelectTrigger className="w-full text-xs h-10 bg-background border-input text-foreground rounded-xl">
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground text-xs rounded-xl z-50">
                          {ACTION_TYPES.map((a) => (
                            <SelectItem key={a.value} value={a.value} className="rounded-lg">{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>

                  {/* Trigger */}
                  <FieldGroup>
                    <Field>
                      <FieldLabel className="text-xs font-bold text-foreground">Event Trigger</FieldLabel>
                      <FieldDescription className="text-[10px] text-muted-foreground">
                        When should this action execute?
                      </FieldDescription>
                      <Select value={formData.trigger || "IMMEDIATE"} onValueChange={(val) => updateField("trigger", val)}>
                        <SelectTrigger className="w-full text-xs h-10 bg-background border-input text-foreground rounded-xl">
                          <SelectValue placeholder="Select trigger" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground text-xs rounded-xl z-50">
                          {TRIGGERS.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="rounded-lg">{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>

                  <Separator className="my-6" />

                  {/* Action-specific fields */}
                  {(actionType === "buy" || actionType === "sell") && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel className="text-xs font-bold text-foreground">Sizing Mode</FieldLabel>
                          <Select 
                            value={formData.sizing_mode || "PERCENT_OF_EQUITY"} 
                            onValueChange={(val) => updateField("sizing_mode", val)}
                          >
                            <SelectTrigger className="w-full text-xs h-10 bg-background border-input text-foreground rounded-xl">
                              <SelectValue placeholder="Select Sizing Mode" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border text-popover-foreground text-xs rounded-xl z-50">
                              <SelectItem value="PERCENT_OF_EQUITY" className="rounded-lg">Percent Of Equity</SelectItem>
                              <SelectItem value="FIXED_USD" className="rounded-lg">Fixed USD</SelectItem>
                              <SelectItem value="FIXED_QUANTITY" className="rounded-lg">Fixed Quantity</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel className="text-xs font-bold text-foreground">
                            {formData.sizing_mode === "PERCENT_OF_EQUITY" 
                              ? "Percent (%)" 
                              : formData.sizing_mode === "FIXED_USD" 
                              ? "Amount ($)" 
                              : "Quantity"}
                          </FieldLabel>
                          <Input
                            type="number"
                            step={formData.sizing_mode === "PERCENT_OF_EQUITY" ? "1" : formData.sizing_mode === "FIXED_USD" ? "10" : "0.01"}
                            value={formData.sizing_value ?? ""}
                            onChange={(e) => updateField("sizing_value", e.target.value)}
                            className="font-mono text-xs h-10 rounded-xl"
                            placeholder={
                              formData.sizing_mode === "PERCENT_OF_EQUITY" 
                                ? "e.g. 10 (for 10%)" 
                                : formData.sizing_mode === "FIXED_USD" 
                                ? "e.g. 1000" 
                                : "e.g. 0.1"
                            }
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel className="text-xs font-bold text-foreground">Stop Loss (ratio)</FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.sl ?? ""}
                            onChange={(e) => updateField("sl", e.target.value)}
                            className="font-mono text-xs h-10 rounded-xl"
                            placeholder="e.g. 0.98"
                          />
                        </Field>
                        <Field>
                          <FieldLabel className="text-xs font-bold text-foreground">Take Profit (ratio)</FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.tp ?? ""}
                            onChange={(e) => updateField("tp", e.target.value)}
                            className="font-mono text-xs h-10 rounded-xl"
                            placeholder="e.g. 1.05"
                          />
                        </Field>
                      </div>
                    </div>
                  )}

                  {actionType === "place_limit_order" && (
                    <div className="space-y-5">
                      <Field>
                        <FieldLabel className="text-xs font-bold text-foreground">Side</FieldLabel>
                        <Select value={formData.side || "buy"} onValueChange={(val) => updateField("side", val)}>
                          <SelectTrigger className="w-full text-xs h-10 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-popover-foreground text-xs rounded-xl z-50">
                            <SelectItem value="buy" className="rounded-lg">Buy</SelectItem>
                            <SelectItem value="sell" className="rounded-lg">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel className="text-xs font-bold text-foreground">Limit Price</FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.limit_price ?? 55000}
                            onChange={(e) => updateField("limit_price", e.target.value)}
                            className="font-mono text-xs h-10 rounded-xl"
                          />
                        </Field>
                        <Field>
                          <FieldLabel className="text-xs font-bold text-foreground">Amount</FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.amount ?? 0.5}
                            onChange={(e) => updateField("amount", e.target.value)}
                            className="font-mono text-xs h-10 rounded-xl"
                          />
                        </Field>
                      </div>
                    </div>
                  )}

                  {actionType === "reduce_position" && (
                    <Field>
                      <FieldLabel className="text-xs font-bold text-foreground">Reduce Percentage</FieldLabel>
                      <Input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={formData.percentage ?? 0.25}
                        onChange={(e) => updateField("percentage", e.target.value)}
                        className="font-mono text-xs h-10 rounded-xl"
                        placeholder="0.25 = 25%"
                      />
                    </Field>
                  )}

                  {(actionType === "close_all" || actionType === "cancel_all_orders") && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {actionType === "close_all"
                          ? "This action will close all open positions for the symbol."
                          : "This action will cancel all pending orders for the symbol."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="h-16 border-t border-border bg-card px-6 flex items-center justify-end gap-3 shrink-0">
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
            className="h-8 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            Apply Action
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
