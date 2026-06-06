"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import {
  IconChartBar,
  IconX,
  IconPlus,
  IconTrash,
  IconDatabase,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";
import { useNodesStore } from "../../../store/nodes-store";
import { fetchConfigRegistry, ConfigRegistry } from "@/api-actions/config-actions";

export default function IndicatorNodeDialog() {
  const {
    nodes,
    edges,
    selectedNodeId,
    setSelectedNodeId,
    updateNodeData,
    setIsSynced,
  } = useNodesStore();

  const activeNode = nodes.find((n) => n.id === selectedNodeId);
  const isOpen = !!(activeNode && activeNode.type === "indicatorNode");

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [inputStates, setInputStates] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  const [dynamicIndicators, setDynamicIndicators] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    fetchConfigRegistry().then((config) => {
      // Convert the registry map into the dropdown array format
      const arr = Object.entries(config.indicators)
        // Filter out alias or duplicate entries if necessary. 
        // For now, let's include them, but filter out "BollingerBands" alias if "BB" exists.
        .filter(([key]) => key !== "BollingerBands") 
        .map(([key, def]) => ({
          value: key,
          label: def.label || key
        }));
      setDynamicIndicators(arr);
    }).catch(console.error);
  }, []);

  // Sync state with node data
  useEffect(() => {
    if (isOpen && activeNode) {
      const data = activeNode.data || {};
      let list = data.indicators as any[];
      if (!list || !Array.isArray(list)) {
      // Fallback to legacy structure
      list = [
        {
          id: "legacy",
          indicator: data.indicator || "ATR",
          period: data.period ?? 14,
          std: data.std ?? 2.0,
        },
      ];
    }
    setFormData({ ...data, indicators: list });
    
    // Initialize string states for all indicators
    const initialInputStates: Record<string, string> = {};
    list.forEach((item: any) => {
      initialInputStates[`${item.id}_period`] = item.period?.toString() || "";
      if (item.std !== undefined) {
        initialInputStates[`${item.id}_std`] = item.std?.toString() || "";
      }
    });
    setInputStates(initialInputStates);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedNodeId]);

  // Find incoming data node timeframe/symbol for left column
  const incomingData = React.useMemo(() => {
    if (!activeNode || !edges || !nodes) return { symbol: "BTCUSDQ", timeframe: "1h", exchange: "delta" };
    
    // Recursive search up the graph
    const findUpstreamData = (nodeId: string): any => {
      const incoming = edges.filter((e) => e.target === nodeId);
      for (const edge of incoming) {
        const src = nodes.find((n) => n.id === edge.source);
        if (src) {
          if (src.type === "dataNode") {
            return {
              symbol: src.data?.symbol || "BTCUSD",
              timeframe: src.data?.timeframe || "1h",
              exchange: src.data?.source || "delta",
            };
          }
          const nested = findUpstreamData(src.id);
          if (nested) return nested;
        }
      }
      return null;
    };

    return findUpstreamData(activeNode.id) || { symbol: "BTCUSDQ", timeframe: "1h", exchange: "delta" };
  }, [activeNode, edges, nodes]);

  const update = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const sanitizeData = (data: Record<string, any>) => {
    const list = (data.indicators || []).map((item: any) => ({
      ...item,
      period: item.period === "" || isNaN(Number(item.period)) ? 14 : Number(item.period),
      std: item.std === "" || isNaN(Number(item.std)) ? 2.0 : Number(item.std),
    }));

    const first = list[0] || { indicator: "ATR", period: 14 };

    return {
      ...data,
      indicators: list,
      // legacy support
      indicator: first.indicator,
      label: first.indicator === "BollingerBands" ? "BB" : first.indicator,
      period: first.period,
      std: first.std,
    };
  };

  const handleApply = () => {
    if (!selectedNodeId) return;
    updateNodeData(selectedNodeId, sanitizeData(formData));
    setIsSynced(false);
    setSelectedNodeId(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (selectedNodeId && activeNode) {
        updateNodeData(selectedNodeId, sanitizeData(formData));
        setIsSynced(false);
      }
      setSelectedNodeId(null);
    }
  };

  const addIndicator = () => {
    const newItem = {
      id: `ind-${Date.now()}`,
      indicator: "EMA",
      period: 20,
    };
    update("indicators", [...(formData.indicators || []), newItem]);
  };

  const deleteIndicator = (id: string) => {
    const list = (formData.indicators || []).filter((item: any) => item.id !== id);
    // Keep at least one indicator
    if (list.length === 0) return;
    update("indicators", list);
  };

  const updateIndicatorItem = (id: string, key: string, val: any) => {
    const list = (formData.indicators || []).map((item: any) => {
      if (item.id === id) {
        const updated = { ...item, [key]: val };
        // Reset defaults when indicator type switches
        if (key === "indicator") {
          if (val === "BollingerBands") {
            updated.period = 20;
            updated.std = 2.0;
            setInputStates(prev => ({ ...prev, [`${id}_period`]: "20", [`${id}_std`]: "2.0" }));
          } else {
            updated.period = 14;
            delete updated.std;
            setInputStates(prev => {
              const next = { ...prev, [`${id}_period`]: "14" };
              delete next[`${id}_std`];
              return next;
            });
          }
        }
        return updated;
      }
      return item;
    });
    update("indicators", list);
  };

  const updateIndicatorInput = (id: string, key: string, val: string, isFloat: boolean = false) => {
    setInputStates(prev => ({ ...prev, [`${id}_${key}`]: val }));
    if (val === "") {
      updateIndicatorItem(id, key, "");
    } else {
      updateIndicatorItem(id, key, isFloat ? parseFloat(val) : parseInt(val));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="fixed !top-6 !left-6 !w-[calc(100vw-3rem)] !h-[calc(100vh-3rem)] !max-w-none !max-h-none !translate-x-0 !translate-y-0 !transform-none !gap-0 !rounded-2xl !border !border-border !shadow-2xl !p-0 bg-background text-foreground flex flex-col z-50 overflow-hidden">
        {/* Header Block */}
        <div className="h-16 border-b border-border px-6 flex items-center justify-between shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-orange-600/10 flex items-center justify-center border border-orange-500/20">
              <IconChartBar className="size-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
                Configure Indicators
              </h1>
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

        {/* 3-Column Split View Body */}
        <div className="grow overflow-hidden grid grid-cols-1 md:grid-cols-12 bg-background">
          {/* Column 1: INPUT SCHEMA (3 cols) */}
          <div className="col-span-3 min-w-0 flex flex-col h-full bg-muted/20 border-r border-border p-5 overflow-y-auto">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Input Schema
            </span>
            <div className="space-y-4">
              <div className="p-3 bg-card border border-border/80 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <IconDatabase className="size-4 text-purple-400" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Data Source
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px] text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Symbol</span>
                    <span className="text-foreground">{incomingData.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timeframe</span>
                    <span className="text-foreground">{incomingData.timeframe}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exchange</span>
                    <span className="text-foreground uppercase">{incomingData.exchange}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-card border border-border/80 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Price Keys
                </span>
                <div className="space-y-1">
                  {["Open", "High", "Low", "Close", "Volume"].map((key) => (
                    <div
                      key={key}
                      onClick={() => copyToClipboard(key)}
                      className="flex items-center justify-between p-1.5 rounded bg-muted/30 hover:bg-muted/65 cursor-pointer transition-colors border border-transparent hover:border-border font-mono text-xs text-muted-foreground hover:text-foreground"
                    >
                      <span>{key}</span>
                      {copiedKey === key ? (
                        <IconCheck className="size-3 text-emerald-500" />
                      ) : (
                        <IconCopy className="size-3 text-muted-foreground/60 hover:text-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: PARAMETERS FORM (5 cols) */}
          <div className="col-span-5 min-w-0 flex flex-col h-full bg-background overflow-y-auto">
            <div className="p-5 flex items-center justify-between border-b border-border/60 shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Indicator Configuration
              </span>
              <Button
                onClick={addIndicator}
                size="sm"
                className="h-7 text-[10px] font-bold gap-1 bg-orange-600 hover:bg-orange-500 text-white cursor-pointer rounded-lg px-2"
              >
                <IconPlus className="size-3" />
                Add Indicator
              </Button>
            </div>

            <div className="grow p-5 space-y-4">
              {(formData.indicators || []).map((ind: any, index: number) => {
                const isBB = ind.indicator === "BollingerBands";
                return (
                  <div
                    key={ind.id}
                    className="p-4 bg-card border border-border rounded-xl relative hover:border-border/80 transition-colors"
                  >
                    {formData.indicators.length > 1 && (
                      <button
                        onClick={() => deleteIndicator(ind.id)}
                        className="absolute top-3 right-3 p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors cursor-pointer"
                        title="Delete Indicator"
                      >
                        <IconTrash className="size-3.5" />
                      </button>
                    )}

                    <FieldGroup className="flex flex-col gap-4">
                      {/* Indicator Type Select */}
                      <Field>
                        <FieldLabel>Indicator #{index + 1} Type</FieldLabel>
                        <Select
                          value={ind.indicator || "ATR"}
                          onValueChange={(val) => updateIndicatorItem(ind.id, "indicator", val)}
                        >
                          <SelectTrigger className="w-full text-xs h-8 bg-background border-input text-foreground">
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-popover-foreground">
                            {dynamicIndicators.map((item) => (
                              <SelectItem key={item.value} value={item.value} className="text-xs focus:bg-accent focus:text-accent-foreground">
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Period */}
                        <Field>
                          <FieldLabel>Period (bars)</FieldLabel>
                          <Input
                            type="number"
                            min={1}
                            max={200}
                            value={inputStates[`${ind.id}_period`] ?? ""}
                            onChange={(e) => updateIndicatorInput(ind.id, "period", e.target.value)}
                            className="font-mono text-xs h-8 bg-background border-input text-foreground"
                            placeholder="14"
                          />
                        </Field>

                        {/* Std multiplier for Bollinger Bands */}
                        {isBB ? (
                          <Field>
                            <FieldLabel>Multiplier (std)</FieldLabel>
                            <Input
                              type="number"
                              step={0.1}
                              min={0.1}
                              value={inputStates[`${ind.id}_std`] ?? ""}
                              onChange={(e) => updateIndicatorInput(ind.id, "std", e.target.value, true)}
                              className="font-mono text-xs h-8 bg-background border-input text-foreground"
                              placeholder="2.0"
                            />
                          </Field>
                        ) : null}
                      </div>
                    </FieldGroup>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions inside form column */}
            <div className="p-4 border-t border-border bg-muted/10 shrink-0 flex items-center justify-end gap-2">
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
                className="h-8 text-xs cursor-pointer bg-orange-600 hover:bg-orange-500 text-white font-bold"
              >
                Apply & Close
              </Button>
            </div>
          </div>

          {/* Column 3: OUTPUT VARIABLES SCHEMA (4 cols) */}
          <div className="col-span-4 min-w-0 flex flex-col h-full bg-muted/20 border-l border-border p-5 overflow-y-auto">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Outputs (Use in conditions)
            </span>
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground leading-relaxed select-none">
                These variable tokens are generated by this node. Click any variable to copy it, then paste it directly into your logic condition operand target fields.
              </p>
              
              <div className="space-y-2">
                {(formData.indicators || []).map((ind: any) => {
                  const label = ind.indicator === "BollingerBands" ? "BB" : ind.indicator;
                  const outputs =
                    label === "BB"
                      ? ["BB_Upper", "BB_Lower", "BB_Middle"]
                      : [label];

                  return (
                    <div key={ind.id} className="p-2.5 rounded-lg border border-border bg-card">
                      <span className="text-[10px] font-bold font-mono text-orange-500 uppercase block mb-1.5">
                        {ind.indicator} ({ind.period})
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {outputs.map((out) => (
                          <div
                            key={out}
                            onClick={() => copyToClipboard(out)}
                            className="flex items-center justify-between p-1.5 rounded bg-muted/30 border border-border/40 hover:bg-muted/65 hover:border-border transition-colors font-mono text-[11px] text-foreground"
                          >
                            <span>{out}</span>
                            {copiedKey === out ? (
                              <IconCheck className="size-3 text-emerald-500" />
                            ) : (
                              <IconCopy className="size-3 text-muted-foreground/60" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
