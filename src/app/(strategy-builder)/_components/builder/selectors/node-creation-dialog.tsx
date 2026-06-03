"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  IconPlus,
  IconClick,
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

export default function NodeCreationDialog() {
  const {
    activeCreationType,
    setActiveCreationType,
    addNode,
    nodes,
    edges,
    addEdge,
    activeCreationSource,
    setActiveCreationSource,
    removeNode,
  } = useNodesStore();

  // Local creation states
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeExpiry, setActiveExpiry] = useState<string>(GENERATED_EXPIRIES[0]);
  const [optionChain, setOptionChain] = useState<OptionStrike[]>([]);
  const [dialogView, setDialogView] = useState<string>("selector");

  const selectCategory = (category: string) => {
    setDialogView(category);
    const defaults: Record<string, Record<string, any>> = {
      data: {
        label: "BTC/USD Feed",
        assetClass: "PERPETUAL",
        symbol: "BTC/USD",
        source: "delta",
        timeframe: "1h",
        leverage: 10,
        dataType: "OHLCV",
      },
      indicator: {
        label: "Bollinger Bands",
        indicator: "BollingerBands",
        period: 20,
        std: 2.0,
      },
      condition: {
        label: "Volatility Check",
        leftOperand: "Price",
        operator: "GREATER_THAN",
        rightOperand: "BB_Upper",
      },
      action: {
        label: "Buy Market Entry",
        actionType: "buy",
        amount: 0.1,
        sl: 0.98,
        tp: 1.05,
      },
      risk: {
        label: "Risk Safeguard",
        position_size_pct: 0.50,
        max_drawdown_pct: 0.25,
        daily_loss_limit: null,
        atr_sl_mult: 2.0,
        atr_tp_mult: 5.0,
        max_open_positions: 2,
      },
    };
    setFormData(defaults[category] || {});
  };

  // Setup default values when opening the creation dialog
  useEffect(() => {
    if (activeCreationType) {
      setDialogView(activeCreationType);
      
      const defaults: Record<string, Record<string, any>> = {
        data: {
          label: "BTC/USD Feed",
          assetClass: "PERPETUAL",
          symbol: "BTC/USD",
          source: "delta",
          timeframe: "1h",
          leverage: 10,
          dataType: "OHLCV",
        },
        indicator: {
          label: "Bollinger Bands",
          indicator: "BollingerBands",
          period: 20,
          std: 2.0,
        },
        condition: {
          label: "Volatility Check",
          leftOperand: "Price",
          operator: "GREATER_THAN",
          rightOperand: "BB_Upper",
        },
        action: {
          label: "Buy Market Entry",
          actionType: "buy",
          amount: 0.1,
          sl: 0.98,
          tp: 1.05,
        },
        risk: {
          label: "Risk Safeguard",
          position_size_pct: 0.50,
          max_drawdown_pct: 0.25,
          daily_loss_limit: null,
          atr_sl_mult: 2.0,
          atr_tp_mult: 5.0,
          max_open_positions: 2,
        },
      };
      setFormData(defaults[activeCreationType === "selector" ? "data" : activeCreationType] || {});
    }
  }, [activeCreationType]);

  // Sync option chain when expiry toggles
  useEffect(() => {
    setOptionChain(generateMockChain(activeExpiry));
  }, [activeExpiry]);

  if (!activeCreationType) return null;

  const handleCreate = () => {
    // Crucial bug fix: use dialogView instead of activeCreationType (which could be "selector")
    // for uniqueId generation and conditional type resolution.
    const chosenType = dialogView === "selector" ? "data" : dialogView;
    const uniqueId = `${chosenType}-${Date.now()}`;
    let xPos = 350 + Math.random() * 80;
    let yPos = 250 + Math.random() * 80;

    if (activeCreationSource) {
      if (activeCreationSource.placeholderId) {
        const placeholderNode = nodes.find((n) => n.id === activeCreationSource.placeholderId);
        if (placeholderNode) {
          xPos = placeholderNode.position.x;
          yPos = placeholderNode.position.y;
        }
        removeNode(activeCreationSource.placeholderId);
      } else {
        const sourceNode = nodes.find((n) => n.id === activeCreationSource.nodeId);
        if (sourceNode) {
          xPos = sourceNode.position.x + (Math.random() * 20 - 10);
          yPos = sourceNode.position.y + 150;
        }
      }
    }

    const newNode: any = {
      id: uniqueId,
      position: { x: xPos, y: yPos },
      data: { ...formData },
    };

    if (chosenType === "data") {
      newNode.type = "dataNode";
      newNode.data.source = "delta"; // Restrict strictly to delta
    } else if (chosenType === "indicator") {
      newNode.type = "indicatorNode";
    } else if (chosenType === "condition") {
      newNode.type = "conditionNode";
      // Dynamic compile for conditionNode logical expression
      const left = formData.leftOperand || "Price";
      const right = formData.rightOperand || "1000";
      const op = formData.operator || "GREATER_THAN";
      let cleanRight = right;
      
      if (cleanRight === "bb.upper" || cleanRight === "bb_upper") cleanRight = "BB_Upper";
      if (cleanRight === "bb.lower" || cleanRight === "bb_lower") cleanRight = "BB_Lower";
      
      let expression = `${left} > ${cleanRight}`;
      if (op === "LESS_THAN") expression = `${left} < ${cleanRight}`;
      if (op === "GREATER_THAN_OR_EQUAL") expression = `${left} >= ${cleanRight}`;
      if (op === "LESS_THAN_OR_EQUAL") expression = `${left} <= ${cleanRight}`;
      if (op === "EQUAL") expression = `${left} == ${cleanRight}`;
      
      newNode.data.condition = expression;
    } else if (chosenType === "action") {
      // actionNode and utilityNode classifications both map to actionNode or utilityNode type on canvas
      const isUtility = ["log_info", "trigger_webhook", "send_notification"].includes(formData.actionType);
      newNode.type = isUtility ? "utilityNode" : "actionNode";
    } else if (chosenType === "risk") {
      newNode.type = "riskManagementNode";
    }

    addNode(newNode);

    if (activeCreationSource) {
      let edgeType = "default";
      let edgeLabel = "Connection";

      if (activeCreationSource.handleId === "true") {
        edgeType = "success";
        edgeLabel = "True Path";
      } else if (activeCreationSource.handleId === "false") {
        edgeType = "error";
        edgeLabel = "False Path";
      } else {
        const sourceNode = nodes.find((node) => node.id === activeCreationSource.nodeId);
        if (sourceNode) {
          switch (sourceNode.type) {
            case "startNode":
              edgeType = "info";
              edgeLabel = "Start Flow";
              break;
            case "dataNode":
              edgeType = "info";
              edgeLabel = "Data Flow";
              break;
            case "indicatorNode":
              edgeType = "warning";
              edgeLabel = "Signal";
              break;
            case "actionNode":
              edgeType = "success";
              edgeLabel = "Action Flow";
              break;
            case "riskManagementNode":
              edgeType = "error";
              edgeLabel = "Risk Safeguard";
              break;
            default:
              edgeType = "default";
              edgeLabel = "Connection";
          }
        }
      }

      addEdge({
        id: `edge-${activeCreationSource.nodeId}-${uniqueId}`,
        source: activeCreationSource.nodeId,
        sourceHandle: activeCreationSource.handleId || undefined,
        target: uniqueId,
        type: "custom",
        data: {
          type: edgeType,
          animated: edgeType === "success" || edgeType === "info",
          label: edgeLabel,
        },
      });

      // SPLICE RECONNECTION: If splicing an edge, connect newly created node to the original target!
      if (activeCreationSource.originalTargetId) {
        let outEdgeType = "default";
        let outEdgeLabel = "Connection";

        // Determine output connection style based on the new node's type
        switch (newNode.type) {
          case "dataNode":
            outEdgeType = "info";
            outEdgeLabel = "Data Flow";
            break;
          case "indicatorNode":
            outEdgeType = "warning";
            outEdgeLabel = "Signal";
            break;
          case "conditionNode":
            outEdgeType = "success";
            outEdgeLabel = "True Path"; // Default true path branch
            break;
          case "actionNode":
          case "utilityNode":
            outEdgeType = "success";
            outEdgeLabel = "Action Flow";
            break;
          default:
            outEdgeType = "default";
            outEdgeLabel = "Connection";
        }

        addEdge({
          id: `edge-${uniqueId}-${activeCreationSource.originalTargetId}`,
          source: uniqueId,
          sourceHandle: newNode.type === "conditionNode" ? "true" : undefined, // True path handle for logic condition
          target: activeCreationSource.originalTargetId,
          type: "custom",
          data: {
            type: outEdgeType,
            animated: outEdgeType === "success" || outEdgeType === "info",
            label: outEdgeLabel,
          },
        });
      }

      setActiveCreationSource(null);
    }

    setActiveCreationType(null);
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

  // Icon per category
  const getIcon = () => {
    switch (dialogView) {
      case "data":
        return <IconDatabase className="size-5 text-purple-400" />;
      case "indicator":
        return <IconChartBar className="size-5 text-amber-400" />;
      case "condition":
        return <IconGitBranch className="size-5 text-blue-400" />;
      case "action":
        return <IconBolt className="size-5 text-emerald-400" />;
      case "risk":
        return <IconShield className="size-5 text-red-400" />;
      default:
        return <IconSettings className="size-5 text-primary" />;
    }
  };

  return (
    <Dialog open={!!activeCreationType} onOpenChange={(open) => { if (!open) { setActiveCreationType(null); setActiveCreationSource(null); } }}>
      <DialogContent className="w-full sm:max-w-md bg-card/98 dark:bg-[#151617]/95 border border-border/80 shadow-2xl p-6 rounded-2xl z-50">
        
        {/* Header Block */}
        <DialogHeader className="flex flex-row items-center gap-3 border-b border-border/60 pb-4">
          <div className="size-9 rounded-xl bg-muted/40 dark:bg-muted/10 flex items-center justify-center border border-border/60">
            {getIcon()}
          </div>
          <div>
            <DialogTitle className="text-sm font-bold tracking-tight text-foreground select-none">
              {dialogView === "selector" ? "Choose Workflow Component" : `Add New ${dialogView.toUpperCase()} Node`}
            </DialogTitle>
            <DialogDescription className="text-[10px] text-muted-foreground select-none">
              {dialogView === "selector" 
                ? "Select a component to configure and insert into your active flow."
                : "Configure parameters and instantiate it on the canvas."}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <div className="py-4 max-h-[420px] overflow-y-auto scrollbar-thin">
          <FieldGroup className="flex flex-col gap-4">

            {/* Selector Catalog View */}
            {dialogView === "selector" && (
              <div className="grid grid-cols-1 gap-3 animate-in fade-in duration-200">
                <p className="text-[11px] font-medium text-muted-foreground select-none mb-1">
                  Select a workflow component type to configure and replace the placeholder slot:
                </p>
                {[
                  {
                    id: "data",
                    title: "Market Data Feed",
                    desc: "Configure asset symbol, exchange feeds, timeframes, and leverage details.",
                    icon: <IconDatabase className="size-5 text-white" />,
                    color: "bg-purple-600",
                  },
                  {
                    id: "indicator",
                    title: "Technical Indicator",
                    desc: "Inject Bollinger Bands, ATR, EMA, SMA or other mathematical calculation gates.",
                    icon: <IconChartBar className="size-5 text-white" />,
                    color: "bg-orange-500",
                  },
                  {
                    id: "condition",
                    title: "Logic Condition",
                    desc: "Build branching evaluation statements, operand filters, and trigger logic.",
                    icon: <IconGitBranch className="size-5 text-white" />,
                    color: "bg-blue-600",
                  },
                  {
                    id: "action",
                    title: "Trading Action / Utility",
                    desc: "Dispatch market execution orders, trailing stop limits, or trigger webhook alert logs.",
                    icon: <IconBolt className="size-5 text-white" />,
                    color: "bg-emerald-600",
                  },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => selectCategory(cat.id)}
                    className="flex items-start gap-4 p-3 border border-border/80 hover:border-primary/60 hover:bg-muted/30 dark:hover:bg-muted/10 rounded-xl transition-all duration-200 text-left cursor-pointer group shadow-sm"
                  >
                    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 text-white ${cat.color} shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                      {cat.icon}
                    </div>
                    <div className="flex flex-col select-none">
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {cat.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-relaxed">
                        {cat.desc}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 1. DATA SOURCE NODE CONFIGURATION */}
            {dialogView === "data" && (
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
                    value={formData.assetClass || "PERPETUAL"}
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

                {formData.assetClass !== "OPTION" ? (
                  <>
                    <Field>
                      <FieldLabel>Trading Symbol</FieldLabel>
                      <Input
                        value={formData.symbol || "BTC/USD"}
                        onChange={(e) => {
                          updateFormKey("symbol", e.target.value);
                          updateFormKey("label", e.target.value);
                        }}
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
                        <div className="divide-y divide-zinc-900 max-h-48 overflow-y-auto">
                          {optionChain.map((strikeRow) => (
                            <div
                              key={strikeRow.strike}
                              className="grid grid-cols-9 gap-0.5 items-center py-1.5 hover:bg-zinc-900/40 text-center text-[10px] text-zinc-300 font-semibold"
                            >
                              <div className="col-span-2 text-zinc-500 font-mono text-[8px]">{strikeRow.callDelta.toFixed(2)}</div>
                              <div className="col-span-1 text-zinc-400">{strikeRow.callBid}</div>
                              <div className="col-span-1">
                                <button
                                  onClick={() => {
                                    updateFormKey("symbol", strikeRow.callSymbol);
                                    updateFormKey("label", strikeRow.callSymbol);
                                  }}
                                  className={`px-1 py-0.5 border text-[9px] rounded font-bold transition-all ${
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
                                  className={`px-1 py-0.5 border text-[9px] rounded font-bold transition-all ${
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
                        placeholder="Click a C or P contract from options list"
                      />
                    </Field>
                  </div>
                )}

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
            {dialogView === "indicator" && (
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
            {dialogView === "condition" && (
              <>
                <Field>
                  <FieldLabel>Condition Label</FieldLabel>
                  <Input
                    value={formData.label || "Volatility Check"}
                    onChange={(e) => updateFormKey("label", e.target.value)}
                    className="border-border/80 font-semibold"
                  />
                </Field>

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
                      <SelectItem value="ATR" className="font-mono">ATR</SelectItem>
                      <SelectItem value="EMA" className="font-mono">EMA</SelectItem>
                      <SelectItem value="RSI" className="font-mono">RSI</SelectItem>
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
                    value={formData.rightOperand || "BB_Upper"}
                    onValueChange={(val) => updateFormKey("rightOperand", val)}
                  >
                    <SelectTrigger className="w-full border-border/80 font-mono text-xs">
                      <SelectValue placeholder="Right Side" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000" className="font-mono">1000 (Static Target)</SelectItem>
                      <SelectItem value="BB_Upper" className="font-mono">BB_Upper (Bollinger Bands)</SelectItem>
                      <SelectItem value="BB_Lower" className="font-mono">BB_Lower (Bollinger Bands)</SelectItem>
                      <SelectItem value="BB_Middle" className="font-mono">BB_Middle (Bollinger Bands)</SelectItem>
                      <SelectItem value="EMA" className="font-mono">EMA Indicator</SelectItem>
                      <SelectItem value="ATR" className="font-mono">ATR Indicator</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}

            {/* 4. TRADING ACTION NODE CONFIGURATION */}
            {dialogView === "action" && (
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
                      <FieldLabel>Position Amount (contracts)</FieldLabel>
                      <Input
                        type="number"
                        step={0.01}
                        min={0.01}
                        value={formData.amount ?? 0.10}
                        onChange={(e) => updateFormKey("amount", parseFloat(e.target.value) || 0.10)}
                        className="font-mono border-border/80"
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

            {/* 5. STRATEGY-WIDE RISK MANAGEMENT NODE CONFIGURATION */}
            {dialogView === "risk" && (
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
                    className="font-mono border-border/80"
                  />
                  <FieldDescription>Enter fractional decimal value, e.g. 0.50 for 50% capital sizing.</FieldDescription>
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
        <DialogFooter className="border-t border-border/60 pt-4 flex flex-row items-center justify-between gap-3 shrink-0">
          {dialogView === "selector" ? (
            <Button
              variant="outline"
              onClick={() => {
                setActiveCreationType(null);
                setActiveCreationSource(null);
              }}
              className="w-full font-bold text-xs border-border/80 hover:bg-muted/80 cursor-pointer"
            >
              Cancel
            </Button>
          ) : (
            <>
              {activeCreationType === "selector" ? (
                <Button
                  variant="outline"
                  onClick={() => setDialogView("selector")}
                  className="flex-1 font-bold text-xs border-border/80 hover:bg-muted/80 cursor-pointer"
                >
                  Back to Catalog
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveCreationType(null);
                    setActiveCreationSource(null);
                  }}
                  className="flex-1 font-bold text-xs border-border/80 hover:bg-muted/80 cursor-pointer"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleCreate}
                className="flex-1 font-bold text-xs bg-primary text-primary-foreground shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <IconPlus className="size-4" />
                <span>Add to Canvas</span>
              </Button>
            </>
          )}
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
