"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconShield,
  IconX,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useNodesStore } from "../../../store/nodes-store";

export default function PolicyGroupDrawer() {
  const {
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    updateNodeData,
    setIsSynced,
    compileError,
  } = useNodesStore();

  const activeNode = nodes.find((n) => n.id === selectedNodeId);
  const isOpen = !!(activeNode && activeNode.type === "policyGroupNode");
  const hasError = compileError && selectedNodeId ? compileError.includes(selectedNodeId) : false;

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [inputStates, setInputStates] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && activeNode) {
      const data = activeNode.data || {};
      const policies = Array.isArray(data.policies) ? data.policies : [];
      setFormData({ ...data, policies });
      
      const initialInputStates: Record<string, string> = {};
                  policies.forEach((p: any) => {
        Object.entries(p).forEach(([k, v]) => {
          if (k !== "id" && k !== "type" && k !== "mode" && v !== undefined && v !== null) {
            initialInputStates[`${p.id}_${k}`] = v.toString();
          }
        });
      });
      setInputStates(initialInputStates);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedNodeId]);

  const update = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

      const sanitizeData = (data: Record<string, any>) => {
    return {
      ...data,
      policies: data.policies || [],
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

  const addPolicy = () => {
    const newPolicy = {
      id: `pol-${Date.now()}`,
      type: "stop_loss",
      mode: "PERCENTAGE",
      value: 5,
      quantity_pct: 1.0,
    };
    update("policies", [...(formData.policies || []), newPolicy]);
  };

  const deletePolicy = (id: string) => {
    const list = (formData.policies || []).filter((item: any) => item.id !== id);
    update("policies", list);
  };

  const updatePolicyItem = (id: string, key: string, val: any) => {
    const list = (formData.policies || []).map((item: any) => {
      if (item.id === id) {
        return { ...item, [key]: val };
      }
      return item;
    });
    update("policies", list);
  };

  const updatePolicyInput = (id: string, key: string, val: string) => {
    setInputStates(prev => ({ ...prev, [`${id}_${key}`]: val }));
    if (val === "") {
      updatePolicyItem(id, key, "");
    } else {
      updatePolicyItem(id, key, parseFloat(val));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="fixed !top-6 !left-6 !w-[calc(100vw-3rem)] !h-[calc(100vh-3rem)] !max-w-none !max-h-none !translate-x-0 !translate-y-0 !transform-none !gap-0 !rounded-2xl !border !border-border !shadow-2xl !p-0 bg-background text-foreground flex flex-col z-50 overflow-hidden">
        {/* Header Block */}
        <div className="h-16 border-b border-border px-6 flex items-center justify-between shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-orange-600/10 flex items-center justify-center border border-orange-500/20">
              <IconShield className="size-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
                Risk Policy Group
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

        {/* Workspace */}
        <div className="grow overflow-hidden flex flex-col bg-background relative">
          <div className="absolute inset-0 overflow-y-auto p-6 md:p-10 scrollbar-thin">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Active Policies</h2>
                  <p className="text-xs text-muted-foreground mt-1">Configure advanced exits downstream from an entry order.</p>
                </div>
                <Button
                  onClick={addPolicy}
                  size="sm"
                  className="h-9 gap-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold cursor-pointer rounded-xl px-4 shadow-sm"
                >
                  <IconPlus className="size-4" />
                  Add Policy
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(formData.policies || []).map((pol: any) => (
                  <div
                    key={pol.id}
                    className="p-5 bg-card border border-border rounded-xl relative hover:border-orange-500/30 transition-colors shadow-xs"
                  >
                    <button
                      onClick={() => deletePolicy(pol.id)}
                      className="absolute top-4 right-4 p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      title="Delete Policy"
                    >
                      <IconTrash className="size-4" />
                    </button>

                    <div className="mb-4">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 px-2 py-1 rounded">
                        Policy
                      </span>
                    </div>

                    <FieldGroup className="flex flex-col gap-4">
                      {/* Policy Type */}
                      <Field>
                        <FieldLabel className="font-semibold text-xs text-foreground">Type</FieldLabel>
                        <Select
                          value={pol.type || "stop_loss"}
                          onValueChange={(val) => updatePolicyItem(pol.id, "type", val)}
                        >
                          <SelectTrigger className="w-full text-xs h-9 bg-background border-input text-foreground rounded-xl">
                            <SelectValue placeholder="Select Policy" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-popover-foreground">
                            <SelectItem value="stop_loss" className="text-xs font-semibold text-red-500 focus:text-red-600">Stop Loss</SelectItem>
                            <SelectItem value="take_profit" className="text-xs font-semibold text-emerald-500 focus:text-emerald-600">Take Profit</SelectItem>
                            <SelectItem value="trailing_stop" className="text-xs font-semibold text-blue-500 focus:text-blue-600">Trailing Stop</SelectItem>
                            <SelectItem value="break_even" className="text-xs font-semibold text-amber-500 focus:text-amber-600">Break Even</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      {/* Mode and Value */}
                      {pol.type !== "break_even" && (
                        <div className="grid grid-cols-2 gap-4">
                          <Field>
                            <FieldLabel className="font-semibold text-xs text-foreground">Mode</FieldLabel>
                            <Select
                              value={pol.mode || "PERCENTAGE"}
                              onValueChange={(val) => updatePolicyItem(pol.id, "mode", val)}
                            >
                              <SelectTrigger className="w-full text-xs h-9 bg-background border-input text-foreground rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border text-popover-foreground">
                                <SelectItem value="PERCENTAGE" className="text-xs">Percentage (%)</SelectItem>
                                <SelectItem value="ATR_MULTIPLE" className="text-xs">ATR Multiple</SelectItem>
                                <SelectItem value="ABSOLUTE_PRICE" className="text-xs">Absolute Price</SelectItem>
                                                              </SelectContent>
                            </Select>
                          </Field>
                          <Field>
                            <FieldLabel className="font-semibold text-xs text-foreground">Value</FieldLabel>
                            <Input
                              type="number"
                              step="0.01"
                              value={inputStates[`${pol.id}_value`] ?? ""}
                              onChange={(e) => updatePolicyInput(pol.id, "value", e.target.value)}
                              className="font-mono text-xs h-9 bg-background border-input text-foreground rounded-xl"
                              placeholder="e.g. 5"
                            />
                          </Field>
                        </div>
                      )}

                      {/* Break Even Specific */}
                      {pol.type === "break_even" && (
                        <div className="grid grid-cols-2 gap-4">
                          <Field>
                            <FieldLabel className="font-semibold text-xs text-foreground">Trigger RR</FieldLabel>
                            <Input
                              type="number"
                              step="0.1"
                              value={inputStates[`${pol.id}_trigger_rr`] ?? ""}
                              onChange={(e) => updatePolicyInput(pol.id, "trigger_rr", e.target.value)}
                              className="font-mono text-xs h-9 bg-background border-input text-foreground rounded-xl"
                              placeholder="e.g. 1.0 (1R)"
                            />
                          </Field>
                          <Field>
                            <FieldLabel className="font-semibold text-xs text-foreground">Offset (Ticks)</FieldLabel>
                            <Input
                              type="number"
                              step="1"
                              value={inputStates[`${pol.id}_offset`] ?? ""}
                              onChange={(e) => updatePolicyInput(pol.id, "offset", e.target.value)}
                              className="font-mono text-xs h-9 bg-background border-input text-foreground rounded-xl"
                              placeholder="e.g. 1"
                            />
                          </Field>
                        </div>
                      )}

                      {/* Quantity % for Partial Exits (TP/SL) */}
                      {(pol.type === "take_profit" || pol.type === "stop_loss") && (
                        <Field>
                          <FieldLabel className="font-semibold text-xs text-foreground">Exit Quantity (%)</FieldLabel>
                          <Input
                            type="number"
                            step="1"
                            min="1"
                            max="100"
                            value={inputStates[`${pol.id}_quantity_pct`] ?? ""}
                            onChange={(e) => updatePolicyInput(pol.id, "quantity_pct", e.target.value)}
                            className="font-mono text-xs h-9 bg-background border-input text-foreground rounded-xl"
                            placeholder="e.g. 50"
                          />
                        </Field>
                      )}
                    </FieldGroup>
                  </div>
                ))}
                
                {(formData.policies || []).length === 0 && (
                  <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-2xl bg-muted/10">
                    <IconShield className="size-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-sm font-bold text-foreground">No Policies Defined</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm text-center">Add policies to manage your trade exits. Multiple take profits and trailing stops are fully supported.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="h-16 border-t border-border bg-card px-6 flex items-center justify-end gap-3 shrink-0 z-10">
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
            Save Policies
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
