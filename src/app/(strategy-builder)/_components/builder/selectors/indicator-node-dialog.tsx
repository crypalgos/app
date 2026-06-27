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
    compileError,
  } = useNodesStore();

  const activeNode = nodes.find((n) => n.id === selectedNodeId);
  const isOpen = !!(activeNode && activeNode.type === "indicatorNode");
  const hasError = compileError && selectedNodeId ? compileError.includes(selectedNodeId) : false;

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [inputStates, setInputStates] = useState<Record<string, string>>({});
  
  const [dynamicIndicators, setDynamicIndicators] = useState<{value: string, label: string}[]>([]);
  const [registry, setRegistry] = useState<ConfigRegistry | null>(null);
  const [timeframes, setTimeframes] = useState<string[]>([]);

  useEffect(() => {
    fetchConfigRegistry().then((config) => {
      setRegistry(config);
      setTimeframes(config.timeframes || ["1m", "5m", "15m", "1h", "4h", "1d"]);
      const arr = Object.entries(config.indicators)
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
        if (data.indicator) {
          list = [
            {
              id: "legacy",
              indicator: data.indicator,
              period: data.period ?? 14,
              std: data.std ?? 2.0,
              timeframe: data.timeframe || "",
            },
          ];
        } else {
          list = [];
        }
      }
      setFormData({ ...data, indicators: list });
      
      const initialInputStates: Record<string, string> = {};
      list.forEach((item: any) => {
        Object.entries(item).forEach(([k, v]) => {
          if (k !== "id" && k !== "indicator" && k !== "timeframe" && v !== undefined && v !== null) {
            initialInputStates[`${item.id}_${k}`] = v.toString();
          }
        });
      });
      setInputStates(initialInputStates);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedNodeId]);

  const incomingData = React.useMemo(() => {
    if (!activeNode || !edges || !nodes) return { symbol: "BTCUSD", timeframe: "1h", exchange: "delta", timeframes: ["1h"] };
    
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
              timeframes: src.data?.timeframes || [src.data?.timeframe || "1h"],
            };
          }
          const nested = findUpstreamData(src.id);
          if (nested) return nested;
        }
      }
      return null;
    };

    return findUpstreamData(activeNode.id) || { symbol: "BTCUSD", timeframe: "1h", exchange: "delta", timeframes: ["1h"] };
  }, [activeNode, edges, nodes]);

  const update = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const getIndicatorDefaultParams = (indicatorKey: string): Record<string, any> => {
    if (indicatorKey === "MACD") {
      return { fast_period: 12, slow_period: 26, signal_period: 9 };
    }
    if (indicatorKey === "BB" || indicatorKey === "BollingerBands") {
      return { period: 20, std: 2.0 };
    }
    return { period: 14 };
  };

  const sanitizeData = (data: Record<string, any>) => {
    const list = (data.indicators || []).map((item: any) => {
      const sanitizedItem: Record<string, any> = {
        id: item.id,
        indicator: item.indicator,
        timeframe: item.timeframe || incomingData.timeframe,
      };

      const entryPair = Object.entries(registry?.indicators || {}).find(
        ([key, def]) => key === item.indicator || def.class === item.indicator
      );
      const regEntry = entryPair ? entryPair[1] : null;
      const params = regEntry?.params || ["period"];

      params.forEach((param) => {
        const val = item[param];
        if (val === undefined || val === "" || isNaN(Number(val))) {
          const defaults = getIndicatorDefaultParams(item.indicator);
          sanitizedItem[param] = defaults[param] ?? 14;
        } else {
          sanitizedItem[param] = Number(val);
        }
      });

      return sanitizedItem;
    });

    const first = list[0];

    return {
      ...data,
      indicators: list,
      indicator: first ? first.indicator : undefined,
      label: first ? (first.indicator === "BollingerBands" ? "BB" : first.indicator) : "Indicator",
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
      timeframe: incomingData.timeframe,
    };
    update("indicators", [...(formData.indicators || []), newItem]);
  };

  const deleteIndicator = (id: string) => {
    const list = (formData.indicators || []).filter((item: any) => item.id !== id);
    if (list.length === 0) return;
    update("indicators", list);
  };

  const updateIndicatorItem = (id: string, key: string, val: any) => {
    const list = (formData.indicators || []).map((item: any) => {
      if (item.id === id) {
        const updated = { ...item, [key]: val };
        if (key === "indicator") {
          const cleanItem = { id, indicator: val, timeframe: item.timeframe };
          const defaults = getIndicatorDefaultParams(val);
          const nextItem = { ...cleanItem, ...defaults };
          
          setInputStates(prev => {
            const next = { ...prev };
            Object.keys(next).forEach((k) => {
              if (k.startsWith(`${id}_`)) {
                delete next[k];
              }
            });
            Object.entries(defaults).forEach(([pk, pv]) => {
              next[`${id}_${pk}`] = pv.toString();
            });
            return next;
          });
          return nextItem;
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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="fixed top-6! left-6! w-[calc(100vw-3rem)]! h-[calc(100vh-3rem)]! max-w-none! max-h-none! translate-x-0! translate-y-0! transform-none! gap-0! rounded-2xl! border! border-border! shadow-2xl! p-0! bg-background text-foreground flex flex-col z-50 overflow-hidden">
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

        {hasError && (
          <div className="mx-6 mt-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold flex gap-2 items-start shrink-0">
            <span className="mt-0.5 font-bold">⚠️</span>
            <div className="flex-1 leading-normal">{compileError}</div>
          </div>
        )}

        {/* 2-Column Split View Body */}
        <div className="grow overflow-hidden grid grid-cols-1 md:grid-cols-12 bg-background">
          {/* Column 1: INPUT SCHEMA (4 cols) */}
          <div className="col-span-4 min-w-0 flex flex-col h-full bg-muted/20 border-r border-border p-5 overflow-y-auto">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Data Source Binding
            </span>
            <div className="space-y-4">
              <div className="p-4 bg-card border border-border/80 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <IconDatabase className="size-5 text-purple-400" />
                  <span className="text-sm font-bold text-foreground uppercase tracking-wider">
                    {incomingData.symbol}
                  </span>
                </div>
                <div className="space-y-2 font-mono text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Base Timeframe</span>
                    <span className="text-foreground">{incomingData.timeframe}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exchange</span>
                    <span className="text-foreground uppercase">{incomingData.exchange}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-2">
                 <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold leading-relaxed">
                   Multi-Timeframe Execution
                 </p>
                 <p className="text-[10px] text-muted-foreground leading-relaxed">
                   You can bind indicators to timeframes different from the base asset. The compiler will automatically resolve multi-timeframe dependencies for you.
                 </p>
              </div>
            </div>
          </div>

          {/* Column 2: PARAMETERS FORM (8 cols) */}
          <div className="col-span-8 min-w-0 flex flex-col h-full bg-background overflow-y-auto">
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
                return (
                  <div
                    key={ind.id}
                    className="p-5 bg-card border border-border rounded-xl relative hover:border-border/80 transition-colors"
                  >
                    {formData.indicators.length > 1 && (
                      <button
                        onClick={() => deleteIndicator(ind.id)}
                        className="absolute top-4 right-4 p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors cursor-pointer"
                        title="Delete Indicator"
                      >
                        <IconTrash className="size-4" />
                      </button>
                    )}

                    <FieldGroup className="flex flex-col gap-5">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Indicator Type Select */}
                        <Field>
                          <FieldLabel className="font-semibold text-xs text-foreground">Indicator Type</FieldLabel>
                          <Select
                             value={ind.indicator || "ATR"}
                             onValueChange={(val) => updateIndicatorItem(ind.id, "indicator", val)}
                          >
                            <SelectTrigger className="w-full text-xs h-9 bg-background border-input text-foreground rounded-xl">
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border text-popover-foreground">
                              {dynamicIndicators.map((item) => (
                                <SelectItem key={item.value} value={item.value} className="text-xs">
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        
                        {/* Timeframe Select */}
                        <Field>
                          <FieldLabel className="font-semibold text-xs text-foreground">Timeframe</FieldLabel>
                          <Select
                            value={ind.timeframe || incomingData.timeframe}
                            onValueChange={(val) => updateIndicatorItem(ind.id, "timeframe", val)}
                          >
                            <SelectTrigger className="w-full text-xs h-9 bg-background border-input text-foreground rounded-xl">
                              <SelectValue placeholder="Select Timeframe" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border text-popover-foreground">
                              {incomingData.timeframes.map((tf: string) => (
                                <SelectItem key={tf} value={tf} className="text-xs">
                                  {tf.toUpperCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {(() => {
                          const entryPair = Object.entries(registry?.indicators || {}).find(
                            ([key, def]) => key === ind.indicator || def.class === ind.indicator
                          );
                          const regEntry = entryPair ? entryPair[1] : null;
                          const params = regEntry?.params || ["period"];

                          return params.map((param) => {
                            let labelName = param.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                            if (param === "std") labelName = "Multiplier (std)";
                            if (param === "period") labelName = "Period (bars)";

                            const isFloat = param === "std";

                            return (
                              <Field key={param}>
                                <FieldLabel className="font-semibold text-[11px] text-muted-foreground">{labelName}</FieldLabel>
                                <Input
                                  type="number"
                                  step={isFloat ? 0.1 : 1}
                                  min={isFloat ? 0.1 : 1}
                                  value={inputStates[`${ind.id}_${param}`] ?? ""}
                                  onChange={(e) => updateIndicatorInput(ind.id, param, e.target.value, isFloat)}
                                  className="font-mono text-xs h-9 bg-background border-input text-foreground rounded-xl"
                                  placeholder={isFloat ? "2.0" : "14"}
                                />
                              </Field>
                            );
                          });
                        })()}
                      </div>
                    </FieldGroup>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions inside form column */}
            <div className="p-4 border-t border-border bg-muted/10 shrink-0 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="h-9 rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                className="h-9 rounded-lg text-xs cursor-pointer bg-orange-600 hover:bg-orange-500 text-white font-bold"
              >
                Apply & Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
