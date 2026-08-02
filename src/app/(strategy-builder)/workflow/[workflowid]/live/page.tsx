"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconBolt, IconRocket } from "@tabler/icons-react";
import {
  useLiveSessions,
  useStartLiveSession,
  useStopLiveSession,
} from "@/api-actions/hooks/live-trading-hooks";
import { LiveSessionCard } from "../../../_components/live/live-session-card";
import { StartTradingDialog } from "../../../_components/live/start-trading-dialog";
import type { StartLiveSessionRequest } from "@/types/live-trading";

export default function LivePage() {
  const { workflowid: strategyId } = useParams<{ workflowid: string }>();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: sessions = [], isLoading } = useLiveSessions(strategyId);
  const startMutation = useStartLiveSession(strategyId);
  const stopMutation = useStopLiveSession(strategyId);

  const handleStart = (params: StartLiveSessionRequest) => {
    startMutation.mutate(params, {
      onSuccess: (result) => {
        setDialogOpen(false);
        toast.success(
          params.mode === "LIVE" ? "Live session starting." : "Paper session starting.",
          { description: `Session ${result.session_id.slice(0, 8)} on Delta.` }
        );
        router.push(`/workflow/${strategyId}/live/${result.session_id}`);
      },
      onError: (err: Error) => toast.error(err?.message ?? "Failed to start session."),
    });
  };

  const handleStop = (sessionId: string) => {
    stopMutation.mutate(sessionId, {
      onSuccess: () => toast.warning("Stop signal sent."),
      onError: (err: Error) => toast.error(err?.message ?? "Failed to stop session."),
    });
  };

  return (
    <div className="fixed inset-0 top-17 overflow-y-auto bg-background">
      <div className="w-full max-w-400 mx-auto px-8 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <IconBolt className="size-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Live Trading</h1>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                {sessions.length} session{sessions.length === 1 ? "" : "s"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-md">
              Deploy this strategy against Delta Exchange — paper trading simulates
              fills over real market prices, live trading places real orders.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="h-9 gap-1.5 rounded-full px-4 text-xs font-bold cursor-pointer"
          >
            <IconRocket className="size-3.5" />
            Start Trading
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 border border-dashed border-border/40 rounded-xl">
            <IconBolt className="size-6 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No sessions yet — start paper or live trading to get going.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {[...sessions]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((session) => (
                <LiveSessionCard
                  key={session.id}
                  session={session}
                  onClick={() => router.push(`/workflow/${strategyId}/live/${session.id}`)}
                  onStop={() => handleStop(session.id)}
                  isStopping={stopMutation.isPending}
                />
              ))}
          </div>
        )}
      </div>

      <StartTradingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleStart}
        isSubmitting={startMutation.isPending}
      />
    </div>
  );
}
