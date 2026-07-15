"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconActivity, IconFlask } from "@tabler/icons-react";
import {
  useTemporaryBacktests,
  useTriggerBacktest,
  useSaveBacktest,
  useToggleRunFavorite,
} from "@/api-actions/hooks/strategy-hooks";
import { BacktestConfigDialog, type BacktestConfigParams } from "../shared/backtest-config-dialog";
import { TempRunCard } from "./temp-run-card";
import { ReplayViewer } from "./replay-viewer";

interface AnalyseTabProps {
  strategyId: string;
}

export default function AnalyseTab({ strategyId }: AnalyseTabProps) {
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [savingRunId, setSavingRunId] = useState<string | null>(null);

  const { data, isLoading } = useTemporaryBacktests(strategyId, 1, 20);
  const { mutateAsync: triggerBacktest, isPending: isEnqueuing } = useTriggerBacktest(strategyId);
  const { mutateAsync: saveBacktest } = useSaveBacktest(strategyId);
  const { mutate: toggleFavorite } = useToggleRunFavorite(strategyId);

  const runs = data?.runs ?? [];

  const handleTrigger = async (params: BacktestConfigParams) => {
    setConfigOpen(false);
    toast.info("Starting Analyse run…", {
      description: `${params.start_date.slice(0, 10)} → ${params.end_date.slice(0, 10)} · $${params.initial_capital.toLocaleString()} — won't save a version`,
      duration: 3000,
    });
    try {
      await triggerBacktest({ ...params, temporary: true });
      toast.success("Analyse run enqueued. It'll appear below once it starts.");
    } catch {
      toast.error("Failed to run backtest. Ensure your Data Node is configured with a symbol and exchange.");
    }
  };

  const handleSave = async (runId: string) => {
    setSavingRunId(runId);
    try {
      const result = await saveBacktest({ runId });
      toast.success(
        result.created_new_version
          ? `Saved — created strategy v${result.version_number}`
          : `Saved — linked to current v${result.version_number} (no changes detected)`
      );
    } catch {
      toast.error("Failed to save this run.");
    } finally {
      setSavingRunId(null);
    }
  };

  if (selectedRunId) {
    return (
      <div className="fixed inset-0 top-[68px] overflow-hidden">
        <ReplayViewer runId={selectedRunId} onBack={() => setSelectedRunId(null)} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-[68px] overflow-y-auto bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <IconFlask className="size-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Analyse</h1>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                {runs.length} run{runs.length === 1 ? "" : "s"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-md">
              Quick, disposable backtests against your current draft — nothing here
              touches your strategy version until you explicitly Save a result.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setConfigOpen(true)}
            disabled={isEnqueuing}
            className="h-9 gap-1.5 rounded-full px-4 text-xs font-bold cursor-pointer"
          >
            <IconActivity className="size-3.5" />
            Run Backtest
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 border border-dashed border-border/40 rounded-xl">
            <IconFlask className="size-6 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No Analyse runs yet — run a quick backtest to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {runs.map((run) => (
              <TempRunCard
                key={run.id}
                run={run}
                isSaving={savingRunId === run.id}
                onClick={() => setSelectedRunId(run.id)}
                onSave={() => handleSave(run.id)}
                onTogglePin={() =>
                  toggleFavorite({ runId: run.id, isFavorite: !run.is_favorite })
                }
              />
            ))}
          </div>
        )}
      </div>

      <BacktestConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        onSubmit={handleTrigger}
        isSubmitting={isEnqueuing}
        temporary
      />
    </div>
  );
}
