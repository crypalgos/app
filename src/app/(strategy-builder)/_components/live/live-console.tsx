"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { IconArrowRight, IconChevronDown, IconChevronUp, IconGripHorizontal, IconTerminal2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { REPLAY_COLORS, categoryForEventType } from "@/lib/replay-colors";
import { computeCurrentPosition, type CurrentPosition } from "@/lib/trading/position-and-latency";
import { flattenCandleTree } from "@/lib/trading/candle-tree";
import { presentEvent } from "@/lib/trading/event-presentation";
import { computeDrawdownSeries, computeMetricLabel, type PortfolioHistoryPoint } from "@/lib/replay-analysis";
import type { LiveStreamStatus } from "@/hooks/use-live-session-stream";
import type { SessionTrade } from "@/lib/trading/trades";
import type { CandleTreeGroup, GenericEngineEvent, IndicatorSnapshotRecord, ReplayCandle } from "@/types/replay";
import type { LiveTradingSession } from "@/types/live-trading";

// The live counterpart of replay-console.tsx — same seven tabs, same visual
// chrome, same shared presentation helpers (presentEvent/flattenCandleTree/
// computeCurrentPosition/computeDrawdownSeries are already data-source-
// agnostic). What differs is the DATA: live has no chunked Zustand store, no
// whole-run summary_json (a live session has no fixed endpoint to summarize),
// and no "spoiler" concept (nothing is ahead of "now" to hide). Every event
// here is the flat, already-in-memory runtimeEvents array live-viewer.tsx
// already computes -- no separate store, no pagination.

const HEIGHT_KEY = "live-console-height";
const DEFAULT_HEIGHT = 260;
const MIN_HEIGHT = 140;
const MAX_HEIGHT = 640;

type ConsoleTab = "timeline" | "trades" | "orders" | "portfolio" | "metrics" | "logs" | "debug";

const TABS: { key: ConsoleTab; label: string }[] = [
  { key: "timeline", label: "Timeline" },
  { key: "trades", label: "Trades" },
  { key: "orders", label: "Orders" },
  { key: "portfolio", label: "Portfolio" },
  { key: "metrics", label: "Metrics" },
  { key: "logs", label: "Execution Log" },
  { key: "debug", label: "Debug" },
];

interface LiveConsoleProps {
  session: LiveTradingSession;
  wsStatus: LiveStreamStatus;
  runtimeEvents: GenericEngineEvent[];
  trades: SessionTrade[];
  candleTrees: CandleTreeGroup[];
  indicatorSnapshots: IndicatorSnapshotRecord[];
  currentCandle: ReplayCandle | undefined;
  currentCandleIndex: number | null;
  /** The scrubbed bar's own real timestamp -- trades gate against this
   * (trades carry entry_time/exit_time, not a candle_index). Undefined
   * while nothing has closed yet. */
  currentCandleTimestamp: number | undefined;
  onSeekToCandle: (candleIndex: number) => void;
  onPreviewCandle: (candleIndex: number | null) => void;
}

