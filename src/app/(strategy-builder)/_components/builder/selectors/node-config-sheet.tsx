"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FieldGroup, Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  IconSettings,
  IconDatabase,
  IconChartBar,
  IconGitBranch,
  IconBolt,
  IconShield,
  IconX,
  IconClick,
  IconEdit,
} from "@tabler/icons-react";
import { useNodesStore } from "../../../store/nodes-store";

// =========================================================
// Dynamic Mock Option Chain Strike Data Generator
// =========================================================
interface OptionStrike {
  strike: number;
  callSymbol: string;
  callBid: number;
  callAsk: number;
  callDelta: number;
  putSymbol: string;
  putBid: number;
  putAsk: number;
  putDelta: number;
}

const GENERATED_EXPIRIES = ["2026-06-05", "2026-06-12", "2026-06-26"];

const generateMockChain = (expiry: string): OptionStrike[] => {
  const baseStrikes = [62000, 63000, 64000, 65000, 66000, 67000];
  const dateStr = expiry.replace(/-/g, "");
  return baseStrikes.map((strike) => {
    const diff = strike - 64500;
    const callDelta = Math.max(0.05, Math.min(0.95, 0.5 - diff / 10000));
    const putDelta = -(1 - callDelta);
    return {
      strike,
      callSymbol: `BTC-${dateStr}-${strike}-C`,
      callBid: Math.max(10, 1200 - diff * 0.1),
      callAsk: Math.max(15, 1250 - diff * 0.1),
      callDelta,
      putSymbol: `BTC-${dateStr}-${strike}-P`,
      putBid: Math.max(10, 800 + diff * 0.1),
      putAsk: Math.max(15, 850 + diff * 0.1),
      putDelta,
    };
  });
};

// =========================================================
// Dynamic Indicator Fields Mapping Registry
// =========================================================
const INDICATOR_FIELDS: Record<string, { label: string; value: string }[]> = {
  BB: [
    { label: "BB_Upper (Bollinger Bands Upper)", value: "BB_Upper" },
    { label: "BB_Lower (Bollinger Bands Lower)", value: "BB_Lower" },
    { label: "BB_Middle (Bollinger Bands Middle)", value: "BB_Middle" },
  ],
  ATR: [{ label: "ATR Indicator", value: "ATR" }],
  EMA: [{ label: "EMA Indicator", value: "EMA" }],
  SMA: [{ label: "SMA Indicator", value: "SMA" }],
  RSI: [{ label: "RSI Indicator", value: "RSI" }],
};

