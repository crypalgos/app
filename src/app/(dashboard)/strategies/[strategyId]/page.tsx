"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useStrategy } from "@/api-actions/hooks/strategy-hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { IconCpu, IconCalendar, IconExchange, IconCode, IconTerminal2, IconShield } from "@tabler/icons-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StrategyFlowMap } from "../_components/strategy-flow-map";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";

export default function StrategyOverviewPage() {
  const params = useParams();
  const strategyId = params?.strategyId as string;
  const { data: strategy, isLoading } = useStrategy(strategyId);
  const { resolvedTheme } = useTheme();

  // Extract global risk settings profile parameters
  const riskParams = useMemo(() => {
    const canvasJson = strategy?.canvas_json;
    if (!canvasJson || !canvasJson.nodes) return [];
    const nodes = canvasJson.nodes || [];
    const startNode = nodes.find((n: any) => n.type === "startNode");
    const riskNode = nodes.find(
      (n: any) =>
        n.type === "riskManagementNode" ||
        n.type === "policyGroupNode" ||
        n.type === "riskManagement" ||
        n.type === "policyGroup"
    );

    const mergedRiskData = {
      ...(startNode?.data || {}),
      ...(riskNode?.data || {}),
    };

    let paramsList = [];
    if (startNode?.data?.leverage !== undefined) {
      paramsList.push({ label: "Leverage", value: `${startNode.data.leverage}x (${startNode.data.exchange || "Delta"})` });
    }
    if (mergedRiskData.position_size_pct !== undefined && mergedRiskData.position_size_pct !== null) {
      paramsList.push({ label: "Max Position Size", value: `${(Number(mergedRiskData.position_size_pct) * 100).toFixed(0)}%` });
    }
    if (mergedRiskData.max_drawdown_pct !== undefined && mergedRiskData.max_drawdown_pct !== null) {
      paramsList.push({ label: "Max Drawdown Limit", value: `${(Number(mergedRiskData.max_drawdown_pct) * 100).toFixed(0)}%` });
    }
    if (mergedRiskData.daily_loss_limit !== undefined) {
      paramsList.push({ label: "Daily Loss Limit", value: `$${mergedRiskData.daily_loss_limit}` });
    }
    if (mergedRiskData.max_open_positions !== undefined) {
      paramsList.push({ label: "Max Open Positions", value: `${mergedRiskData.max_open_positions}` });
    }
    if (mergedRiskData.atr_sl_mult !== undefined) {
      paramsList.push({ label: "Stop Loss", value: `${mergedRiskData.atr_sl_mult}x ATR` });
    }
    if (mergedRiskData.atr_tp_mult !== undefined) {
      paramsList.push({ label: "Take Profit", value: `${mergedRiskData.atr_tp_mult}x ATR` });
    }
    return paramsList;
  }, [strategy?.canvas_json]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* ─── Global Risk settings (Full Width on Top) ─── */}
      {riskParams.length > 0 && (
        <div className="p-5 rounded-xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/10 backdrop-blur-xs flex flex-col gap-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 tracking-wide pl-0.5">
            <IconShield className="size-4 text-amber-600 dark:text-amber-500" />
            <span>GLOBAL RISK CONTROL PROFILE</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {riskParams.map((param, i) => (
              <div key={i} className="px-3.5 py-3 rounded-lg bg-card text-card-foreground border border-border/80 shadow-xs flex flex-col justify-between flex-1 min-w-[140px]">
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-none" title={param.label}>
                  {param.label}
                </div>
                <div className="text-xs font-bold text-foreground mt-2 leading-none font-mono">{param.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page Content (Full Width) */}
      <div className="w-full">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Strategy Logic & Flow</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Trace the internal decision paths of this strategy.
          </p>
        </div>
        <StrategyFlowMap canvasJson={strategy?.canvas_json} />
      </div>
    </div>
  );
}