export function LiveConsole({
  session,
  wsStatus,
  runtimeEvents,
  trades,
  candleTrees,
  indicatorSnapshots,
  currentCandle,
  currentCandleIndex,
  currentCandleTimestamp,
  onSeekToCandle,
  onPreviewCandle,
}: LiveConsoleProps) {
  const tree = useMemo(
    () => candleTrees.find((t) => t.candle_index === currentCandleIndex),
    [candleTrees, currentCandleIndex]
  );

  // Gated to <= the scrubbed bar, exactly like backtest's own cursor-gated
  // selector -- a stopped session's console doubles as its replay, so
  // nothing that happened after the scrubbed bar may be visible here. While
  // actively live (cursor == the latest bar, the common case), this gate is
  // a no-op and shows everything, same as before.
  const portfolioHistory: PortfolioHistoryPoint[] = useMemo(() => {
    const cursor = currentCandleIndex ?? Infinity;
    return runtimeEvents
      .filter((e) => e.type === "PORTFOLIO_SNAPSHOT" && e.candle_index <= cursor)
      .map((e) => {
        const p = e.payload as Record<string, unknown>;
        return {
          candleIndex: e.candle_index,
          cash: typeof p.cash === "number" ? p.cash : 0,
          equity: typeof p.equity === "number" ? p.equity : 0,
          gross_exposure: typeof p.gross_exposure === "number" ? p.gross_exposure : 0,
          drawdown: typeof p.drawdown === "number" ? p.drawdown : 0,
        };
      })
      .sort((a, b) => a.candleIndex - b.candleIndex);
  }, [runtimeEvents, currentCandleIndex]);

  const [collapsed, setCollapsed] = useState(false);
  const [height, setHeight] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_HEIGHT;
    const stored = localStorage.getItem(HEIGHT_KEY);
    return stored ? Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, parseInt(stored, 10))) : DEFAULT_HEIGHT;
  });
  const [activeTab, setActiveTab] = useState<ConsoleTab>("timeline");
  const [openedTabs, setOpenedTabs] = useState<Set<ConsoleTab>>(new Set(["timeline"]));
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const next = globalThis.innerHeight - e.clientY;
      setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, next)));
    };
    const onUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        localStorage.setItem(HEIGHT_KEY, String(height));
        document.body.style.cursor = "";
      }
    };
    globalThis.addEventListener("mousemove", onMove);
    globalThis.addEventListener("mouseup", onUp);
    return () => {
      globalThis.removeEventListener("mousemove", onMove);
      globalThis.removeEventListener("mouseup", onUp);
    };
  }, [height]);

  const selectTab = (tab: ConsoleTab) => {
    setActiveTab(tab);
    setOpenedTabs((prev) => new Set(prev).add(tab));
    if (collapsed) setCollapsed(false);
  };

  return (
    <div
      className="shrink-0 border-t border-border/60 bg-card flex flex-col"
      style={{ height: collapsed ? 36 : height }}
    >
      {!collapsed && (
        <div
          onMouseDown={() => {
            isDraggingRef.current = true;
            document.body.style.cursor = "row-resize";
          }}
          className="h-1.5 shrink-0 cursor-row-resize flex items-center justify-center hover:bg-primary/10 transition-colors group"
        >
          <IconGripHorizontal className="size-3 text-muted-foreground/30 group-hover:text-primary/60" />
        </div>
      )}

      <div className="flex items-center gap-1 px-3 h-9 shrink-0 border-b border-border/40 overflow-x-auto no-scrollbar">
        <IconTerminal2 className="size-3.5 text-primary shrink-0 mr-1" />
        <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider mr-2 shrink-0">
          Execution Console
        </span>
        {TABS.map((t) => (
          <TabButton key={t.key} label={t.label} active={activeTab === t.key && !collapsed} onClick={() => selectTab(t.key)} />
        ))}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="ml-auto size-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 shrink-0 cursor-pointer"
          title={collapsed ? "Expand console" : "Collapse console"}
        >
          {collapsed ? <IconChevronUp className="size-3.5" /> : <IconChevronDown className="size-3.5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className={cn("h-full", activeTab !== "timeline" && "hidden")}>
            <TimelineTab
              tree={tree}
              currentCandleIndex={currentCandleIndex}
              onSeekToCandle={onSeekToCandle}
              onPreviewCandle={onPreviewCandle}
            />
          </div>
          {activeTab === "trades" && openedTabs.has("trades") && (
            <TradesTab
              trades={trades}
              portfolioHistory={portfolioHistory}
              currentCandleTimestamp={currentCandleTimestamp}
              onSeekToCandle={onSeekToCandle}
            />
          )}
          {activeTab === "orders" && openedTabs.has("orders") && (
            <OrdersTab events={runtimeEvents} currentCandleIndex={currentCandleIndex} onSeekToCandle={onSeekToCandle} />
          )}
          {activeTab === "portfolio" && (
            <PortfolioTab portfolioHistory={portfolioHistory} tree={tree} />
          )}
          {activeTab === "metrics" && openedTabs.has("metrics") && (
            <MetricsTab trades={trades} currentCandleTimestamp={currentCandleTimestamp} />
          )}
          {activeTab === "logs" && openedTabs.has("logs") && (
            <SystemLogsTab session={session} wsStatus={wsStatus} events={runtimeEvents} />
          )}
          {activeTab === "debug" && (
            <DebugTab
              session={session}
              tree={tree}
              currentCandle={currentCandle}
              currentCandleIndex={currentCandleIndex}
              indicatorSnapshots={indicatorSnapshots}
              trades={trades}
            />
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-[10.5px] font-semibold px-2.5 h-6 rounded-md shrink-0 cursor-pointer transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      )}
    >
      {label}
    </button>
  );
}

function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-1 text-center px-6">
      <p className="text-[11px] text-foreground/80 font-medium">{title}</p>
      {detail && <p className="text-[10px] text-muted-foreground max-w-sm">{detail}</p>}
    </div>
  );
}

function ScrollTable({ children }: { children: React.ReactNode }) {
  return <div className="h-full overflow-auto text-[10.5px] font-mono">{children}</div>;
}

// ─── Timeline ──────────────────────────────────────────────────────────────