export default function NodeConfigSheet() {
  const {
    nodes,
    edges,
    selectedNodeId,
    setSelectedNodeId,
    updateNodeData,
    strategyId,
    strategyName,
    strategyDescription,
    isCodeModified,
    setStrategyMeta,
  } = useNodesStore();
  
  // Ref to track if form has uncommitted changes to auto-apply on close
  const pendingApplyRef = useRef(false);

  const activeNode = nodes.find((n) => n.id === selectedNodeId);

  // Form local state
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeExpiry, setActiveExpiry] = useState<string>(GENERATED_EXPIRIES[0]);
  const [optionChain, setOptionChain] = useState<OptionStrike[]>([]);

  // Get all nodes connected to the current node
  const getConnectedIndicators = (): string[] => {
    if (!activeNode || !edges || !nodes) return [];
    // Find edges that target the activeNode
    const incomingEdges = edges.filter((edge) => edge.target === activeNode.id);
    
    // Find the source nodes of these edges
    const connectedNodes = incomingEdges
      .map((edge) => nodes.find((node) => node.id === edge.source))
      .filter((n): n is NonNullable<typeof n> => !!n);
      
    // Filter to only indicator nodes and get their indicator type
    const indicators = connectedNodes
      .filter((node) => node.type === "indicatorNode")
      .map((node) => {
        const ind = node.data?.indicator || node.data?.label;
        if (ind === "Bollinger Bands" || ind === "BollingerBands") return "BB";
        return ind;
      })
      .filter(Boolean) as string[];
      
    return Array.from(new Set(indicators));
  };

  const connectedIndicators = getConnectedIndicators();

  // Sync form state when active node changes or connections change
  useEffect(() => {
    if (activeNode) {
      let data = activeNode.data || {};
      
      if (activeNode.type === "startNode") {
        // Seed strategy meta from global store
        data = {
          ...data,
          strategyName: strategyName,
          strategyDescription: strategyDescription,
        };
      }
      pendingApplyRef.current = false;
      
      // Auto-validate/reset operands if they reference unconnected indicators
      let left = (data.leftOperand as string) || "Price";
      let right = (data.rightOperand as string) || "1000";
      let changed = false;
      
      // Helper to detect if an operand is indicator-based and get the required indicator
      const getRequiredIndicator = (value: string): string | null => {
        if (!value) return null;
        if (value.startsWith("BB_") || value.toLowerCase().startsWith("bb_") || value.startsWith("bb.")) {
          return "BB";
        }
        const knownIndicators = Object.keys(INDICATOR_FIELDS);
        for (const ind of knownIndicators) {
          if (value === ind || value.startsWith(ind + "_") || value.startsWith(ind + ".")) {
            return ind;
          }
        }
        return null;
      };

      // Check left operand
      const reqIndicatorLeft = getRequiredIndicator(left);
      if (reqIndicatorLeft && !connectedIndicators.includes(reqIndicatorLeft)) {
        left = "Price";
        changed = true;
      }
      
      // Check right operand
      const reqIndicatorRight = getRequiredIndicator(right);
      if (reqIndicatorRight && !connectedIndicators.includes(reqIndicatorRight)) {
        right = "1000";
        changed = true;
      }
      
      let finalData: Record<string, any> = changed ? { ...data, leftOperand: left, rightOperand: right } : { ...data };
      
      if (activeNode.type === "actionNode") {
        const type = finalData.actionType || "buy";
        if (type === "buy" || type === "sell") {
          const sizing = finalData.sizing || {};
          let sizingMode = sizing.mode;
          let sizingValue = sizing.value;
          if (!sizingMode) {
            if (finalData.amount !== undefined && finalData.amount !== null) {
              sizingMode = "FIXED_QUANTITY";
              sizingValue = finalData.amount;
            } else {
              sizingMode = "PERCENT_OF_EQUITY";
              sizingValue = 10;
            }
          } else if (sizingMode === "PERCENT_OF_EQUITY") {
            sizingValue = sizingValue !== undefined ? sizingValue * 100 : 10;
          }
          finalData.sizing_mode = sizingMode;
          finalData.sizing_value = sizingValue;
        }
      }
      setFormData(finalData);
    }
  }, [activeNode, edges]);

  // Sync option chain when expiry toggles
  useEffect(() => {
    setOptionChain(generateMockChain(activeExpiry));
  }, [activeExpiry]);

  if (!activeNode) return null;

  const sanitizeNodeData = (data: Record<string, any>, nodeType: string) => {
    const sanitizedData = { ...data };
    if (nodeType === "startNode") {
      delete sanitizedData.position_size_pct;
    } else if (nodeType === "actionNode") {
      const type = sanitizedData.actionType || "buy";
      if (type === "buy" || type === "sell") {
        const mode = sanitizedData.sizing_mode || "PERCENT_OF_EQUITY";
        let val = isNaN(Number(sanitizedData.sizing_value)) ? 10 : Number(sanitizedData.sizing_value);
        if (mode === "PERCENT_OF_EQUITY") {
          val = val / 100;
        }
        sanitizedData.sizing = {
          mode: mode,
          value: val
        };
        delete sanitizedData.sizing_mode;
        delete sanitizedData.sizing_value;
        delete sanitizedData.amount;
      } else {
        delete sanitizedData.sizing;
      }
    }
    return sanitizedData;
  };

  const handleApply = () => {
    if (selectedNodeId) {
      // If startNode, persist strategy name and description globally
      if (activeNode.type === "startNode" && strategyId) {
        const newName = (formData.strategyName as string)?.trim() || strategyName;
        const newDesc = (formData.strategyDescription as string) ?? strategyDescription;
        if (newName !== strategyName || newDesc !== strategyDescription) {
          setStrategyMeta(strategyId, newName, newDesc, isCodeModified);
        }
      }

      // Dynamic compile for conditionNode logical string
      if (activeNode.type === "conditionNode") {
        const left = formData.leftOperand || "Price";
        const right = formData.rightOperand || "1000";
        const op = formData.operator || "GREATER_THAN";
        
        const opSymbols: Record<string, string> = {
          GREATER_THAN: "Price > 1000", // default templates
          LESS_THAN: "Price < 1000",
          GREATER_THAN_OR_EQUAL: "Price >= 1000",
          LESS_THAN_OR_EQUAL: "Price <= 1000",
          EQUAL: "Price == 1000",
          CROSSES_ABOVE: "Price > BB_Upper",
          CROSSES_BELOW: "Price < BB_Lower",
        };

        // If left and right are standard parameters, build clean expression
        let cleanLeft = left;
        let cleanRight = right;
        
        // Normalize BB uppercase/lowercase for compiler regex
        if (cleanRight === "bb.upper" || cleanRight === "bb_upper") cleanRight = "BB_Upper";
        if (cleanRight === "bb.lower" || cleanRight === "bb_lower") cleanRight = "BB_Lower";
        
        let expression = `${cleanLeft} > ${cleanRight}`;
        if (op === "LESS_THAN") expression = `${cleanLeft} < ${cleanRight}`;
        if (op === "GREATER_THAN_OR_EQUAL") expression = `${cleanLeft} >= ${cleanRight}`;
        if (op === "LESS_THAN_OR_EQUAL") expression = `${cleanLeft} <= ${cleanRight}`;
        if (op === "EQUAL") expression = `${cleanLeft} == ${cleanRight}`;
        
        formData.condition = expression;
      }

      // Restrict source strictly to "delta" lowercase
      if (activeNode.type === "dataNode") {
        formData.source = "delta";
      }

      updateNodeData(selectedNodeId, sanitizeNodeData(formData, activeNode.type || ""));
      pendingApplyRef.current = false;
      setSelectedNodeId(null);
    }
  };

  // Auto-commit when sheet is closed without explicitly pressing Apply
  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      // Always commit on close, regardless of method
      if (selectedNodeId) {
        if (activeNode?.type === "startNode" && strategyId) {
          const newName = (formData.strategyName as string)?.trim() || strategyName;
          const newDesc = (formData.strategyDescription as string) ?? strategyDescription;
          if (newName !== strategyName || newDesc !== strategyDescription) {
            setStrategyMeta(strategyId, newName, newDesc, isCodeModified);
          }
        }
        updateNodeData(selectedNodeId, sanitizeNodeData(formData, activeNode?.type || ""));
      }
      setSelectedNodeId(null);
    }
  };

  const updateFormKey = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateFormNested = (parentKey: string, key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] || {}),
        [key]: value,
      },
    }));
  };

  // Render correct icon per node class
  const getIcon = () => {
    switch (activeNode.type) {
      case "dataNode":
        return <IconDatabase className="size-5 text-purple-400 animate-pulse" />;
      case "indicatorNode":
        return <IconChartBar className="size-5 text-amber-400" />;
      case "conditionNode":
        return <IconGitBranch className="size-5 text-blue-400" />;
      case "actionNode":
        return <IconBolt className="size-5 text-emerald-400" />;
      default:
        return <IconSettings className="size-5 text-muted-foreground" />;
    }
  };

  return (
    <Sheet open={!!selectedNodeId} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-card/98 dark:bg-[#151617]/95 border-l border-border/80 p-0 shadow-2xl flex flex-col h-full z-50">
        
        {/* Header Block */}
        <SheetHeader className="p-6 border-b border-border/60 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-muted/40 dark:bg-muted/10 flex items-center justify-center border border-border/60">
              {getIcon()}
            </div>
            <div>
              <SheetTitle className="text-sm font-bold tracking-tight text-foreground select-none">
                Configure {String(activeNode.data?.label || activeNode.type)}
              </SheetTitle>
              <SheetDescription className="text-[10px] text-muted-foreground/80 font-mono mt-0.5 select-none">
                Node ID: {activeNode.id}
              </SheetDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedNodeId(null)}
            className="size-8 hover:bg-muted/60 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <IconX className="size-4" />
          </Button>
        </SheetHeader>

        {/* Scrollable Form Content */}
        <div className="grow overflow-y-auto px-6 py-4 scrollbar-thin">
          <FieldGroup className="flex flex-col gap-5">

            {/* 1. DATA SOURCE NODE CONFIGURATION */}
            {activeNode.type === "dataNode" && (
              <>
                <Field>
                  <FieldLabel>Exchange Source</FieldLabel>
                  <Input
                    value="Delta Exchange (Only Supported Source)"
                    disabled
                    className="font-semibold bg-muted/20 border-border/80 text-muted-foreground"
                  />
                  <FieldDescription>Delta is strictly forced for exchange execution data pulling.</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel>Asset Class</FieldLabel>
                  <ToggleGroup
                    type="single"
                    value={formData.assetClass || "SPOT"}
                    onValueChange={(val) => {
                      if (val) {
                        updateFormKey("assetClass", val);
                        if (val !== "OPTION") {
                          updateFormKey("symbol", "BTC/USD");
                        }
                      }
                    }}
                    className="w-full border border-border/60 rounded-xl overflow-hidden p-0.5"
                  >
                    {["SPOT", "FUTURE", "PERPETUAL", "OPTION"].map((ac) => (
                      <ToggleGroupItem
                        key={ac}
                        value={ac}
                        className="flex-1 text-[10px] font-bold py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
                      >
                        {ac}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>

                {formData.assetClass !== "OPTION" ? (
                  <>
                    <Field>
                      <FieldLabel>Trading Symbol</FieldLabel>
                      <Input
                        value={formData.symbol || "BTC/USD"}
                        onChange={(e) => updateFormKey("symbol", e.target.value)}
                        className="font-mono border-border/80"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Active Leverage</FieldLabel>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={formData.leverage || 10}
                        onChange={(e) => updateFormKey("leverage", parseInt(e.target.value) || 10)}
                        className="font-mono border-border/80"
                      />
                    </Field>
                  </>
                ) : (
                  /* OPTIONS CHAIN STRIKE GRID SELECTOR */
                  <div className="space-y-3 mt-4">
                    <FieldLabel className="flex items-center gap-1.5 text-purple-400 font-bold">
                      <IconClick className="size-4 animate-bounce" />
                      <span>Select Strike from Delta Option Chain</span>
                    </FieldLabel>
                    
                    <div className="space-y-3">
                      <Tabs value={activeExpiry} onValueChange={setActiveExpiry} className="w-full">
                        <TabsList className="bg-zinc-900 border border-zinc-800 p-0.5 flex overflow-x-auto whitespace-nowrap">
                          {GENERATED_EXPIRIES.map((exp) => (
                            <TabsTrigger
                              key={exp}
                              value={exp}
                              className="text-[10px] flex-1 font-bold py-1.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md cursor-pointer"
                            >
                              {new Date(exp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>

                      <Card className="bg-zinc-950/80 border-zinc-800 overflow-hidden shadow-inner">
                        <div className="grid grid-cols-9 gap-0.5 text-center font-bold bg-zinc-900/60 p-2 text-[9px] text-zinc-400 border-b border-zinc-800/80">
                          <div className="col-span-4 text-purple-400">CALLS</div>
                          <div className="col-span-1 text-white">STRIKE</div>
                          <div className="col-span-4 text-emerald-400">PUTS</div>
                        </div>
                        <div className="divide-y divide-zinc-900 max-h-56 overflow-y-auto">
                          {optionChain.map((strikeRow) => (
                            <div
                              key={strikeRow.strike}
                              className="grid grid-cols-9 gap-0.5 items-center py-2 hover:bg-zinc-900/40 text-center text-[10px] text-zinc-300 font-semibold"
                            >
                              <div className="col-span-2 text-zinc-500 font-mono text-[8px]">{strikeRow.callDelta.toFixed(2)}</div>
                              <div className="col-span-1 text-zinc-400">{strikeRow.callBid}</div>
                              <div className="col-span-1">
                                <button
                                  onClick={() => {
                                    updateFormKey("symbol", strikeRow.callSymbol);
                                    updateFormKey("label", strikeRow.callSymbol);
                                  }}
                                  className={`px-1.5 py-0.5 border text-[9px] rounded font-bold transition-all ${
                                    formData.symbol === strikeRow.callSymbol
                                      ? "bg-purple-600 text-white border-purple-400 shadow-md"
                                      : "bg-purple-950/20 hover:bg-purple-900/40 border-purple-800/40 text-purple-300"
                                  }`}
                                >
                                  C
                                </button>
                              </div>

                              <div className="col-span-1 font-extrabold text-foreground text-xs">{strikeRow.strike}</div>

                              <div className="col-span-1">
                                <button
                                  onClick={() => {
                                    updateFormKey("symbol", strikeRow.putSymbol);
                                    updateFormKey("label", strikeRow.putSymbol);
                                  }}
                                  className={`px-1.5 py-0.5 border text-[9px] rounded font-bold transition-all ${
                                    formData.symbol === strikeRow.putSymbol
                                      ? "bg-emerald-600 text-white border-emerald-400 shadow-md"
                                      : "bg-emerald-950/20 hover:bg-emerald-900/40 border-emerald-800/40 text-emerald-300"
                                  }`}
                                >
                                  P
                                </button>
                              </div>
                              <div className="col-span-1 text-zinc-400">{strikeRow.putBid}</div>
                              <div className="col-span-2 text-zinc-500 font-mono text-[8px]">{strikeRow.putDelta.toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>

                    <Field className="mt-4">
                      <FieldLabel>Selected Contract</FieldLabel>
                      <Input
                        value={formData.symbol || ""}
                        readOnly
                        className="font-mono border-purple-500/30 bg-purple-950/10 text-purple-300 font-bold"
                        placeholder="Click C or P from Option Chain strike list"
                      />
                    </Field>
                  </div>
                )}

                <Field>
                  <FieldLabel>Data Type</FieldLabel>
                  <ToggleGroup
                    type="single"
                    value={formData.dataType || "OHLCV"}
                    onValueChange={(val) => {
                      if (val) {
                        updateFormKey("dataType", val);
                      }
                    }}
                    className="w-full border border-border/60 rounded-xl overflow-hidden p-0.5"
                  >
                    {["OHLCV", "MTB"].map((dt) => (
                      <ToggleGroupItem
                        key={dt}
                        value={dt}
                        className="flex-1 text-[10px] font-bold py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
                      >
                        {dt === "OHLCV" ? "OHLCV (Candles)" : "MTB (Mark, Trades, Book)"}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>

                <Field>
                  <FieldLabel>Candles Timeframe</FieldLabel>
                  <Select
                    value={formData.timeframe || "1h"}
                    onValueChange={(val) => updateFormKey("timeframe", val)}
                  >
                    <SelectTrigger className="w-full border-border/80 font-mono text-xs">
                      <SelectValue placeholder="Select Timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
                        <SelectItem key={tf} value={tf} className="font-mono">{tf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}

            {/* 2. TECHNICAL INDICATOR NODE CONFIGURATION */}
            {activeNode.type === "indicatorNode" && (
              <>
                <Field>
                  <FieldLabel>Indicator Type</FieldLabel>
                  <Select
                    value={formData.indicator || "ATR"}
                    onValueChange={(val) => {
                      updateFormKey("indicator", val);
                      updateFormKey("label", val);
                      
                      // Bind exact registry-expected parameter keys
                      if (val === "BB" || val === "BollingerBands") {
                        updateFormKey("period", 20);
                        updateFormKey("std", 2.0); // "std" parameter strictly! (NOT stdDev)
                      } else {
                        updateFormKey("period", 14);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full border-border/80">
                      <SelectValue placeholder="Select Indicator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BollingerBands">Bollinger Bands (BB)</SelectItem>
                      <SelectItem value="ATR">Average True Range (ATR)</SelectItem>
                      <SelectItem value="EMA">Exponential Moving Average (EMA)</SelectItem>
                      <SelectItem value="SMA">Simple Moving Average (SMA)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Period Configuration</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    value={formData.period ?? 14}
                    onChange={(e) => updateFormKey("period", parseInt(e.target.value) || 14)}
                    className="font-mono border-border/80"
                  />
                  <FieldDescription>Number of candle bars for calculations.</FieldDescription>
                </Field>

                {(formData.indicator === "BollingerBands" || formData.indicator === "BB") && (
                  <Field>
                    <FieldLabel>Standard Deviation Multiplier (std)</FieldLabel>
                    <Input
                      type="number"
                      step={0.1}
                      min={0.1}
                      value={formData.std ?? 2.0}
                      onChange={(e) => updateFormKey("std", parseFloat(e.target.value) || 2.0)}
                      className="font-mono border-border/80"
                    />
                  </Field>
                )}
              </>
            )}

            {/* 3. LOGIC CONDITION NODE CONFIGURATION */}
            {activeNode.type === "conditionNode" && (
              <>
                <Field>
                  <FieldLabel>Left Operand</FieldLabel>
                  <Select
                    value={formData.leftOperand || "Price"}
                    onValueChange={(val) => updateFormKey("leftOperand", val)}
                  >
                    <SelectTrigger className="w-full border-border/80 font-mono text-xs">
                      <SelectValue placeholder="Left Side" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Price" className="font-mono">Price (data.close)</SelectItem>
                      <SelectItem value="Close" className="font-mono">Close</SelectItem>
                      <SelectItem value="Volume" className="font-mono">Volume</SelectItem>
                      
                      {/* Dynamically render connected indicators */}
                      {connectedIndicators.map((ind) => {
                        const fields = INDICATOR_FIELDS[ind] || [{ label: `${ind} Indicator`, value: ind }];
                        return fields.map((field) => (
                          <SelectItem key={field.value} value={field.value} className="font-mono">
                            {field.label}
                          </SelectItem>
                        ));
                      })}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Logical Operator</FieldLabel>
                  <Select
                    value={formData.operator || "GREATER_THAN"}
                    onValueChange={(val) => updateFormKey("operator", val)}
                  >
                    <SelectTrigger className="w-full border-border/80">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GREATER_THAN">Greater Than (&gt;)</SelectItem>
                      <SelectItem value="LESS_THAN">Less Than (&lt;)</SelectItem>
                      <SelectItem value="GREATER_THAN_OR_EQUAL">Greater Or Equal (&gt;=)</SelectItem>
                      <SelectItem value="LESS_THAN_OR_EQUAL">Less Or Equal (&lt;=)</SelectItem>
                      <SelectItem value="EQUAL">Equal (==)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Right Operand</FieldLabel>
                  <Select
                    value={
                      connectedIndicators.some((ind) => {
                        const fields = INDICATOR_FIELDS[ind] || [{ label: ind, value: ind }];
                        return fields.some((f) => f.value === formData.rightOperand);
                      })
                        ? formData.rightOperand
                        : "custom_static"
                    }
                    onValueChange={(val) => {
                      if (val === "custom_static") {
                        updateFormKey("rightOperand", "1000");
                      } else {
                        updateFormKey("rightOperand", val);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full border-border/80 font-mono text-xs">
                      <SelectValue placeholder="Right Side" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom_static" className="font-mono">Static Target (Number)</SelectItem>
                      
                      {/* Dynamically render connected indicators */}
                      {connectedIndicators.map((ind) => {
                        const fields = INDICATOR_FIELDS[ind] || [{ label: `${ind} Indicator`, value: ind }];
                        return fields.map((field) => (
                          <SelectItem key={field.value} value={field.value} className="font-mono">
                            {field.label}
                          </SelectItem>
                        ));
                      })}
                    </SelectContent>
                  </Select>
                </Field>

                {(!formData.rightOperand || !connectedIndicators.some((ind) => {
                  const fields = INDICATOR_FIELDS[ind] || [{ label: ind, value: ind }];
                  return fields.some((f) => f.value === formData.rightOperand);
                })) && (
                  <Field className="mt-2 animate-in slide-in-from-top-1 duration-200">
                    <FieldLabel>Static Target Value</FieldLabel>
                    <Input
                      type="text"
                      value={formData.rightOperand || ""}
                      onChange={(e) => updateFormKey("rightOperand", e.target.value)}
                      className="font-mono border-border/80"
                      placeholder="e.g. 1000, 1.5, etc."
                    />
                  </Field>
                )}
              </>
            )}

            {/* 4. TRADING ACTION NODE CONFIGURATION */}
            {activeNode.type === "actionNode" && (
              <>
                <Field>
                  <FieldLabel>Action Classification</FieldLabel>
                  <Select
                    value={formData.actionType || "buy"}
                    onValueChange={(val) => {
                      updateFormKey("actionType", val);
                      updateFormKey("label", val.replace(/_/g, " ").toUpperCase());
                    }}
                  >
                    <SelectTrigger className="w-full border-border/80 font-semibold">
                      <SelectValue placeholder="Action Block" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Market Buy / Long Position</SelectItem>
                      <SelectItem value="sell">Market Sell / Short Position</SelectItem>
                      <SelectItem value="place_limit_order">Limit Order Placement</SelectItem>
                      <SelectItem value="close_all">Close All Positions</SelectItem>
                      <SelectItem value="reduce_position">Reduce Active Sizing</SelectItem>
                      <SelectItem value="cancel_all_orders">Cancel Pending Orders</SelectItem>
                      <SelectItem value="log_info">Log Info utility</SelectItem>
                      <SelectItem value="trigger_webhook">Trigger Webhook utility</SelectItem>
                      <SelectItem value="send_notification">Send Notification (Discord)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                {/* Buy / Sell Options */}
                {(formData.actionType === "buy" || formData.actionType === "sell") && (
                  <>
                    <Field>
                      <FieldLabel>Sizing Mode</FieldLabel>
                      <Select
                        value={formData.sizing_mode || "PERCENT_OF_EQUITY"}
                        onValueChange={(val) => {
                          updateFormKey("sizing_mode", val);
                        }}
                      >
                        <SelectTrigger className="w-full border-border/80 text-xs">
                          <SelectValue placeholder="Select Sizing Mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENT_OF_EQUITY">Percent Of Equity</SelectItem>
                          <SelectItem value="FIXED_USD">Fixed USD</SelectItem>
                          <SelectItem value="FIXED_QUANTITY">Fixed Quantity</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel>
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
                        onChange={(e) => updateFormKey("sizing_value", e.target.value)}
                        className="font-mono border-border/80"
                        placeholder={
                          formData.sizing_mode === "PERCENT_OF_EQUITY"
                            ? "e.g. 10 (for 10%)"
                            : formData.sizing_mode === "FIXED_USD"
                            ? "e.g. 1000"
                            : "e.g. 0.1"
                        }
                      />
                    </Field>
                    
                    <Field>
                      <FieldLabel>Stop Loss (SL Multiplier ratio)</FieldLabel>
                      <Input
                        type="number"
                        step={0.01}
                        value={formData.sl ?? 0.98}
                        onChange={(e) => updateFormKey("sl", parseFloat(e.target.value) || null)}
                        className="font-mono border-border/80"
                      />
                      <FieldDescription>e.g. 0.98 represents a 2% price trailing Stop Loss.</FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel>Take Profit (TP Multiplier ratio)</FieldLabel>
                      <Input
                        type="number"
                        step={0.01}
                        value={formData.tp ?? 1.05}
                        onChange={(e) => updateFormKey("tp", parseFloat(e.target.value) || null)}
                        className="font-mono border-border/80"
                      />
                      <FieldDescription>e.g. 1.05 represents a 5% Take Profit threshold.</FieldDescription>
                    </Field>
                  </>
                )}

                {/* Limit Order Placement */}
                {formData.actionType === "place_limit_order" && (
                  <>
                    <Field>
                      <FieldLabel>Order Side</FieldLabel>
                      <ToggleGroup
                        type="single"
                        value={formData.side || "buy"}
                        onValueChange={(val) => val && updateFormKey("side", val)}
                        className="w-full border border-border/60 rounded-xl overflow-hidden p-0.5"
                      >
                        <ToggleGroupItem
                          value="buy"
                          className="flex-1 text-[10px] font-bold py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
                        >
                          BUY
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="sell"
                          className="flex-1 text-[10px] font-bold py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
                        >
                          SELL
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </Field>
                    
                    <Field>
                      <FieldLabel>Limit Trigger Price ($)</FieldLabel>
                      <Input
                        type="number"
                        step={0.1}
                        value={formData.limit_price ?? 55000.0}
                        onChange={(e) => updateFormKey("limit_price", parseFloat(e.target.value) || 55000.0)}
                        className="font-mono border-border/80"
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Position Amount (contracts)</FieldLabel>
                      <Input
                        type="number"
                        step={0.01}
                        min={0.01}
                        value={formData.amount ?? 0.50}
                        onChange={(e) => updateFormKey("amount", parseFloat(e.target.value) || 0.50)}
                        className="font-mono border-border/80"
                      />
                    </Field>
                  </>
                )}

                {/* Sizing Reduction */}
                {formData.actionType === "reduce_position" && (
                  <Field>
                    <FieldLabel>Reduction Percentage (%)</FieldLabel>
                    <Input
                      type="number"
                      step={0.01}
                      min={0.01}
                      max={1.00}
                      value={formData.percentage ?? 0.25}
                      onChange={(e) => updateFormKey("percentage", parseFloat(e.target.value) || 0.25)}
                      className="font-mono border-border/80"
                    />
                    <FieldDescription>Enter fractional decimal value, e.g. 0.25 for 25% sizing reduction.</FieldDescription>
                  </Field>
                )}

                {/* Utilities Log / Webhooks */}
                {formData.actionType === "log_info" && (
                  <Field>
                    <FieldLabel>Log Message Trace</FieldLabel>
                    <Input
                      value={formData.message || "Quant execution trace active"}
                      onChange={(e) => updateFormKey("message", e.target.value)}
                      className="border-border/80"
                    />
                  </Field>
                )}

                {formData.actionType === "trigger_webhook" && (
                  <>
                    <Field>
                      <FieldLabel>Webhook URL Address</FieldLabel>
                      <Input
                        type="url"
                        value={formData.url || "http://localhost:8000/alert"}
                        onChange={(e) => updateFormKey("url", e.target.value)}
                        className="font-mono border-border/80"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Webhook Payload Message</FieldLabel>
                      <Input
                        value={formData.message || "Limit order triggered!"}
                        onChange={(e) => updateFormKey("message", e.target.value)}
                        className="border-border/80"
                      />
                    </Field>
                  </>
                )}

                {formData.actionType === "send_notification" && (
                  <>
                    <Field>
                      <FieldLabel>Target Channel</FieldLabel>
                      <Input
                        value={formData.channel || "discord"}
                        onChange={(e) => updateFormKey("channel", e.target.value)}
                        className="border-border/80"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Alert Message</FieldLabel>
                      <Input
                        value={formData.message || "Position alert triggered"}
                        onChange={(e) => updateFormKey("message", e.target.value)}
                        className="border-border/80"
                      />
                    </Field>
                  </>
                )}
              </>
            )}

            {/* 5. STRATEGY META: NAME + DESCRIPTION (startNode only) */}
            {activeNode.type === "startNode" && (
              <>
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 mb-1">
                  <div className="flex items-center gap-2 mb-3">
                    <IconEdit className="size-4 text-primary" />
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Strategy Identity</span>
                  </div>
                  <Field className="mb-3">
                    <FieldLabel>Strategy Name</FieldLabel>
                    <Input
                      value={(formData.strategyName as string) ?? strategyName}
                      onChange={(e) => {
                        updateFormKey("strategyName", e.target.value);
                        pendingApplyRef.current = true;
                      }}
                      placeholder="e.g. Volatility Breakout Strategy"
                      className="font-semibold border-border/80"
                    />
                    <FieldDescription>Displayed on the canvas start node and navigation header.</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel>Strategy Description</FieldLabel>
                    <Textarea
                      value={(formData.strategyDescription as string) ?? strategyDescription}
                      onChange={(e) => {
                        updateFormKey("strategyDescription", e.target.value);
                        pendingApplyRef.current = true;
                      }}
                      placeholder="Briefly describe the trading logic, signals, and risk approach..."
                      className="border-border/80 resize-none text-sm min-h-[80px]"
                      rows={3}
                    />
                    <FieldDescription>Optional metadata stored with your strategy in the cloud.</FieldDescription>
                  </Field>
                </div>
              </>
            )}

            {/* 6. STRATEGY-WIDE RISK MANAGEMENT CONFIGURATION */}
            {activeNode.type === "startNode" && (
              <>
                <Field>
                  <FieldLabel>Daily Loss Limit ($) (daily_loss_limit)</FieldLabel>
                  <Input
                    type="number"
                    step={1}
                    min={0}
                    value={formData.daily_loss_limit ?? ""}
                    onChange={(e) => updateFormKey("daily_loss_limit", parseFloat(e.target.value) || null)}
                    className="font-mono border-border/80"
                    placeholder="e.g. 1000"
                  />
                  <FieldDescription>Maximum USD loss threshold before halting strategy execution.</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel>Maximum Strategy Drawdown (max_drawdown_pct)</FieldLabel>
                  <Input
                    type="number"
                    step={0.01}
                    min={0.01}
                    max={1.00}
                    value={formData.max_drawdown_pct ?? 0.25}
                    onChange={(e) => updateFormKey("max_drawdown_pct", parseFloat(e.target.value) || 0.25)}
                    className="font-mono border-border/80"
                  />
                  <FieldDescription>Maximum equity drawdown, e.g. 0.25 representing 25% peak cap.</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel>Stop Loss ATR Multiplier (atr_sl_mult)</FieldLabel>
                  <Input
                    type="number"
                    step={0.1}
                    min={0.1}
                    value={formData.atr_sl_mult ?? 2.0}
                    onChange={(e) => updateFormKey("atr_sl_mult", parseFloat(e.target.value) || 2.0)}
                    className="font-mono border-border/80"
                  />
                </Field>

                <Field>
                  <FieldLabel>Take Profit ATR Multiplier (atr_tp_mult)</FieldLabel>
                  <Input
                    type="number"
                    step={0.1}
                    min={0.1}
                    value={formData.atr_tp_mult ?? 5.0}
                    onChange={(e) => updateFormKey("atr_tp_mult", parseFloat(e.target.value) || 5.0)}
                    className="font-mono border-border/80"
                  />
                </Field>

                <Field>
                  <FieldLabel>Max Parallel Open Positions</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    value={formData.max_open_positions ?? 2}
                    onChange={(e) => updateFormKey("max_open_positions", parseInt(e.target.value) || 2)}
                    className="font-mono border-border/80"
                  />
                </Field>
              </>
            )}

          </FieldGroup>
        </div>

        {/* Footer Actions */}
        <SheetFooter className="p-6 border-t border-border/60 bg-muted/10 dark:bg-muted/5 flex flex-row items-center justify-between gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={() => handleSheetOpenChange(false)}
            className="flex-1 font-bold text-xs border-border/80 hover:bg-muted/80 cursor-pointer"
          >
            Close
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 font-bold text-xs bg-primary text-primary-foreground shadow-md cursor-pointer"
          >
            Apply Changes
          </Button>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}
