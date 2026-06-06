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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconShield,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useNodesStore } from "../../../store/nodes-store";

export default function StartNodeDialog() {
  const {
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    updateNodeData,
    setIsSynced,
  } = useNodesStore();

  const activeNode = nodes.find((n) => n.id === selectedNodeId);
  const isOpen = !!(activeNode && activeNode.type === "startNode");

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [inputStates, setInputStates] = useState<Record<string, string>>({});

  // Seed form from node + global store
  useEffect(() => {
    if (isOpen && activeNode) {
      const data = activeNode.data || {};
      setFormData(data);
      setInputStates({
        max_drawdown_pct: data.max_drawdown_pct?.toString() || "",
        atr_sl_mult: data.atr_sl_mult?.toString() || "",
        atr_tp_mult: data.atr_tp_mult?.toString() || "",
        max_open_positions: data.max_open_positions?.toString() || "",
        daily_loss_limit: data.daily_loss_limit?.toString() || "",
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
      update(key, parseFloat(value));
    }
  };

  const sanitizeData = (data: Record<string, any>) => {
    return {
      ...data,
      max_drawdown_pct: data.max_drawdown_pct === "" || isNaN(Number(data.max_drawdown_pct)) ? 0.25 : Number(data.max_drawdown_pct),
      atr_sl_mult: data.atr_sl_mult === "" || isNaN(Number(data.atr_sl_mult)) ? 2.0 : Number(data.atr_sl_mult),
      atr_tp_mult: data.atr_tp_mult === "" || isNaN(Number(data.atr_tp_mult)) ? 5.0 : Number(data.atr_tp_mult),
      max_open_positions: data.max_open_positions === "" || isNaN(Number(data.max_open_positions)) ? 2 : Number(data.max_open_positions),
      daily_loss_limit: data.daily_loss_limit === "" || isNaN(Number(data.daily_loss_limit)) ? null : Number(data.daily_loss_limit),
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
      // Auto-commit on close
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
            <div className="size-6 rounded bg-green-600 flex items-center justify-center">
              <IconShield className="size-3 text-white" />
            </div>
            Strategy Settings
          </DialogTitle>
          <DialogDescription>
            Configure execution broker and global risk management.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto scrollbar-thin px-2">
          
          {/* ── Execution Broker ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <h3 className="text-sm font-semibold text-foreground">Execution Broker</h3>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold">Exchange Broker</Label>
              <Select
                value={formData.exchange || "delta"}
                onValueChange={(val) => update("exchange", val)}
              >
                <SelectTrigger className="w-full h-auto p-3 flex items-center justify-between rounded-lg border border-border bg-muted/20 hover:bg-muted/30 transition-colors [&>svg]:opacity-50">
                  <div className="flex items-center gap-3">
                    {formData.exchange === "binance" ? (
                      <img src="https://binance.com/favicon.ico" alt="Binance" className="size-6 rounded bg-white p-0.5 shadow-sm" />
                    ) : formData.exchange === "bybit" ? (
                      <img src="https://bybit.com/favicon.ico" alt="Bybit" className="size-6 rounded bg-white p-0.5 shadow-sm" />
                    ) : (
                      <img src="https://www.delta.exchange/favicon.ico" alt="Delta" className="size-6 rounded bg-white p-0.5 shadow-sm" />
                    )}
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-bold leading-none">
                        {formData.exchange === "binance" ? "Binance" : formData.exchange === "bybit" ? "Bybit" : "Delta Exchange India"}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">Global Execution Venue</span>
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="delta" className="py-2">
                    <div className="flex items-center gap-2">
                      <img src="https://www.delta.exchange/favicon.ico" alt="Delta" className="size-4 rounded bg-white p-0.5 shadow-sm" />
                      <span className="font-bold text-sm">Delta Exchange India</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="binance" className="py-2">
                    <div className="flex items-center gap-2">
                      <img src="https://binance.com/favicon.ico" alt="Binance" className="size-4 rounded bg-white p-0.5 shadow-sm" />
                      <span className="font-bold text-sm">Binance</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bybit" className="py-2">
                    <div className="flex items-center gap-2">
                      <img src="https://bybit.com/favicon.ico" alt="Bybit" className="size-4 rounded bg-white p-0.5 shadow-sm" />
                      <span className="font-bold text-sm">Bybit</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The broker where the strategy will execute live trades.
              </p>
            </div>
          </div>

          {/* ── Risk Management ── */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <div className="size-5 rounded bg-orange-500/20 flex items-center justify-center">
                <IconAlertTriangle className="size-3 text-orange-500" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Risk Management</h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="snd-daily-loss" className="text-sm font-semibold">
                  Daily Loss Limit ($)
                </Label>
                <Input
                  id="snd-daily-loss"
                  type="number"
                  step={1}
                  min={0}
                  value={inputStates.daily_loss_limit}
                  onChange={(e) => updateInput("daily_loss_limit", e.target.value)}
                  className="font-mono text-sm h-10"
                  placeholder="1000"
                />
                <p className="text-[10px] text-muted-foreground">
                  Max USD loss before halting
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="snd-drawdown" className="text-sm font-semibold">
                  Max Drawdown (pct)
                </Label>
                <Input
                  id="snd-drawdown"
                  type="number"
                  step={0.01}
                  min={0.01}
                  max={1.0}
                  value={inputStates.max_drawdown_pct}
                  onChange={(e) => updateInput("max_drawdown_pct", e.target.value)}
                  className="font-mono text-sm h-10"
                  placeholder="0.25"
                />
                <p className="text-[10px] text-muted-foreground">
                  e.g. 0.25 = 25% peak cap
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="snd-sl-mult" className="text-sm font-semibold">
                  ATR Stop Loss Mult
                </Label>
                <Input
                  id="snd-sl-mult"
                  type="number"
                  step={0.1}
                  min={0.1}
                  value={inputStates.atr_sl_mult}
                  onChange={(e) => updateInput("atr_sl_mult", e.target.value)}
                  className="font-mono text-sm h-10"
                  placeholder="2.0"
                />
                <p className="text-[10px] text-muted-foreground">
                  SL = entry ± (ATR × mult)
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="snd-tp-mult" className="text-sm font-semibold">
                  ATR Take Profit Mult
                </Label>
                <Input
                  id="snd-tp-mult"
                  type="number"
                  step={0.1}
                  min={0.1}
                  value={inputStates.atr_tp_mult}
                  onChange={(e) => updateInput("atr_tp_mult", e.target.value)}
                  className="font-mono text-sm h-10"
                  placeholder="5.0"
                />
                <p className="text-[10px] text-muted-foreground">
                  TP = entry ± (ATR × mult)
                </p>
              </div>

              <div className="flex flex-col gap-2 col-span-2">
                <Label htmlFor="snd-max-pos" className="text-sm font-semibold">
                  Max Parallel Open Positions
                </Label>
                <Input
                  id="snd-max-pos"
                  type="number"
                  min={1}
                  value={inputStates.max_open_positions}
                  onChange={(e) => updateInput("max_open_positions", e.target.value)}
                  className="font-mono text-sm h-10"
                  placeholder="2"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
