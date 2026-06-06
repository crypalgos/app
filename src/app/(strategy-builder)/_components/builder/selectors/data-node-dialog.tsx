"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconDatabase,
} from "@tabler/icons-react";
import { useNodesStore } from "../../../store/nodes-store";
import { getCoinLogoUrl } from "@/lib/instruments";
import { fetchConfigRegistry, Broker, Instrument } from "@/api-actions/config-actions";

// Dynamic timeframes fetched from API

export default function DataNodeDialog() {
  const {
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    updateNodeData,
    setIsSynced,
  } = useNodesStore();

  const activeNode = nodes.find((n) => n.id === selectedNodeId);
  const isOpen = !!(activeNode && activeNode.type === "dataNode");

  // Determine active broker from StartNode
  const startNode = React.useMemo(() => nodes.find(n => n.type === "startNode"), [nodes]);
  const activeBrokerId = startNode?.data?.exchange || "delta";

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [inputStates, setInputStates] = useState<Record<string, string>>({});
  const [brokers, setBrokers] = useState<Record<string, Broker>>({});
  const [timeframes, setTimeframes] = useState<string[]>([]);

  useEffect(() => {
    fetchConfigRegistry().then((config) => {
      setBrokers(config.brokers);
      setTimeframes(config.timeframes);
    }).catch(console.error);
  }, []);

  const activeBroker: Broker | undefined = brokers[activeBrokerId as string];

  useEffect(() => {
    if (isOpen && activeNode) {
      const data = activeNode.data || {};
      setFormData({ ...data });
      setInputStates({
        leverage: data.leverage?.toString() || "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedNodeId]);

  const update = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const updateInput = (key: string, value: string) => {
    setInputStates((prev) => ({ ...prev, [key]: value }));
    if (value === "") {
      update(key, "");
    } else {
      update(key, parseInt(value));
    }
  };

  const sanitizeData = (data: Record<string, any>) => {
    // Find if it's perpetual based on the active broker's registry
    let isPerp = false;
    if (activeBroker?.instruments?.perpetual) {
      isPerp = activeBroker.instruments.perpetual.some((i: Instrument) => i.symbol === data.symbol);
    }
    
    return {
      ...data,
      source: activeBrokerId,
      dataType: "OHLCV",
      assetClass: isPerp ? "PERPETUAL" : "FUTURES", // Defaults to futures if not perp
      leverage: data.leverage === "" || isNaN(Number(data.leverage)) ? 10 : Number(data.leverage),
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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-card border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="size-6 rounded bg-purple-600 flex items-center justify-center">
              <IconDatabase className="size-3 text-white" />
            </div>
            Data Source Configuration
          </DialogTitle>
          <DialogDescription>
            Configure the market data feed for this source node.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto scrollbar-thin px-2">
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <h3 className="text-sm font-semibold text-foreground">Market Data Feed</h3>
            </div>

            <div className="flex flex-col gap-4">
              {/* Exchange */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-semibold">Exchange Broker</Label>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                    <img src="https://www.delta.exchange/favicon.ico" alt="Delta" className="size-6 rounded bg-white p-0.5 shadow-sm" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold leading-none">Delta Exchange India</span>
                      <span className="text-xs text-muted-foreground mt-1">Selected in Start Node</span>
                    </div>
                </div>
              </div>

              {/* Asset Class Tabs & Instrument Dropdown */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold">Asset Class</Label>
                  <Tabs
                    value={formData.assetClass || "PERPETUAL"}
                    onValueChange={(val) => {
                      update("assetClass", val);
                      update("symbol", ""); // Reset symbol when switching class
                    }}
                    className="w-full"
                  >
                    <TabsList className="w-full grid grid-cols-4 h-9">
                      <TabsTrigger value="SPOT" disabled={!activeBroker?.instruments?.spot?.length} className="text-xs">Spot</TabsTrigger>
                      <TabsTrigger value="FUTURES" disabled={!activeBroker?.instruments?.futures?.length} className="text-xs">Futures</TabsTrigger>
                      <TabsTrigger value="PERPETUAL" disabled={!activeBroker?.instruments?.perpetual?.length} className="text-xs">Perps</TabsTrigger>
                      <TabsTrigger value="OPTIONS" disabled={!activeBroker?.instruments?.options?.length} className="text-xs">Options</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold">Instrument</Label>
                  <Select
                    value={formData.symbol || ""}
                    onValueChange={(val) => update("symbol", val)}
                  >
                    <SelectTrigger className="w-full text-sm h-10">
                      <SelectValue placeholder="Select Instrument" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned" className="w-[var(--radix-select-trigger-width)] max-h-[250px]">
                      {(() => {
                        if (!activeBroker?.instruments) return null;
                        
                        const typeMapping: Record<string, string> = {
                          "SPOT": "spot",
                          "FUTURES": "futures",
                          "PERPETUAL": "perpetual",
                          "OPTIONS": "options"
                        };
                        
                        const currentType = typeMapping[formData.assetClass || "PERPETUAL"];
                        const instruments = (activeBroker.instruments as any)[currentType] as Instrument[] || [];
                        
                        if (instruments.length === 0) {
                          return <div className="p-4 text-center text-xs text-muted-foreground">No instruments available</div>;
                        }
                        
                        return instruments.map((inst: Instrument) => (
                          <SelectItem key={inst.symbol} value={inst.symbol} className="text-xs">
                            <div className="flex items-center gap-2">
                              <img 
                                src={getCoinLogoUrl(inst.coin)} 
                                alt={inst.coin} 
                                className="size-4 rounded-full bg-white shadow-sm"
                              />
                              <span className="font-bold">{inst.symbol}</span>
                              <span className="text-[10px] text-muted-foreground">({inst.name})</span>
                            </div>
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <h3 className="text-sm font-semibold text-foreground">Parameters</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Leverage */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="dnd-leverage" className="text-sm font-semibold">
                  Leverage
                </Label>
                <Input
                  id="dnd-leverage"
                  type="number"
                  min={1}
                  max={100}
                  value={inputStates.leverage}
                  onChange={(e) => updateInput("leverage", e.target.value)}
                  className="font-mono text-sm h-10"
                  placeholder="10"
                />
              </div>

              {/* Timeframe */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-semibold">Timeframe</Label>
                <Select
                  value={formData.timeframe || "1h"}
                  onValueChange={(val) => update("timeframe", val)}
                >
                  <SelectTrigger className="w-full border-border font-mono text-sm h-10">
                    <SelectValue placeholder="Timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeframes.map((tf) => (
                      <SelectItem key={tf} value={tf}>{tf.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Summary badge */}
          {formData.symbol && (
            <div className="flex items-center gap-2 bg-muted/20 border border-border rounded-xl px-4 py-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Summary
              </span>
              <Badge variant="secondary" className="text-xs font-mono ml-auto">
                {formData.symbol} · {activeBroker?.instruments?.perpetual?.some((i: Instrument) => i.symbol === formData.symbol) ? "PERPETUAL" : "FUTURES"} ·{" "}
                {formData.timeframe || "1h"} · {formData.leverage || 10}×
              </Badge>
            </div>
          )}

        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply} disabled={!formData.symbol}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
