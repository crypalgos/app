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
import {
  IconShield,
  IconBriefcase,
  IconCoin,
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

  useEffect(() => {
    if (isOpen && activeNode) {
      const data = activeNode.data || {};
      setFormData(data);
      setInputStates({
        max_drawdown_pct: data.max_drawdown_pct?.toString() || "",
        daily_loss_limit: data.daily_loss_limit?.toString() || "",
        atr_sl_mult: data.atr_sl_mult?.toString() || "",
        atr_tp_mult: data.atr_tp_mult?.toString() || "",
        max_open_positions: data.max_open_positions?.toString() || "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedNodeId]);

  const update = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const updateInput = (key: string, value: string) => {
    setInputStates((prev) => ({ ...prev, [key]: value }));
    if (value === "") {
      update(key, undefined);
    } else {
      update(key, parseFloat(value));
    }
  };

  const sanitizeData = (data: Record<string, any>) => {
    return {
      ...data,
      exchange: data.exchange || "delta",
      max_drawdown_pct: isNaN(Number(data.max_drawdown_pct)) ? undefined : Number(data.max_drawdown_pct),
      daily_loss_limit: isNaN(Number(data.daily_loss_limit)) ? undefined : Number(data.daily_loss_limit),
      atr_sl_mult: isNaN(Number(data.atr_sl_mult)) ? undefined : Number(data.atr_sl_mult),
      atr_tp_mult: isNaN(Number(data.atr_tp_mult)) ? undefined : Number(data.atr_tp_mult),
      max_open_positions: isNaN(Number(data.max_open_positions)) ? undefined : Number(data.max_open_positions),
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
      <DialogContent className="max-w-xl bg-card border-border shadow-xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="p-6 pb-4 shrink-0 border-b border-border bg-muted/20">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-inner">
              <IconBriefcase className="size-4 text-white" />
            </div>
            Strategy Root Configuration
          </DialogTitle>
          <DialogDescription>
            Define your execution environment and global risk multipliers.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-8 bg-background">
          
          {/* ── Execution ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <IconCoin className="size-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Execution</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold">Execution Broker</Label>
                <Select
                  value={formData.exchange || "delta"}
                  onValueChange={(val) => update("exchange", val)}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delta">Delta Exchange India</SelectItem>
                    <SelectItem value="binance">Binance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Portfolio Risk ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <IconShield className="size-4 text-orange-500" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Portfolio Risk & Multipliers</h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold">Max Drawdown (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={inputStates.max_drawdown_pct}
                  onChange={(e) => updateInput("max_drawdown_pct", e.target.value)}
                  className="h-10 rounded-xl font-mono bg-muted/30"
                  placeholder="0.25"
                />
                <p className="text-[10px] text-muted-foreground">e.g. 0.25 = 25% from peak</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold">Daily Loss Limit ($)</Label>
                <Input
                  type="number"
                  value={inputStates.daily_loss_limit}
                  onChange={(e) => updateInput("daily_loss_limit", e.target.value)}
                  className="h-10 rounded-xl font-mono bg-muted/30"
                  placeholder="1000"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold">Max Open Positions</Label>
                <Input
                  type="number"
                  value={inputStates.max_open_positions}
                  onChange={(e) => updateInput("max_open_positions", e.target.value)}
                  className="h-10 rounded-xl font-mono bg-muted/30"
                  placeholder="3"
                />
              </div>

              <div className="col-span-1" />

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold">ATR Stop-Loss Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={inputStates.atr_sl_mult}
                  onChange={(e) => updateInput("atr_sl_mult", e.target.value)}
                  className="h-10 rounded-xl font-mono bg-muted/30"
                  placeholder="2.0"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold">ATR Take-Profit Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={inputStates.atr_tp_mult}
                  onChange={(e) => updateInput("atr_tp_mult", e.target.value)}
                  className="h-10 rounded-xl font-mono bg-muted/30"
                  placeholder="4.0"
                />
              </div>

            </div>
          </div>
          
        </div>

        <div className="p-4 border-t border-border bg-muted/10 shrink-0 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)} className="h-9 rounded-lg">
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply} className="h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