function TimelineTab({
  tree,
  currentCandleIndex,
  onSeekToCandle,
  onPreviewCandle,
}: {
  tree: CandleTreeGroup | undefined;
  currentCandleIndex: number | null;
  onSeekToCandle: (i: number) => void;
  onPreviewCandle: (i: number | null) => void;
}) {
  const events = useMemo(() => (tree ? flattenCandleTree(tree) : []), [tree]);
  const hasSelectedBar = currentCandleIndex != null;

  return (
    <ScrollTable>
      <div className="min-w-[720px] p-3 sm:p-4" onMouseLeave={() => onPreviewCandle(null)}>
        <div className="mb-2.5 flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.7)]" />
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Live event trace</span>
            {hasSelectedBar && (
              <span className="rounded border border-border/60 bg-muted/45 px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-muted-foreground">
                Bar {currentCandleIndex}
              </span>
            )}
          </div>
          <span className="rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[9px] font-semibold tabular-nums text-muted-foreground">
            {events.length} {events.length === 1 ? "event" : "events"}
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          <table className="w-full table-fixed border-separate border-spacing-0">
            <colgroup>
              <col className="w-[100px]" />
              <col className="w-[200px]" />
              <col className="w-[190px]" />
              <col />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <tr className="text-left text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                <Th>Time</Th>
                <Th>Event</Th>
                <Th>Source node</Th>
                <Th>Details</Th>
              </tr>
            </thead>
            <tbody>
              {!hasSelectedBar ? (
                <EmptyTimelineRow title="Waiting for the first live bar to close." />
              ) : events.length === 0 ? (
                <EmptyTimelineRow
                  title={`No engine events at bar ${currentCandleIndex}.`}
                  detail="Market data updated, but no engine rule emitted an event."
                />
              ) : (
                events.map((ev, i) => {
                  const category = categoryForEventType(ev.type);
                  const { label, node, details } = presentEvent(ev);
                  return (
                    <tr
                      key={`${ev.candle_index}-${ev.sequence_number}`}
                      onClick={() => onSeekToCandle(ev.candle_index)}
                      onMouseEnter={() => onPreviewCandle(ev.candle_index)}
                      className={cn(
                        "group cursor-pointer border-b border-border/50 last:border-b-0 hover:bg-primary/8",
                        i % 2 === 1 && "bg-muted/4.5"
                      )}
                      style={{ boxShadow: `inset 3px 0 0 0 ${REPLAY_COLORS[category]}` }}
                    >
                      <td className="px-3 py-2.5 font-mono text-[10px] tabular-nums text-muted-foreground whitespace-nowrap">
                        {new Date(ev.timestamp).toLocaleTimeString(undefined, { hour12: false })}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-flex max-w-full items-center gap-2 font-semibold text-[10.5px] text-foreground">
                          <span
                            className="size-1.5 shrink-0 rounded-full shadow-[0_0_6px_currentColor]"
                            style={{ color: REPLAY_COLORS[category], backgroundColor: REPLAY_COLORS[category] }}
                          />
                          <span className="truncate">{label}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 truncate">
                        <span className="inline-flex max-w-full items-center rounded-md border border-border/60 bg-muted/55 px-1.5 py-0.5 font-mono text-[9.5px] text-muted-foreground group-hover:border-primary/35 group-hover:bg-primary/8">
                          <span className="truncate">{node}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[10.5px] leading-4 text-foreground/80">
                        <span className="line-clamp-2">{details}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ScrollTable>
  );
}

function EmptyTimelineRow({ title, detail }: { title: string; detail?: string }) {
  return (
    <tr>
      <td colSpan={4} className="px-4 py-8 text-center">
        <p className="text-[10.5px] font-medium text-foreground/75">{title}</p>
        {detail && <p className="mt-1 text-[9.5px] text-muted-foreground">{detail}</p>}
      </td>
    </tr>
  );
}

// ─── Trades: no spoilers -- everything here has already actually happened. ──

function TradesTab({
  trades,
  portfolioHistory,
  currentCandleTimestamp,
  onSeekToCandle,
}: {
  trades: SessionTrade[];
  portfolioHistory: PortfolioHistoryPoint[];
  currentCandleTimestamp: number | undefined;
  onSeekToCandle: (i: number) => void;
}) {
  if (trades.length === 0) {
    return <EmptyState title="No trades yet." detail="Nothing has opened a position in this session." />;
  }

  // Gated to <= the scrubbed bar's own timestamp -- while live (cursor is
  // the latest bar) this includes everything, same as before; scrubbing a
  // stopped session back in time hides trades that hadn't happened yet at
  // that point, exactly like backtest replay's own no-spoiler guarantee.
  const cursor = currentCandleTimestamp ?? Infinity;
  const reached = trades.filter((t) => t.entry_time <= cursor);
  if (reached.length === 0) {
    return <EmptyState title="No trades yet." detail="Nothing has opened a position at or before this bar." />;
  }
  const open = reached.filter((t) => t.exit_time == null || t.exit_time > cursor);
  const closed = reached.filter((t) => t.exit_time != null && t.exit_time <= cursor).slice().reverse();

  const latestPortfolio = portfolioHistory[portfolioHistory.length - 1];
  const unrealizedPnl = latestPortfolio ? latestPortfolio.equity - latestPortfolio.cash : null;

  return (
    <div className="h-full overflow-auto p-3 flex flex-col gap-4">
      {open.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-bold tracking-wider text-muted-foreground/70 uppercase">Open Position</span>
          {open.map((trade) => (
            <motion.div
              key={trade.entry_sequence}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 flex items-center gap-3 cursor-pointer"
              onClick={() => onSeekToCandle(trade.entry_candle_index)}
            >
              <motion.span
                className="size-2 rounded-full bg-primary shrink-0"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              <span className="text-[11px] font-bold">Trade #{trade.entry_sequence}</span>
              <SideBadge side={trade.side} />
              <span className="text-[10px] text-muted-foreground ml-auto">Entry {fmtTime(trade.entry_time)}</span>
              {unrealizedPnl != null && (
                <span className={cn("text-[11px] font-bold tabular-nums", unrealizedPnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  {unrealizedPnl >= 0 ? "+" : ""}
                  {unrealizedPnl.toFixed(2)}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-bold tracking-wider text-muted-foreground/70 uppercase">Closed Trades</span>
        {closed.length === 0 ? (
          <p className="text-[10.5px] text-muted-foreground">No trade has closed yet.</p>
        ) : (
          <ScrollTable>
            <table className="w-full">
              <thead className="sticky top-0 bg-card border-b border-border/40">
                <tr className="text-left text-muted-foreground">
                  <Th>Entry</Th>
                  <Th>Exit</Th>
                  <Th>Side</Th>
                  <Th>PnL</Th>
                  <Th>PnL %</Th>
                  <Th>Duration</Th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {closed.map((trade) => {
                    const pnl = trade.realized_pnl;
                    const notional = trade.entry_price * trade.quantity;
                    const pnlPct = pnl != null && notional ? (pnl / notional) * 100 : null;
                    return (
                      <motion.tr
                        key={trade.entry_sequence}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => onSeekToCandle(trade.entry_candle_index)}
                        className="border-b border-border/20 hover:bg-muted/30 cursor-pointer"
                      >
                        <Td>{fmtTime(trade.entry_time)}</Td>
                        <Td>{fmtTime(trade.exit_time)}</Td>
                        <Td className="uppercase font-bold">{trade.side}</Td>
                        <Td className={cn("font-bold", pnl != null && (pnl >= 0 ? "text-emerald-500" : "text-rose-500"))}>
                          {pnl != null ? pnl.toFixed(2) : "—"}
                        </Td>
                        <Td>{pnlPct != null ? `${pnlPct.toFixed(2)}%` : "—"}</Td>
                        <Td className="text-muted-foreground">{fmtDuration(trade.entry_time, trade.exit_time)}</Td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </ScrollTable>
        )}
      </div>
    </div>
  );
}

function SideBadge({ side }: { side: string }) {
  const isShort = side.toUpperCase().includes("SHORT") || side.toUpperCase() === "SELL";
  return (
    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", isShort ? "bg-rose-500/15 text-rose-500" : "bg-emerald-500/15 text-emerald-500")}>
      {isShort ? "SHORT" : "LONG"}
    </span>
  );
}

// ─── Orders: no spoilers -- every order here has already been submitted. ───

const ORDER_STAGE_LABEL: Record<string, string> = {
  ORDER_CREATED: "Created",
  ORDER_SUBMITTED: "Submitted",
  ORDER_FILLED: "Filled",
  ORDER_REJECTED: "Rejected",
  ORDER_CANCELLED: "Cancelled",
};

function OrdersTab({
  events,
  currentCandleIndex,
  onSeekToCandle,
}: {
  events: GenericEngineEvent[];
  currentCandleIndex: number | null;
  onSeekToCandle: (i: number) => void;
}) {
  // Gated to <= the scrubbed bar -- see TradesTab's own comment on why this
  // matters once a session has stopped and is being replayed.
  const cursor = currentCandleIndex ?? Infinity;
  const orderEvents = useMemo(
    () => events.filter((ev) => ev.type.startsWith("ORDER_") && ev.candle_index <= cursor),
    [events, cursor]
  );

  if (orderEvents.length === 0) {
    return <EmptyState title="No order yet." detail="Nothing has been submitted at or before this bar." />;
  }

  const grouped = new Map<string, GenericEngineEvent[]>();
  for (const ev of orderEvents) {
    const orderId = String((ev.payload as Record<string, unknown> | undefined)?.order_id ?? ev.sequence_number);
    const list = grouped.get(orderId) ?? [];
    list.push(ev);
    grouped.set(orderId, list);
  }
  const orders = Array.from(grouped.values())
    .map((list) => list.sort((a, b) => a.sequence_number - b.sequence_number))
    .sort((a, b) => b[0].sequence_number - a[0].sequence_number);

  return (
    <div className="h-full overflow-auto p-3 flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {orders.map((orderEventGroup) => (
          <OrderCard key={orderEventGroup[0].sequence_number} events={orderEventGroup} onSeek={onSeekToCandle} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function OrderCard({ events, onSeek }: { events: GenericEngineEvent[]; onSeek: (i: number) => void }) {
  const created = events.find((e) => e.type === "ORDER_CREATED");
  const filled = events.find((e) => e.type === "ORDER_FILLED");
  const latest = events[events.length - 1];
  const basePayload = (created?.payload ?? latest.payload) as Record<string, unknown>;
  const side = String(basePayload.side ?? "").toUpperCase();
  const orderType = String(basePayload.order_type ?? "MARKET");
  const terminalType = latest.type;
  const isFilled = terminalType === "ORDER_FILLED";
  const isTerminalStop = terminalType === "ORDER_REJECTED" || terminalType === "ORDER_CANCELLED";

  const filledPayload = filled?.payload as Record<string, unknown> | undefined;
  const price = isFilled ? num(filledPayload?.fill_price) : num(basePayload.price);
  const qty = isFilled ? num(filledPayload?.fill_quantity) : num(basePayload.size ?? basePayload.quantity);
  const candleIdx = created?.candle_index ?? latest.candle_index;

  const stageTypes = ["ORDER_CREATED", "ORDER_SUBMITTED", isTerminalStop ? terminalType : "ORDER_FILLED"];
  const reachedTypes = new Set(events.map((e) => String(e.type)));

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={() => candleIdx != null && onSeek(candleIdx)}
      className="rounded-xl border border-border/50 bg-muted/10 px-3 py-2.5 flex items-center gap-3 cursor-pointer flex-wrap"
    >
      <SideBadge side={side} />
      <span className="text-[10px] font-mono text-muted-foreground">{orderType}</span>
      <span className="text-[9.5px] font-mono text-muted-foreground/70">{fmtTime(created?.timestamp ?? latest.timestamp)}</span>
      <div className="flex items-center gap-1 text-[9px] font-semibold">
        {stageTypes.map((stage, i) => {
          const reached = reachedTypes.has(stage);
          const color = stage === "ORDER_FILLED" ? "emerald" : stage === "ORDER_REJECTED" || stage === "ORDER_CANCELLED" ? "rose" : "primary";
          return (
            <div key={stage} className="flex items-center gap-1">
              {i > 0 && <IconArrowRight className="size-2.5 text-muted-foreground/30" />}
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded",
                  reached
                    ? color === "emerald"
                      ? "bg-emerald-500/15 text-emerald-500"
                      : color === "rose"
                        ? "bg-rose-500/15 text-rose-500"
                        : "bg-primary/15 text-primary"
                    : "bg-muted/40 text-muted-foreground/50"
                )}
              >
                {ORDER_STAGE_LABEL[stage] ?? stage}
              </span>
            </div>
          );
        })}
      </div>
      <span className="ml-auto text-[10px] font-mono text-muted-foreground">
        {price != null && (
          <>
            Price <span className="text-foreground font-semibold">{price.toFixed(2)}</span>
          </>
        )}
        {qty != null && (
          <>
            {" "}
            · Qty <span className="text-foreground font-semibold">{qty}</span>
          </>
        )}
      </span>
    </motion.div>
  );
}

// ─── Portfolio: current state + how it got here, live-growing curve. ───────

function PortfolioTab({
  portfolioHistory,
  tree,
}: {
  portfolioHistory: PortfolioHistoryPoint[];
  tree: CandleTreeGroup | undefined;
}) {
  const latest = portfolioHistory[portfolioHistory.length - 1];
  const flatEvents = tree ? flattenCandleTree(tree) : [];
  const position: CurrentPosition = computeCurrentPosition(flatEvents);

  const equitySeries: [number, number][] = portfolioHistory.map((p) => [p.candleIndex, p.equity]);
  const drawdownSeries = equitySeries.length > 0 ? computeDrawdownSeries(equitySeries) : [];
  const equityValues = equitySeries.map(([, v]) => v);
  const equityMin = equityValues.length > 0 ? Math.min(...equityValues) : undefined;
  const equityMax = equityValues.length > 0 ? Math.max(...equityValues) : undefined;

  if (!latest) return <EmptyState title="No portfolio snapshot yet." detail="Waiting for the first finalized live bar." />;

  const exposurePct = latest.equity > 0 ? (latest.gross_exposure / latest.equity) * 100 : null;
  const unrealizedPnl = latest.equity - latest.cash;

  return (
    <div className="h-full overflow-auto p-4 flex flex-col gap-3">
      <div className="rounded-xl border border-border/50 bg-muted/10 p-4 flex flex-col gap-1">
        <span className="text-[9px] font-bold tracking-wider text-muted-foreground/70 uppercase">Total Equity</span>
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-black tabular-nums text-foreground">
            <AnimatedNumber value={latest.equity} format={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })} />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Balance">
          <span className="text-[15px] font-mono font-semibold text-foreground tabular-nums">
            {latest.cash.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </StatCard>
        <StatCard label="Unrealized PnL">
          <span className={cn("text-[15px] font-mono font-semibold tabular-nums", unrealizedPnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
            {unrealizedPnl >= 0 ? "+" : ""}
            {unrealizedPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </StatCard>
        <StatCard label="Exposure">
          <span className="text-[15px] font-mono font-semibold text-foreground tabular-nums">
            {exposurePct != null ? `${exposurePct.toLocaleString(undefined, { maximumFractionDigits: 2 })}%` : "—"}
          </span>
        </StatCard>
      </div>

      {position.side !== "FLAT" && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 flex items-center gap-3 flex-wrap">
          <span className="text-[9px] font-bold tracking-wider text-muted-foreground/70 uppercase">Open Position</span>
          <SideBadge side={position.side} />
          {position.quantity != null && <span className="text-[10px] font-mono text-muted-foreground">Qty {position.quantity}</span>}
          <span className={cn("ml-auto text-[11px] font-bold tabular-nums", unrealizedPnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
            {unrealizedPnl >= 0 ? "+" : ""}
            {unrealizedPnl.toFixed(2)}
          </span>
        </div>
      )}

      {equitySeries.length > 1 ? (
        <div className="grid grid-cols-2 gap-3 h-32 shrink-0">
          <div className="rounded-xl border border-border/50 bg-muted/10 p-3 flex flex-col gap-1 h-full min-h-0">
            <span className="text-[9px] font-bold tracking-wider text-muted-foreground/70 uppercase shrink-0">
              Equity Curve — {portfolioHistory.length} bars observed
            </span>
            <div className="flex-1 min-h-0">
              <MiniSpark points={equitySeries} color="#818cf8" yMin={equityMin} yMax={equityMax} valueLabel="Equity" />
            </div>
          </div>
          <div className="rounded-xl border border-border/50 bg-muted/10 p-3 flex flex-col gap-1 h-full min-h-0">
            <span className="text-[9px] font-bold tracking-wider text-muted-foreground/70 uppercase shrink-0">Drawdown</span>
            <div className="flex-1 min-h-0">
              <MiniSpark
                points={drawdownSeries}
                color="#ef4444"
                fillBottom
                valueLabel="Drawdown"
                formatValue={(v) => `${(v * 100).toFixed(2)}%`}
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[10.5px] text-muted-foreground">
          The equity curve grows as new bars close — this is the session&apos;s actual live history, not a preview.
        </p>
      )}
    </div>
  );
}

function MiniSpark({
  points,
  color,
  fillBottom,
  yMin,
  yMax,
  valueLabel,
  formatValue,
}: {
  points: [number, number][];
  color: string;
  fillBottom?: boolean;
  yMin?: number;
  yMax?: number;
  valueLabel: string;
  formatValue?: (v: number) => string;
}) {
  const values = points.map(([, v]) => v);
  const indices = points.map(([i]) => i);
  const yDomain: [number, number] = [yMin ?? (fillBottom ? 0 : Math.min(...values)), yMax ?? Math.max(...values)];
  const xDomain: [number, number] = [Math.min(...indices), Math.max(...indices)];
  const format = formatValue ?? ((v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 }));
  const data = points.map(([candleIndex, value]) => ({ candleIndex, value }));
  const gradientId = `live-mini-spark-${valueLabel.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="candleIndex" type="number" domain={xDomain} hide />
        <YAxis domain={yDomain} hide />
        <Tooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as { candleIndex: number; value: number };
            return (
              <div className="rounded-md bg-popover border border-border/60 px-2 py-1 text-[9px] font-mono shadow-md">
                <div className="text-muted-foreground">Bar {p.candleIndex}</div>
                <div className="font-semibold text-foreground">
                  {valueLabel}: {format(p.value)}
                </div>
              </div>
            );
          }}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#${gradientId})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/10 p-3 flex flex-col gap-1">
      <span className="text-[9px] font-bold tracking-wider text-muted-foreground/70 uppercase">{label}</span>
      {children}
    </div>
  );
}

// ─── Metrics: session-to-date only -- a live session has no fixed endpoint,
//     so there is no "Final" Returns/Risk card the way backtest has one. ────

function MetricsTab({
  trades,
  currentCandleTimestamp,
}: {
  trades: SessionTrade[];
  currentCandleTimestamp: number | undefined;
}) {
  // Same cursor gate as TradesTab -- these stats must reflect "as of the
  // scrubbed bar", not the whole session, once it's being replayed.
  const cursor = currentCandleTimestamp ?? Infinity;
  const reached = trades.filter((t) => t.entry_time <= cursor);
  const closed = reached.filter((t) => t.exit_time != null && t.exit_time <= cursor);
  const open = reached.filter((t) => t.exit_time == null || t.exit_time > cursor);
  const pnlOf = (t: SessionTrade) => t.realized_pnl ?? 0;
  const wins = closed.filter((t) => pnlOf(t) > 0);
  const losses = closed.filter((t) => pnlOf(t) < 0);
  const grossProfit = wins.reduce((sum, t) => sum + pnlOf(t), 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + pnlOf(t), 0));
  const netProfit = closed.reduce((sum, t) => sum + pnlOf(t), 0);
  const winRate = closed.length > 0 ? wins.length / closed.length : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : null;

  return (
    <div className="h-full overflow-auto p-3 grid grid-cols-3 gap-3">
      <MetricCard
        title="Trade Quality — live"
        headline={<AnimatedNumber value={winRate * 100} format={(v) => `${v.toFixed(0)}%`} />}
        headlineLabel={closed.length > 0 ? computeMetricLabel("win_rate", winRate) : "No trades closed yet"}
      >
        <CardRow label="Closed Trades" value={<AnimatedNumber value={closed.length} format={(v) => String(Math.round(v))} />} />
        <CardRow label="Open Trades" value={String(open.length)} />
        <CardRow
          label="Profit Factor"
          value={profitFactor == null ? "—" : profitFactor === Infinity ? "∞" : profitFactor.toFixed(2)}
          badge={profitFactor != null && Number.isFinite(profitFactor) ? computeMetricLabel("profit_factor", profitFactor) : undefined}
        />
        <CardRow label="Net Profit" value={<AnimatedNumber value={netProfit} format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}`} />} />
      </MetricCard>
      <MetricCard title="Wins vs Losses" headline={String(wins.length + losses.length)} headlineLabel="closed trades">
        <CardRow label="Wins" value={<span className="text-emerald-500">{wins.length}</span>} />
        <CardRow label="Losses" value={<span className="text-rose-500">{losses.length}</span>} />
        <CardRow label="Gross Profit" value={grossProfit.toFixed(2)} />
        <CardRow label="Gross Loss" value={grossLoss.toFixed(2)} />
      </MetricCard>
    </div>
  );
}

function MetricCard({ title, headline, headlineLabel, children }: { title: string; headline: React.ReactNode; headlineLabel?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/10 p-3 flex flex-col gap-2">
      <span className="text-[9px] font-bold tracking-wider text-muted-foreground/70 uppercase">{title}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[20px] font-black tabular-nums text-foreground">{headline}</span>
        {headlineLabel && <span className="text-[9.5px] font-semibold text-muted-foreground">{headlineLabel}</span>}
      </div>
      <div className="flex flex-col gap-1 pt-1 border-t border-border/40">{children}</div>
    </div>
  );
}

function CardRow({ label, value, badge }: { label: string; value: React.ReactNode; badge?: string }) {
  return (
    <div className="flex items-center justify-between text-[10px] font-mono">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="text-foreground font-semibold">{value}</span>
        {badge && <span className="text-[9px] text-muted-foreground/70">{badge}</span>}
      </span>
    </div>
  );
}

function AnimatedNumber({ value, format }: { value: number; format: (v: number) => string }) {
  const motionValue = useMotionValue(value);
  const formatted = useTransform(motionValue, format);
  const [text, setText] = useState(() => format(value));

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.6, ease: "easeOut" });
    const unsubscribe = formatted.on("change", setText);
    return () => {
      controls.stop();
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{text}</>;
}

// ─── System Logs: real, already-observed signals only -- WS connection
//     transitions this hook itself witnesses, plus every EngineEvent already
//     flowing through the session. Nothing here is fabricated; a "Warmup
//     Complete" or "Connected to Delta" line only appears once there is an
//     actual observed event or status change to report it from. ───────────

interface ConnectionLogLine {
  id: string;
  atMs: number;
  tone: "neutral" | "success" | "warning" | "danger";
  message: string;
}

const WS_STATUS_LOG_LABEL: Partial<Record<LiveStreamStatus, { tone: ConnectionLogLine["tone"]; message: string }>> = {
  connecting: { tone: "neutral", message: "Connecting to live session stream…" },
  open: { tone: "success", message: "Connected — receiving live updates." },
  closed: { tone: "warning", message: "Connection lost — attempting to reconnect." },
  error: { tone: "danger", message: "Connection error." },
  auth_expired: { tone: "danger", message: "Session expired — please re-open this tab." },
  not_found: { tone: "danger", message: "Session no longer exists." },
};

function useConnectionLog(wsStatus: LiveStreamStatus): ConnectionLogLine[] {
  const [log, setLog] = useState<ConnectionLogLine[]>([]);
  // Adjusting state from a prop change during render (the officially
  // sanctioned alternative to a setState-in-effect for "append a record of
  // what changed") -- state, not a ref, since refs can't be read during
  // render; the same pattern live-viewer.tsx already uses for resetting
  // events when sessionId changes.
  const [lastStatus, setLastStatus] = useState<LiveStreamStatus | null>(null);

  if (lastStatus !== wsStatus) {
    setLastStatus(wsStatus);
    const entry = WS_STATUS_LOG_LABEL[wsStatus];
    if (entry) {
      setLog((prev) => [
        ...prev,
        { id: `${wsStatus}-${Date.now()}`, atMs: Date.now(), tone: entry.tone, message: entry.message },
      ]);
    }
  }

  return log;
}

function SystemLogsTab({
  session,
  wsStatus,
  events,
}: {
  session: LiveTradingSession;
  wsStatus: LiveStreamStatus;
  events: GenericEngineEvent[];
}) {
  const connectionLog = useConnectionLog(wsStatus);

  const eventLog = useMemo(() => {
    const LOGGABLE = new Set([
      "ORDER_SUBMITTED",
      "ORDER_FILLED",
      "ORDER_REJECTED",
      "ORDER_CANCELLED",
      "POSITION_OPENED",
      "POSITION_CLOSED",
      "RISK_VIOLATION",
      "MARGIN_CALL",
      "LIQUIDATION",
    ]);
    return events
      .filter((e) => LOGGABLE.has(e.type))
      .map((e): ConnectionLogLine => {
        const { label, details } = presentEvent({ ...e, children: [] });
        const tone: ConnectionLogLine["tone"] =
          e.type === "ORDER_REJECTED" || e.type === "LIQUIDATION"
            ? "danger"
            : e.type === "RISK_VIOLATION" || e.type === "MARGIN_CALL"
              ? "warning"
              : e.type === "ORDER_FILLED" || e.type === "POSITION_OPENED"
                ? "success"
                : "neutral";
        return { id: `${e.sequence_number}`, atMs: e.timestamp, tone, message: `${label} — ${details}` };
      });
  }, [events]);

  const combined = [...connectionLog, ...eventLog].sort((a, b) => b.atMs - a.atMs);

  if (combined.length === 0) {
    return (
      <EmptyState
        title="No system events yet."
        detail={`Session ${session.status.toLowerCase()} — connection and execution events will appear here as they happen.`}
      />
    );
  }

  return (
    <ScrollTable>
      <div className="p-2 flex flex-col gap-0.5">
        {combined.map((line) => (
          <div key={line.id} className="flex items-start gap-2 py-0.5">
            <span className="text-[9px] font-mono text-muted-foreground/60 shrink-0 w-16">
              {new Date(line.atMs).toLocaleTimeString(undefined, { hour12: false })}
            </span>
            <span
              className={cn(
                "text-[9px] font-bold shrink-0 w-14",
                line.tone === "warning" ? "text-amber-500" : line.tone === "danger" ? "text-rose-500" : line.tone === "success" ? "text-emerald-500" : "text-muted-foreground"
              )}
            >
              {line.tone.toUpperCase()}
            </span>
            <span className="text-muted-foreground/90">{line.message}</span>
          </div>
        ))}
      </div>
    </ScrollTable>
  );
}

// ─── Debug: a live strategy debugger -- current position, current candle,
//     indicator values, condition truth values, risk status, all reading
//     the exact same data driving the chart and execution, nothing recomputed
//     or guessed. ─────────────────────────────────────────────────────────

function DebugTab({
  session,
  tree,
  currentCandle,
  currentCandleIndex,
  indicatorSnapshots,
  trades,
}: {
  session: LiveTradingSession;
  tree: CandleTreeGroup | undefined;
  currentCandle: ReplayCandle | undefined;
  currentCandleIndex: number | null;
  indicatorSnapshots: IndicatorSnapshotRecord[];
  trades: SessionTrade[];
}) {
  const flatEvents = tree ? flattenCandleTree(tree) : [];
  const position = computeCurrentPosition(flatEvents);
  const snapshot = useMemo(
    () => indicatorSnapshots.find((s) => s.bar_index === currentCandleIndex),
    [indicatorSnapshots, currentCandleIndex]
  );
  const conditions = flatEvents.filter((e) => e.type === "CONDITION_EVALUATED");
  const riskViolation = flatEvents.find((e) => e.type === "RISK_VIOLATION");
  const openTrade = trades.find((t) => t.is_open);

  const nextCloseAt = useMemo(() => {
    if (!currentCandle?.timestamp) return null;
    const ms = timeframeToMilliseconds(session.timeframe);
    return ms ? currentCandle.timestamp + ms : null;
  }, [currentCandle, session.timeframe]);

  return (
    <ScrollTable>
      <div className="p-3 flex flex-col gap-3">
        <DebugSection title="Current state">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <DebugRow label="Position" value={openTrade ? <SideBadge side={position.side} /> : "FLAT"} />
            <DebugRow label="Quantity" value={position.quantity != null ? String(position.quantity) : "—"} />
            <DebugRow label="Risk Engine" value={riskViolation ? <span className="text-rose-500 font-semibold">Blocked</span> : <span className="text-emerald-500 font-semibold">Approved</span>} />
            <DebugRow
              label={`Waiting for next ${session.timeframe} close`}
              value={nextCloseAt != null ? new Date(nextCloseAt).toLocaleTimeString(undefined, { hour12: false }) : "—"}
            />
          </div>
        </DebugSection>

        <DebugSection title="Current candle">
          {currentCandle ? (
            <div className="grid grid-cols-4 gap-x-4 gap-y-1">
              <DebugRow label="Open" value={fmtNum(currentCandle.open)} />
              <DebugRow label="High" value={fmtNum(currentCandle.high)} />
              <DebugRow label="Low" value={fmtNum(currentCandle.low)} />
              <DebugRow label="Close" value={fmtNum(currentCandle.close)} />
            </div>
          ) : (
            <p className="text-[10.5px] text-muted-foreground">No candle at this bar.</p>
          )}
        </DebugSection>

        <DebugSection title="Indicators at this bar">
          {snapshot && Object.keys(snapshot.values ?? {}).length > 0 ? (
            <div className="flex flex-col gap-1">
              {Object.entries(snapshot.values).map(([key, entry]) => (
                <DebugRow key={key} label={`${entry.type}${entry.period != null ? ` ${entry.period}` : ""}`} value={entry.value.toFixed(4)} />
              ))}
            </div>
          ) : (
            <p className="text-[10.5px] text-muted-foreground">No indicator snapshot at this bar.</p>
          )}
        </DebugSection>

        <DebugSection title="Conditions evaluated this bar">
          {conditions.length > 0 ? (
            <div className="flex flex-col gap-1">
              {conditions.map((c) => {
                const p = c.payload as Record<string, unknown>;
                const truth = Boolean(p.result ?? p.value);
                return (
                  <div key={c.sequence_number} className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground truncate">{String(p.expression ?? p.node_id ?? "condition")}</span>
                    <span className={cn("font-bold", truth ? "text-emerald-500" : "text-rose-500")}>{truth ? "✔ True" : "✖ False"}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10.5px] text-muted-foreground">No condition evaluated at this bar.</p>
          )}
        </DebugSection>
      </div>
    </ScrollTable>
  );
}

function DebugSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border/50 bg-muted/10 p-3">
      <span className="text-[9px] font-bold tracking-wider text-muted-foreground/70 uppercase">{title}</span>
      {children}
    </div>
  );
}

function DebugRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-semibold">{value}</span>
    </div>
  );
}

// ─── Shared helpers ──────────────────────────────────────────────────────

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-2.5 py-2 font-bold text-[9px] tracking-wider uppercase text-muted-foreground/70 sticky top-0 bg-card">
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-2.5 py-1.5", className)}>{children}</td>;
}
function num(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}
function fmtNum(v: number | undefined): string {
  return v == null ? "—" : v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function fmtTime(v: number | null): string {
  if (v == null) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
function fmtDuration(entry: number | null, exit: number | null): string {
  if (entry == null || exit == null) return "—";
  const ms = exit - entry;
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
function timeframeToMilliseconds(timeframe: string): number | null {
  const match = /^(\d+)(m|h|d)$/i.exec(timeframe.trim());
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitMilliseconds = unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
  return Number.isFinite(amount) && amount > 0 ? amount * unitMilliseconds : null;
}
