"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  IconChevronRight,
  IconChevronLeft,
  IconPlus,
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

// Node type colors for header
const NODE_COLORS: Record<string, string> = {
  startNode: "bg-green-600",
  dataNode: "bg-purple-600",
  indicatorNode: "bg-orange-500",
  conditionNode: "bg-blue-600",
  actionNode: "bg-emerald-600",
  placeholderNode: "bg-zinc-200 dark:bg-zinc-800",
};

// Node type icons
const NODE_ICONS: Record<string, React.ReactNode> = {
  startNode: <IconSettings className="size-4 text-white" />,
  dataNode: <IconDatabase className="size-4 text-white" />,
  indicatorNode: <IconChartBar className="size-4 text-white" />,
  conditionNode: <IconGitBranch className="size-4 text-white" />,
  actionNode: <IconBolt className="size-4 text-white" />,
  placeholderNode: <IconPlus className="size-4 text-zinc-500" />,
};

// Node type labels
const NODE_LABELS: Record<string, string> = {
  startNode: "Start",
  dataNode: "Data",
  indicatorNode: "Indicator",
  conditionNode: "Logic",
  actionNode: "Actions",
  placeholderNode: "Placeholder",
};

export default function NodeConfigPanel() {
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
    setIsSynced,
    compileError,
  } = useNodesStore();

  // Ref to track if form has uncommitted changes
  const pendingApplyRef = useRef(false);

  const activeNode = nodes.find((n) => n.id === selectedNodeId);
  const hasError = compileError && selectedNodeId ? compileError.includes(selectedNodeId) : false;

  // Form local state
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeExpiry, setActiveExpiry] = useState<string>(GENERATED_EXPIRIES[0]);
  const [optionChain, setOptionChain] = useState<OptionStrike[]>([]);

  // Panel collapsed/expanded state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get all nodes connected to the current node
  const getConnectedIndicators = (): string[] => {
    if (!activeNode || !edges || !nodes) return [];
    const incomingEdges = edges.filter((edge) => edge.target === activeNode.id);
    const connectedNodes = incomingEdges
      .map((edge) => nodes.find((node) => node.id === edge.source))
      .filter((n): n is NonNullable<typeof n> => !!n);
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

      const reqIndicatorLeft = getRequiredIndicator(left);
      if (reqIndicatorLeft && !connectedIndicators.includes(reqIndicatorLeft)) {
        left = "Price";
        changed = true;
      }

      const reqIndicatorRight = getRequiredIndicator(right);
      if (reqIndicatorRight && !connectedIndicators.includes(reqIndicatorRight)) {
        right = "1000";
        changed = true;
      }

      if (changed) {
        setFormData({
          ...data,
          leftOperand: left,
          rightOperand: right,
        });
      } else {
        setFormData(data);
      }
    }
  }, [activeNode, edges, strategyName, strategyDescription]);

  // Sync option chain when expiry toggles
  useEffect(() => {
    setOptionChain(generateMockChain(activeExpiry));
  }, [activeExpiry]);

  // Close panel when node is deselected
  useEffect(() => {
    if (!selectedNodeId) {
      setIsCollapsed(false);
    }
  }, [selectedNodeId]);

  if (!activeNode) {
    return (
      <AnimatePresence>
        {isCollapsed && (
          <motion.div
            initial={{ width: 320 }}
            animate={{ width: 40 }}
            exit={{ width: 320 }}
            transition={{ type: "tween", duration: 0.2 }}
            className="h-full overflow-hidden"
          />
        )}
      </AnimatePresence>
    );
  }

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
          GREATER_THAN: "Price > 1000",
          LESS_THAN: "Price < 1000",
          GREATER_THAN_OR_EQUAL: "Price >= 1000",
          LESS_THAN_OR_EQUAL: "Price <= 1000",
          EQUAL: "Price == 1000",
          CROSSES_ABOVE: "Price > BB_Upper",
          CROSSES_BELOW: "Price < BB_Lower",
        };

        let cleanLeft = left;
        let cleanRight = right;

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

      updateNodeData(selectedNodeId, formData);
      pendingApplyRef.current = false;
      setIsSynced(false);
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

  const nodeType = activeNode.type || "";
  const colorClass = NODE_COLORS[nodeType] || "bg-zinc-600";
  const icon = NODE_ICONS[nodeType] || <IconSettings className="size-4 text-white" />;
  const label = NODE_LABELS[nodeType] || nodeType;

  return (
    <AnimatePresence mode="wait">
      {selectedNodeId && (
        <motion.div
          initial={{ width: 40, opacity: 0 }}
          animate={{ width: isCollapsed ? 40 : 320, opacity: 1 }}
          exit={{ width: 40, opacity: 0 }}
          transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
          className="h-full flex flex-col bg-card border-l border-border/80 shadow-lg overflow-hidden"
        >
          {/* Collapsed state - just show the toggle */}
          {isCollapsed ? (
            <div className="w-full h-full flex items-center justify-start pl-1">
              <button
                onClick={() => setIsCollapsed(false)}
                className="p-2 rounded-r-md hover:bg-muted/50 transition-colors w-full flex items-center justify-center"
                title="Expand Configuration Panel"
              >
                <IconChevronRight className="size-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <>
              {/* Header Block */}
              <div className="p-4 border-b border-border/60 flex flex-row items-center justify-between bg-muted/30 dark:bg-muted/10">
                <div className="flex items-center gap-3">
                  <div className={`size-8 rounded-lg ${colorClass} flex items-center justify-center border border-border/60`}>
                    {icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-foreground truncate max-w-[180px]">
                      Configure {String(activeNode.data?.label || activeNode.type)}
                    </h3>
                    <p className="text-[10px] text-muted-foreground/80 font-mono mt-0.5">
                      Node ID: {activeNode.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-1.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                    title="Collapse Panel"
                  >
                    <IconChevronLeft className="size-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                    title="Close Panel"
                  >
                    <IconX className="size-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Form Content */}
              <div className="grow overflow-y-auto px-4 py-3 scrollbar-thin">
                {hasError && (
                  <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold flex gap-2 items-start shrink-0">
                    <span className="mt-0.5 font-bold">⚠️</span>
                    <div className="flex-1 leading-normal">{compileError}</div>
                  </div>
                )}
                <FieldGroup className="flex flex-col gap-4">

                  {/* 1. DATA SOURCE NODE CONFIGURATION */}
                  {activeNode.type === "dataNode" && (
                    <>
                      <Field>
                        <FieldLabel>Exchange Source</FieldLabel>
                        <Input
                          value="Delta Exchange (Only Supported Source)"
                          disabled
                          className="font-semibold bg-muted/20 border-border/80 text-muted-foreground text-xs"
                        />
                        <FieldDescription className="text-xs">Delta is strictly forced for exchange execution data pulling.</FieldDescription>
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
                              className="font-mono border-border/80 text-xs"
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
                              className="font-mono border-border/80 text-xs"
                            />
                          </Field>
                        </>
                      ) : (
                        /* OPTIONS CHAIN STRIKE GRID SELECTOR */
                        <div className="space-y-2 mt-2">
                          <FieldLabel className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                            <IconClick className="size-4 animate-bounce" />
                            <span>Select Strike from Delta Option Chain</span>
                          </FieldLabel>
                          
                          <div className="space-y-2">
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
                              <div className="divide-y divide-zinc-900 max-h-48 overflow-y-auto">
                                {optionChain.map((strikeRow) => (
                                  <div
                                    key={strikeRow.strike}
                                    className="grid grid-cols-9 gap-0.5 items-center py-1.5 hover:bg-zinc-900/40 text-center text-[10px] text-zinc-300 font-semibold"
                                  >
                                    <div className="col-span-2 text-zinc-500 font-mono text-[8px]">{strikeRow.callDelta.toFixed(2)}</div>
                                    <div className="col-span-1 text-zinc-400 text-[9px]">{strikeRow.callBid}</div>
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

                                    <div className="col-span-1 font-extrabold text-foreground text-[10px]">{strikeRow.strike}</div>

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
                                    <div className="col-span-1 text-zinc-400 text-[9px]">{strikeRow.putBid}</div>
                                    <div className="col-span-2 text-zinc-500 font-mono text-[8px]">{strikeRow.putDelta.toFixed(2)}</div>
                                  </div>
                                ))}
                              </div>
                            </Card>
                          </div>

                          <Field className="mt-2">
                            <FieldLabel>Selected Contract</FieldLabel>
                            <Input
                              value={formData.symbol || ""}
                              readOnly
                              className="font-mono border-purple-500/30 bg-purple-950/10 text-purple-300 font-bold text-xs"
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
                        <FieldLabel>Candles Timeframe (Primary)</FieldLabel>
                        <Select
                          value={formData.timeframe || "1h"}
                          onValueChange={(val) => {
                            updateFormKey("timeframe", val);
                            const tfs = formData.timeframes || [formData.timeframe || "1h"];
                            if (!tfs.includes(val)) {
                              updateFormKey("timeframes", [...tfs, val]);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full border-border/80 font-mono text-xs">
                            <SelectValue placeholder="Select Timeframe" />
                          </SelectTrigger>
                          <SelectContent>
                            {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
                              <SelectItem key={tf} value={tf} className="font-mono text-xs">{tf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <FieldLabel>Additional Timeframes</FieldLabel>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => {
                            const isPrimary = (formData.timeframe || "1h") === tf;
                            const timeframes = formData.timeframes || [formData.timeframe || "1h"];
                            const isSelected = timeframes.includes(tf) || isPrimary;
                            return (
                              <button
                                key={tf}
                                type="button"
                                disabled={isPrimary}
                                onClick={() => {
                                  let newTfs = [...timeframes];
                                  if (newTfs.includes(tf)) {
                                    newTfs = newTfs.filter((t) => t !== tf);
                                  } else {
                                    newTfs.push(tf);
                                  }
                                  // Ensure primary is always in there
                                  const primary = formData.timeframe || "1h";
                                  if (!newTfs.includes(primary)) {
                                    newTfs.push(primary);
                                  }
                                  updateFormKey("timeframes", newTfs);
                                }}
                                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all duration-200 cursor-pointer ${
                                  isPrimary
                                    ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50"
                                    : isSelected
                                      ? "bg-primary border-primary text-primary-foreground shadow-sm"
                                      : "bg-background border-border text-foreground hover:bg-muted"
                                }`}
                              >
                                {tf}
                              </button>
                            );
                          })}
                        </div>
                        <FieldDescription className="text-xs">Select any extra timeframes required by indicator nodes connected to this data feed.</FieldDescription>
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
                            if (val === "BB" || val === "BollingerBands") {
                              updateFormKey("period", 20);
                              updateFormKey("std", 2.0);
                            } else {
                              updateFormKey("period", 14);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full border-border/80 text-xs">
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
                          className="font-mono border-border/80 text-xs"
                        />
                        <FieldDescription className="text-xs">Number of candle bars for calculations.</FieldDescription>
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
                            className="font-mono border-border/80 text-xs"
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
                            <SelectItem value="Price" className="font-mono text-xs">Price (data.close)</SelectItem>
                            <SelectItem value="Close" className="font-mono text-xs">Close</SelectItem>
                            <SelectItem value="Volume" className="font-mono text-xs">Volume</SelectItem>
                            {connectedIndicators.map((ind) => {
                              const fields = INDICATOR_FIELDS[ind] || [{ label: `${ind} Indicator`, value: ind }];
                              return fields.map((field) => (
                                <SelectItem key={field.value} value={field.value} className="font-mono text-xs">
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
                          <SelectTrigger className="w-full border-border/80 text-xs">
                            <SelectValue placeholder="Operator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GREATER_THAN" className="text-xs">Greater Than (&gt;)</SelectItem>
                            <SelectItem value="LESS_THAN" className="text-xs">Less Than (&lt;)</SelectItem>
                            <SelectItem value="GREATER_THAN_OR_EQUAL" className="text-xs">Greater Or Equal (&gt;=)</SelectItem>
                            <SelectItem value="LESS_THAN_OR_EQUAL" className="text-xs">Less Or Equal (&lt;=)</SelectItem>
                            <SelectItem value="EQUAL" className="text-xs">Equal (==)</SelectItem>
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
                            <SelectItem value="custom_static" className="font-mono text-xs">Static Target (Number)</SelectItem>
                            {connectedIndicators.map((ind) => {
                              const fields = INDICATOR_FIELDS[ind] || [{ label: `${ind} Indicator`, value: ind }];
                              return fields.map((field) => (
                                <SelectItem key={field.value} value={field.value} className="font-mono text-xs">
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
                            className="font-mono border-border/80 text-xs"
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
                          <SelectTrigger className="w-full border-border/80 font-semibold text-xs">
                            <SelectValue placeholder="Action Block" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buy" className="text-xs">Market Buy / Long Position</SelectItem>
                            <SelectItem value="sell" className="text-xs">Market Sell / Short Position</SelectItem>
                            <SelectItem value="place_limit_order" className="text-xs">Limit Order Placement</SelectItem>
                            <SelectItem value="close_all" className="text-xs">Close All Positions</SelectItem>
                            <SelectItem value="reduce_position" className="text-xs">Reduce Active Sizing</SelectItem>
                            <SelectItem value="cancel_all_orders" className="text-xs">Cancel Pending Orders</SelectItem>
                            <SelectItem value="log_info" className="text-xs">Log Info utility</SelectItem>
                            <SelectItem value="trigger_webhook" className="text-xs">Trigger Webhook utility</SelectItem>
                            <SelectItem value="send_notification" className="text-xs">Send Notification (Discord)</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      {(formData.actionType === "buy" || formData.actionType === "sell") && (
                        <>
                          <Field>
                            <FieldLabel>Position Amount (contracts)</FieldLabel>
                            <Input
                              type="number"
                              step={0.01}
                              min={0.01}
                              value={formData.amount ?? 0.10}
                              onChange={(e) => updateFormKey("amount", parseFloat(e.target.value) || 0.10)}
                              className="font-mono border-border/80 text-xs"
                            />
                          </Field>
                          
                          <Field>
                            <FieldLabel>Stop Loss (SL Multiplier ratio)</FieldLabel>
                            <Input
                              type="number"
                              step={0.01}
                              value={formData.sl ?? 0.98}
                              onChange={(e) => updateFormKey("sl", parseFloat(e.target.value) || null)}
                              className="font-mono border-border/80 text-xs"
                            />
                            <FieldDescription className="text-xs">e.g. 0.98 represents a 2% price trailing Stop Loss.</FieldDescription>
                          </Field>

                          <Field>
                            <FieldLabel>Take Profit (TP Multiplier ratio)</FieldLabel>
                            <Input
                              type="number"
                              step={0.01}
                              value={formData.tp ?? 1.05}
                              onChange={(e) => updateFormKey("tp", parseFloat(e.target.value) || null)}
                              className="font-mono border-border/80 text-xs"
                            />
                            <FieldDescription className="text-xs">e.g. 1.05 represents a 5% Take Profit threshold.</FieldDescription>
                          </Field>
                        </>
                      )}

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
                              className="font-mono border-border/80 text-xs"
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
                              className="font-mono border-border/80 text-xs"
                            />
                          </Field>
                        </>
                      )}

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
                            className="font-mono border-border/80 text-xs"
                          />
                          <FieldDescription className="text-xs">Enter fractional decimal value, e.g. 0.25 for 25% sizing reduction.</FieldDescription>
                        </Field>
                      )}

                      {formData.actionType === "log_info" && (
                        <Field>
                          <FieldLabel>Log Message Trace</FieldLabel>
                          <Input
                            value={formData.message || "Quant execution trace active"}
                            onChange={(e) => updateFormKey("message", e.target.value)}
                            className="border-border/80 text-xs"
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
                              className="font-mono border-border/80 text-xs"
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Webhook Payload Message</FieldLabel>
                            <Input
                              value={formData.message || "Limit order triggered!"}
                              onChange={(e) => updateFormKey("message", e.target.value)}
                              className="border-border/80 text-xs"
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
                              className="border-border/80 text-xs"
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Alert Message</FieldLabel>
                            <Input
                              value={formData.message || "Position alert triggered"}
                              onChange={(e) => updateFormKey("message", e.target.value)}
                              className="border-border/80 text-xs"
                            />
                          </Field>
                        </>
                      )}
                    </>
                  )}

                  {/* 5. STRATEGY META: NAME + DESCRIPTION (startNode only) */}
                  {activeNode.type === "startNode" && (
                    <>
                      <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 mb-1">
                        <div className="flex items-center gap-2 mb-2">
                          <IconEdit className="size-3.5 text-primary" />
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Strategy Identity</span>
                        </div>
                        <Field className="mb-2">
                          <FieldLabel>Strategy Name</FieldLabel>
                          <Input
                            value={(formData.strategyName as string) ?? strategyName}
                            onChange={(e) => {
                              updateFormKey("strategyName", e.target.value);
                              pendingApplyRef.current = true;
                            }}
                            placeholder="e.g. Volatility Breakout Strategy"
                            className="font-semibold border-border/80 text-xs"
                          />
                          <FieldDescription className="text-xs">Displayed on the canvas start node and navigation header.</FieldDescription>
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
                            className="border-border/80 resize-none text-xs min-h-[60px]"
                            rows={3}
                          />
                          <FieldDescription className="text-xs">Optional metadata stored with your strategy in the cloud.</FieldDescription>
                        </Field>
                      </div>
                    </>
                  )}

                  {/* 6. STRATEGY-WIDE RISK MANAGEMENT CONFIGURATION */}
                  {activeNode.type === "startNode" && (
                    <>
                      <Field>
                        <FieldLabel>Position Size Percentage (position_size_pct)</FieldLabel>
                        <Input
                          type="number"
                          step={0.01}
                          min={0.01}
                          max={1.00}
                          value={formData.position_size_pct ?? 0.50}
                          onChange={(e) => updateFormKey("position_size_pct", parseFloat(e.target.value) || 0.50)}
                          className="font-mono border-border/80 text-xs"
                        />
                        <FieldDescription className="text-xs">Enter fractional decimal value, e.g. 0.50 for 50% capital sizing.</FieldDescription>
                      </Field>

                      <Field>
                        <FieldLabel>Maximum Strategy Drawdown (max_drawdown_pct)</FieldLabel>
                        <Input
                          type="number"
                          step={0.01}
                          min={0.01}
                          max={1.00}
                          value={formData.max_drawdown_pct ?? ""}
                          onChange={(e) => updateFormKey("max_drawdown_pct", e.target.value === "" ? null : parseFloat(e.target.value))}
                          className="font-mono border-border/80 text-xs"
                          placeholder="0.25"
                        />
                        <FieldDescription className="text-xs">Maximum equity drawdown, e.g. 0.25 representing 25% peak cap.</FieldDescription>
                      </Field>

                      <Field>
                        <FieldLabel>Stop Loss ATR Multiplier (atr_sl_mult)</FieldLabel>
                        <Input
                          type="number"
                          step={0.1}
                          min={0.1}
                          value={formData.atr_sl_mult ?? ""}
                          onChange={(e) => updateFormKey("atr_sl_mult", e.target.value === "" ? null : parseFloat(e.target.value))}
                          className="font-mono border-border/80 text-xs"
                          placeholder="2.0"
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Take Profit ATR Multiplier (atr_tp_mult)</FieldLabel>
                        <Input
                          type="number"
                          step={0.1}
                          min={0.1}
                          value={formData.atr_tp_mult ?? ""}
                          onChange={(e) => updateFormKey("atr_tp_mult", e.target.value === "" ? null : parseFloat(e.target.value))}
                          className="font-mono border-border/80 text-xs"
                          placeholder="4.0"
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Max Parallel Open Positions</FieldLabel>
                        <Input
                          type="number"
                          min={1}
                          value={formData.max_open_positions ?? ""}
                          onChange={(e) => updateFormKey("max_open_positions", e.target.value === "" ? null : parseInt(e.target.value))}
                          className="font-mono border-border/80 text-xs"
                          placeholder="3"
                        />
                      </Field>
                    </>
                  )}

                </FieldGroup>
              </div>

              {/* Footer Actions */}
              <div className="p-3 border-t border-border/60 bg-muted/10 dark:bg-muted/5 flex flex-row items-center justify-between gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Auto-commit on close
                    if (selectedNodeId) {
                      if (activeNode?.type === "startNode" && strategyId) {
                        const newName = (formData.strategyName as string)?.trim() || strategyName;
                        const newDesc = (formData.strategyDescription as string) ?? strategyDescription;
                        if (newName !== strategyName || newDesc !== strategyDescription) {
                          setStrategyMeta(strategyId, newName, newDesc, isCodeModified);
                        }
                      }
                      updateNodeData(selectedNodeId, formData);
                    }
                    setSelectedNodeId(null);
                  }}
                  className="flex-1 font-bold text-xs border-border/80 hover:bg-muted/80 cursor-pointer"
                >
                  Close
                </Button>
                <Button
                  onClick={handleApply}
                  className="flex-1 font-bold text-xs bg-primary text-primary-foreground shadow-md cursor-pointer"
                >
                  Apply
                </Button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
