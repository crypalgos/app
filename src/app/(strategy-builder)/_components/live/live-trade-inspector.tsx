"use client";

import { format } from "date-fns";
import { IconInfoCircle, IconReceipt2 } from "@tabler/icons-react";
import { presentEvent } from "@/lib/trading/event-presentation";
import { computeFillLatencyMs } from "@/lib/trading/position-and-latency";
import type { GenericEngineEvent, ReplayEventNode } from "@/types/replay";
import type { SessionTrade } from "@/lib/trading/trades";

const asNode = (e: GenericEngineEvent): ReplayEventNode => ({ ...e, children: [] });

interface LiveTradeInspectorProps {
  trade: SessionTrade | null;
  runtimeEvents: GenericEngineEvent[];
  hasAnyTrades: boolean;
}

const fmt = (n: number | null | undefined, digits = 2) =>
  n == null ? "—" : n.toLocaleString(undefined, { maximumFractionDigits: digits });

function EventList({ title, events }: { title: string; events: GenericEngineEvent[] }) {
  if (events.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </span>
      {events.map((ev) => {
        const { label, details } = presentEvent(asNode(ev));
        return (
          <div key={ev.sequence_number} className="rounded-lg border border-border/60 px-2.5 py-1.5">
            <p className="text-xs font-semibold text-foreground">{label}</p>
            <p className="text-[11px] text-muted-foreground">{details}</p>
          </div>
        );
      })}
    </div>
  );
}

export function LiveTradeInspector({ trade, runtimeEvents, hasAnyTrades }: LiveTradeInspectorProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40 shrink-0">
        <IconReceipt2 className="size-3.5 text-primary" />
        <h3 className="text-[11px] font-semibold text-foreground/80 tracking-wide">Trade Inspector</h3>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {trade ? (
          <TradeDetail trade={trade} runtimeEvents={runtimeEvents} />
        ) : (
          <div className="flex h-full items-center justify-center text-center text-[11px] text-muted-foreground px-2">
            {hasAnyTrades
              ? "No trades yet at this point in the session."
              : "No trades yet — waiting for the strategy to open a position."}
          </div>
        )}
      </div>
    </div>
  );
}

function TradeDetail({
  trade,
  runtimeEvents,
}: {
  trade: SessionTrade;
  runtimeEvents: GenericEngineEvent[];
}) {
  const entryBarEvents = runtimeEvents.filter((e) => e.candle_index === trade.entry_candle_index);
  const exitBarEvents =
    trade.exit_candle_index != null
      ? runtimeEvents.filter((e) => e.candle_index === trade.exit_candle_index)
      : [];
  const fillLatencyMs = computeFillLatencyMs(entryBarEvents.map(asNode));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">{trade.side}</span>
          <span
            className={
              trade.is_open
                ? "text-xs font-semibold text-muted-foreground"
                : (trade.realized_pnl ?? 0) >= 0
                  ? "text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                  : "text-xs font-semibold text-destructive"
            }
          >
            {trade.is_open ? "Open" : `PnL ${(trade.realized_pnl ?? 0) >= 0 ? "+" : ""}${fmt(trade.realized_pnl)}`}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Entry {fmt(trade.entry_price)} @ {format(new Date(trade.entry_time), "MMM d, HH:mm:ss")}
        </p>
        {!trade.is_open && trade.exit_time != null && (
          <p className="text-xs text-muted-foreground">
            Exit {fmt(trade.exit_price)} @ {format(new Date(trade.exit_time), "MMM d, HH:mm:ss")}
          </p>
        )}
        <p className="text-xs text-muted-foreground">Quantity {fmt(trade.quantity, 4)}</p>
        {fillLatencyMs != null && (
          <p className="text-xs text-muted-foreground">Fill latency {fillLatencyMs}ms</p>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
        <IconInfoCircle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        <p className="text-[11px] text-muted-foreground">
          Decision trace not available for live sessions yet — condition evaluation
          isn&apos;t recorded for live/paper trading today.
        </p>
      </div>

      <EventList title="At entry" events={entryBarEvents} />
      {!trade.is_open && <EventList title="At exit" events={exitBarEvents} />}
    </div>
  );
}
