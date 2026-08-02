"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconLoader2, IconPlayerStop, IconRocket } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { LiveSessionStatus, LiveTradingSession } from "@/types/live-trading";

interface LiveSessionCardProps {
  session: LiveTradingSession;
  onClick: () => void;
  onStop: () => void;
  isStopping: boolean;
}

const STATUS_STYLES: Record<LiveSessionStatus, string> = {
  STARTING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  RUNNING: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  STOPPING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  STOPPED: "bg-muted text-muted-foreground border-border/40",
  ERROR: "bg-destructive/10 text-destructive border-destructive/20",
};

function fmtDate(d?: string | null) {
  return d
    ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
        " " +
        new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "—";
}

export function LiveSessionCard({ session, onClick, onStop, isStopping }: LiveSessionCardProps) {
  const isActive = session.status === "RUNNING" || session.status === "STARTING";

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl bg-card border border-border/60 p-5 flex flex-col gap-3 font-sans transition-colors hover:border-primary/40"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">{session.mode}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {session.broker}
          </span>
        </div>
        <Badge className={cn("border text-[10px] px-2", STATUS_STYLES[session.status])}>
          {(session.status === "RUNNING" || session.status === "STARTING") && (
            <span className="mr-1 inline-block size-1.5 rounded-full bg-current animate-pulse" />
          )}
          {session.status}
        </Badge>
      </div>

      {session.error_msg && (
        <p className="text-xs text-destructive/80 bg-destructive/10 rounded-xl p-2.5 border border-destructive/15 line-clamp-2">
          {session.error_msg}
        </p>
      )}

      <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
        <span>Started {fmtDate(session.started_at ?? session.created_at)}</span>
        {session.stopped_at && <span>Stopped {fmtDate(session.stopped_at)}</span>}
      </div>

      {isActive && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            disabled={isStopping}
            onClick={(e) => {
              e.stopPropagation();
              onStop();
            }}
            className="h-7 gap-1.5 text-xs cursor-pointer border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            {isStopping ? (
              <IconLoader2 className="size-3 animate-spin" />
            ) : (
              <IconPlayerStop className="size-3" />
            )}
            Stop
          </Button>
        </div>
      )}
      {!isActive && (
        <div className="flex justify-end">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <IconRocket className="size-3" /> View session
          </span>
        </div>
      )}
    </div>
  );
}
