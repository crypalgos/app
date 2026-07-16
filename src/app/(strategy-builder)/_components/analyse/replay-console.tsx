"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, animate, useMotionValue, useTransform } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  IconChevronDown,
  IconChevronUp,
  IconTerminal2,
  IconGripHorizontal,
  IconSearch,
  IconArrowRight,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useReplayDataset } from "@/api-actions/hooks/replay-hooks";
import { useStrategy } from "@/api-actions/hooks/strategy-hooks";
import { REPLAY_COLORS, categoryForEventType } from "@/lib/replay-colors";
import {
  computeCurrentPosition,
  computeDrawdownSeries,
  computeMetricLabel,
  flattenCandleTree,
  presentEvent,
  type PortfolioHistoryPoint,
} from "@/lib/replay-analysis";
import type { ResearchRun, BacktestSummary } from "@/types/strategy-actions";
import type { ReplayWindow, CandleTreeGroup, ReplayEventNode } from "@/types/replay";

// The bottom console — the "Evidence" layer: every claim the Market/Decision/
// Execution/Portfolio panels make is traceable back to a row here.

const HEIGHT_KEY = "replay-console-height";
const DEFAULT_HEIGHT = 260;
const MIN_HEIGHT = 140;
const MAX_HEIGHT = 640;

// Row-count cap on every console dataset fetch — the replay dataset endpoint
// is windowed like everything else in replay; datasets without a candle_index
// column (trades/orders/execution_logs) are paginated by row offset instead,
// so this is "first 500 rows" rather than "the whole run". Good enough for a
// first pass — further pagination is a future enhancement, not built here.
const PAGE_SIZE = 500;

type ConsoleTab = "timeline" | "trades" | "orders" | "portfolio" | "metrics" | "logs" | "debug";

const TABS: { key: ConsoleTab; label: string }[] = [
  { key: "timeline", label: "Timeline" },
  { key: "trades", label: "Trades" },
  { key: "orders", label: "Orders" },
  { key: "portfolio", label: "Portfolio" },
  { key: "metrics", label: "Metrics" },
  { key: "logs", label: "System Logs" },
  { key: "debug", label: "Debug" },
];

interface ReplayConsoleProps {
  runId: string;
  strategyId: string;
  run: ResearchRun | undefined;
  window: ReplayWindow | undefined;
  currentCandleIndex: number | null;
  /** The current bar's own timestamp — trades/orders gate against this real
   * timestamp rather than a fictional candle-index field (trades/orders
   * rows don't carry one; see TradesTab/OrdersTab). */
  currentCandleTimestamp: number | undefined;
  /** Session's first candle index — anchors the windowed runtime_events
   * fetch used to resolve a trade's entry/exit sequence to a candle index. */
  firstCandleIndex: number | null;
  /** Session's last candle index — gives the Portfolio mini-curves a stable,
   * known x-axis so a new point extends the line rather than rescaling
   * everything already drawn. */
  lastCandleIndex: number | null;
  onSeekToCandle: (candleIndex: number) => void;
  /** Hovering a Timeline row calls this with a candle index (or null on
   * mouse-leave) to preview the chart crosshair without seeking. */
  onPreviewCandle: (candleIndex: number | null) => void;
  /** Real per-visited-bar PORTFOLIO_SNAPSHOT points — grows as replay
   * advances, never includes bars ahead of the playhead. */
  portfolioHistory: PortfolioHistoryPoint[];
}

export function ReplayConsole({
  runId,
  strategyId,
  run,
  window,
  currentCandleIndex,
  currentCandleTimestamp,
  firstCandleIndex,
  lastCandleIndex,
  onSeekToCandle,
  onPreviewCandle,
  portfolioHistory,
}: ReplayConsoleProps) {
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

  const tree: CandleTreeGroup | undefined = window?.candle_trees.find((t) => t.candle_index === currentCandleIndex);

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
          Analysis Console
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
          {activeTab === "timeline" && <TimelineTab tree={tree} currentCandleIndex={currentCandleIndex} onSeekToCandle={onSeekToCandle} onPreviewCandle={onPreviewCandle} />}
          {activeTab === "trades" && openedTabs.has("trades") && (
            <TradesTab
              runId={runId}
              currentCandleIndex={currentCandleIndex}
              currentCandleTimestamp={currentCandleTimestamp}
              firstCandleIndex={firstCandleIndex}
              portfolioHistory={portfolioHistory}
              onSeekToCandle={onSeekToCandle}
            />
          )}
          {activeTab === "orders" && openedTabs.has("orders") && (
            <OrdersTab runId={runId} firstCandleIndex={firstCandleIndex} currentCandleIndex={currentCandleIndex} onSeekToCandle={onSeekToCandle} />
          )}
          {activeTab === "portfolio" && (
            <PortfolioTab
              tree={tree}
              run={run}
              portfolioHistory={portfolioHistory}
              currentCandleIndex={currentCandleIndex}
              firstCandleIndex={firstCandleIndex}
              lastCandleIndex={lastCandleIndex}
            />
          )}
          {activeTab === "metrics" && (
            <MetricsTab runId={runId} run={run} currentCandleTimestamp={currentCandleTimestamp} />
          )}
          {activeTab === "logs" && openedTabs.has("logs") && <SystemLogsTab runId={runId} />}
          {activeTab === "debug" && <DebugTab strategyId={strategyId} tree={tree} window={window} currentCandleIndex={currentCandleIndex} />}
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

// ─── Timeline: this bar's story, chronological — Time / Event / Node / Details ──

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
  // Chronological — BAR_CLOSED first, then whatever it triggered, in order.
  const events = useMemo(() => (tree ? flattenCandleTree(tree) : []), [tree]);

  if (currentCandleIndex == null) return <EmptyState title="No bar selected." />;
  if (events.length === 0) {
    return (
      <EmptyState
        title={`Nothing happened at bar ${currentCandleIndex}.`}
        detail="No engine events were emitted for this bar — market data updated, but nothing else evaluated."
      />
    );
  }

  return (
    <ScrollTable>
      <table className="w-full">
        <thead className="sticky top-0 bg-card border-b border-border/40">
          <tr className="text-left text-muted-foreground">
            <Th>Time (UTC)</Th>
            <Th>Event</Th>
            <Th>Node</Th>
            <Th>Details</Th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {events.map((ev) => {
              const category = categoryForEventType(ev.type);
              const { label, node, details } = presentEvent(ev);
              return (
                <motion.tr
                  key={`${currentCandleIndex}-${ev.sequence_number}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => onSeekToCandle(ev.candle_index)}
                  onMouseEnter={() => onPreviewCandle(ev.candle_index)}
                  onMouseLeave={() => onPreviewCandle(null)}
                  className="border-b border-border/20 hover:bg-muted/30 cursor-pointer"
                  style={{ borderLeft: `2px solid ${REPLAY_COLORS[category]}33` }}
                >
                  <Td className="text-muted-foreground whitespace-nowrap">
                    {new Date(ev.timestamp).toLocaleTimeString(undefined, { hour12: false })}
                  </Td>
                  <Td className="whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: REPLAY_COLORS[category] }} />
                      {label}
                    </span>
                  </Td>
                  <Td className="truncate max-w-[160px]">
                    <span className="inline-block rounded bg-muted/40 px-1.5 py-0.5 text-[9.5px] font-mono text-muted-foreground/90 truncate max-w-full align-middle">
                      {node}
                    </span>
                  </Td>
                  <Td className="text-foreground/80 truncate">{details}</Td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </ScrollTable>
  );
}

// ─── Trades ──────────────────────────────────────────────────────────────────

/** Trades dataset rows are CompletedTrade.to_dict() — trade_id, symbol, side,
 * entry_price, exit_price, amount, entry_time, exit_time, gross_pnl, net_pnl,
 * entry_fee, exit_fee, funding_cost, leverage, portfolio_equity_after,
 * entry_sequence, exit_sequence. There is no candle_index/pnl_pct/reason
 * field — those are resolved or derived below, never assumed. */
function buildSequenceToCandleMap(runtimeEvents: Record<string, unknown>[] | undefined): Map<number, number> {
  const map = new Map<number, number>();
  for (const ev of runtimeEvents ?? []) {
    const seq = num(ev.sequence_number);
    const idx = num(ev.candle_index);
    if (seq != null && idx != null) map.set(seq, idx);
  }
  return map;
}

function TradesTab({
  runId,
  currentCandleIndex,
  currentCandleTimestamp,
  firstCandleIndex,
  portfolioHistory,
  onSeekToCandle,
}: {
  runId: string;
  currentCandleIndex: number | null;
  currentCandleTimestamp: number | undefined;
  firstCandleIndex: number | null;
  portfolioHistory: PortfolioHistoryPoint[];
  onSeekToCandle: (i: number) => void;
}) {
  const { data, isLoading } = useReplayDataset(runId, "trades", 0, PAGE_SIZE - 1);
  // Windowed like Smart Search — resolves entry_sequence/exit_sequence to a
  // real candle_index for click-to-seek (a known limitation: only trades
  // whose events fall in this first page resolve; seeking on later trades
  // is unavailable rather than wrong).
  const { data: runtimeEvents } = useReplayDataset(runId, "runtime_events", firstCandleIndex ?? 0, (firstCandleIndex ?? 0) + PAGE_SIZE - 1);
  const seqToCandle = useMemo(() => buildSequenceToCandleMap(runtimeEvents), [runtimeEvents]);

  if (isLoading) return <EmptyState title="Loading trades…" />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No trades yet."
        detail="Nothing has opened a position at or before this bar. Keep playing forward."
      />
    );
  }

  // No spoilers: gate by real entry_time/exit_time against the current bar's
  // own timestamp — trades don't carry a candle-index field, but every trade
  // does carry a real timestamp, so this needs no cross-referencing at all.
  const cursor = currentCandleTimestamp ?? Infinity;
  const reached = data
    .map((row, i) => ({ row, number: i + 1 }))
    .filter(({ row }) => {
      const entryTime = num(row.entry_time);
      return entryTime != null && entryTime <= cursor;
    });

  if (reached.length === 0) {
    return <EmptyState title="No trades yet." detail="Nothing has opened a position at or before this bar. Keep playing forward." />;
  }

  const open = reached.filter(({ row }) => {
    const exitTime = num(row.exit_time);
    return exitTime == null || exitTime > cursor;
  });
  const closed = reached
    .filter(({ row }) => {
      const exitTime = num(row.exit_time);
      return exitTime != null && exitTime <= cursor;
    })
    .reverse(); // most recently closed first

  // Same rewind-sync fix as the Portfolio tab's chart: only ever look at the
  // most recent snapshot at-or-before the current bar, never a later one
  // left over from playing forward past this point before rewinding.
  const barCursor = currentCandleIndex ?? Infinity;
  const historyUpToCursor = portfolioHistory.filter((p) => p.candleIndex <= barCursor);
  const latestPortfolio = historyUpToCursor[historyUpToCursor.length - 1];
  const unrealizedPnl = latestPortfolio ? latestPortfolio.equity - latestPortfolio.cash : null;

  const seekToTrade = (row: Record<string, unknown>, which: "entry_sequence" | "exit_sequence") => {
    const seq = num(row[which]);
    const candleIdx = seq != null ? seqToCandle.get(seq) : undefined;
    if (candleIdx != null) onSeekToCandle(candleIdx);
  };

  return (
    <div className="h-full overflow-auto p-3 flex flex-col gap-4">
      {open.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-bold tracking-wider text-muted-foreground/70 uppercase">Open Position</span>
          {open.map(({ row, number }) => {
            const side = String(row.side ?? "").toUpperCase();
            return (
              <motion.div
                key={number}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 flex items-center gap-3 cursor-pointer"
                onClick={() => seekToTrade(row, "entry_sequence")}
              >
                <motion.span
                  className="size-2 rounded-full bg-primary shrink-0"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
                <span className="text-[11px] font-bold">Trade #{number}</span>
                <SideBadge side={side} />
                <span className="text-[10px] text-muted-foreground ml-auto">Entry {fmtTime(row.entry_time)}</span>
                {unrealizedPnl != null && (
                  <span className={cn("text-[11px] font-bold tabular-nums", unrealizedPnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {unrealizedPnl >= 0 ? "+" : ""}
                    {unrealizedPnl.toFixed(2)}
                  </span>
                )}
              </motion.div>
            );
          })}
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
                  <Th>Fees</Th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {closed.map(({ row, number }) => {
                    const pnl = num(row.net_pnl);
                    const entryPrice = num(row.entry_price);
                    const amount = num(row.amount);
                    // pnl_pct isn't a real field — derived from net_pnl over
                    // notional (entry_price * amount), documented here rather
                    // than assumed to exist.
                    const pnlPct = pnl != null && entryPrice && amount ? (pnl / (entryPrice * amount)) * 100 : null;
                    const fees = (num(row.entry_fee) ?? 0) + (num(row.exit_fee) ?? 0) + (num(row.funding_cost) ?? 0);
                    const entryTime = row.entry_time;
                    const exitTime = row.exit_time;
                    return (
                      <motion.tr
                        key={number}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => seekToTrade(row, "entry_sequence")}
                        className="border-b border-border/20 hover:bg-muted/30 cursor-pointer"
                      >
                        <Td>{fmtTime(entryTime)}</Td>
                        <Td>{fmtTime(exitTime)}</Td>
                        <Td className="uppercase font-bold">{String(row.side ?? "—")}</Td>
                        <Td className={cn("font-bold", pnl != null && (pnl >= 0 ? "text-emerald-500" : "text-rose-500"))}>
                          {pnl != null ? pnl.toFixed(2) : "—"}
                        </Td>
                        <Td>{pnlPct != null ? `${pnlPct.toFixed(2)}%` : "—"}</Td>
                        <Td className="text-muted-foreground">{fmtDuration(entryTime, exitTime)}</Td>
                        <Td className="text-muted-foreground">{fees.toFixed(2)}</Td>
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
  const isShort = side.includes("SHORT") || side === "SELL";
  return (
    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", isShort ? "bg-rose-500/15 text-rose-500" : "bg-emerald-500/15 text-emerald-500")}>
      {isShort ? "SHORT" : "LONG"}
    </span>
  );
}

// ─── Orders: a real lifecycle, from runtime_events — not the flat "orders"
//     dataset, which has neither a candle_index nor an order_type field. ─────

const ORDER_STAGE_LABEL: Record<string, string> = {
  ORDER_CREATED: "Created",
  ORDER_SUBMITTED: "Submitted",
  ORDER_FILLED: "Filled",
  ORDER_REJECTED: "Rejected",
  ORDER_CANCELLED: "Cancelled",
};

function OrdersTab({
  runId,
  firstCandleIndex,
  currentCandleIndex,
  onSeekToCandle,
}: {
  runId: string;
  firstCandleIndex: number | null;
  currentCandleIndex: number | null;
  onSeekToCandle: (i: number) => void;
}) {
  const { data, isLoading } = useReplayDataset(runId, "runtime_events", firstCandleIndex ?? 0, (firstCandleIndex ?? 0) + PAGE_SIZE - 1);
  if (isLoading) return <EmptyState title="Loading orders…" />;

  // No spoilers: each stage only shows once its own bar has been reached —
  // an order visibly progresses Created -> Submitted -> Filled as you play
  // forward, rather than appearing fully resolved on first view.
  const cursor = currentCandleIndex ?? Infinity;
  const orderEvents = (data ?? []).filter((row) => {
    const type = String(row.type ?? "");
    const idx = num(row.candle_index);
    return type.startsWith("ORDER_") && idx != null && idx <= cursor;
  });

  if (orderEvents.length === 0) {
    return (
      <EmptyState
        title="No order yet."
        detail="Nothing has been submitted at or before this bar. Keep playing forward."
      />
    );
  }

  const grouped = new Map<string, Record<string, unknown>[]>();
  for (const ev of orderEvents) {
    const orderId = String((ev.payload as Record<string, unknown> | undefined)?.order_id ?? ev.sequence_number);
    const list = grouped.get(orderId) ?? [];
    list.push(ev);
    grouped.set(orderId, list);
  }
  const orders = Array.from(grouped.values())
    .map((events) => events.sort((a, b) => num(a.sequence_number)! - num(b.sequence_number)!))
    .sort((a, b) => num(b[0].sequence_number)! - num(a[0].sequence_number)!); // most recent order first

  return (
    <div className="h-full overflow-auto p-3 flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {orders.map((events) => (
          <OrderCard key={String(events[0].sequence_number)} events={events} onSeek={onSeekToCandle} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function OrderCard({ events, onSeek }: { events: Record<string, unknown>[]; onSeek: (i: number) => void }) {
  const created = events.find((e) => e.type === "ORDER_CREATED");
  const filled = events.find((e) => e.type === "ORDER_FILLED");
  const latest = events[events.length - 1];
  const basePayload = (created?.payload ?? latest.payload) as Record<string, unknown>;
  const side = String(basePayload.side ?? "").toUpperCase();
  const orderType = String(basePayload.order_type ?? "MARKET");
  const terminalType = String(latest.type);
  const isFilled = terminalType === "ORDER_FILLED";
  const isTerminalStop = terminalType === "ORDER_REJECTED" || terminalType === "ORDER_CANCELLED";

  const filledPayload = filled?.payload as Record<string, unknown> | undefined;
  const price = isFilled ? num(filledPayload?.fill_price) : num(basePayload.price);
  const qty = isFilled ? num(filledPayload?.fill_quantity) : num(basePayload.size ?? basePayload.quantity);
  const candleIdx = num(created?.candle_index ?? latest.candle_index);

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

// ─── Portfolio: current state + how it got here. ──────────────────────────

function PortfolioTab({
  tree,
  run,
  portfolioHistory,
  currentCandleIndex,
  firstCandleIndex,
  lastCandleIndex,
}: {
  tree: CandleTreeGroup | undefined;
  run: ResearchRun | undefined;
  portfolioHistory: PortfolioHistoryPoint[];
  currentCandleIndex: number | null;
  firstCandleIndex: number | null;
  lastCandleIndex: number | null;
}) {
  const flatEvents = tree ? flattenCandleTree(tree) : [];
  const snapshot = flatEvents.find((n) => n.type === "PORTFOLIO_SNAPSHOT");
  const payload = snapshot?.payload as Record<string, number> | undefined;
  const position = computeCurrentPosition(flatEvents);
  const summary = run?.summary_json as BacktestSummary | undefined;

  // portfolioHistory only ever grows (bars stay recorded once visited so
  // scrubbing forward/back doesn't re-fetch), but the chart itself must stay
  // in sync with wherever the playhead actually is right now — rewinding
  // should shrink the visible curve back down, not keep showing bars you'd
  // already played past before rewinding.
  const cursor = currentCandleIndex ?? Infinity;
  const historyUpToCursor = portfolioHistory.filter((p) => p.candleIndex <= cursor);
  const equitySeries: [number, number][] = historyUpToCursor.map((p) => [p.candleIndex, p.equity]);
  const drawdownSeries = equitySeries.length > 0 ? computeDrawdownSeries(equitySeries) : [];

  // Scale the mini-curves against the run's real known equity range (from
  // the whole-run preview, unioned with whatever's been observed live so
  // far) rather than just the min/max of the points plotted so far — with
  // only a couple of points, auto-scaling always draws corner-to-corner
  // regardless of how small the real move actually was.
  const previewEquity = summary?.equity_preview?.map(([, v]) => v) ?? [];
  const observedEquity = equitySeries.map(([, v]) => v);
  const allKnownEquity = [...previewEquity, ...observedEquity];
  const knownEquityMin = allKnownEquity.length > 0 ? Math.min(...allKnownEquity) : undefined;
  const knownEquityMax = allKnownEquity.length > 0 ? Math.max(...allKnownEquity) : undefined;
  const knownMaxDrawdown = summary?.max_drawdown_pct != null ? Math.max(summary.max_drawdown_pct / 100, ...drawdownSeries.map(([, v]) => v)) : undefined;

  if (!payload) return <EmptyState title="No portfolio snapshot at this bar." />;

  const equityReturnPct = summary?.initial_capital ? ((payload.equity - summary.initial_capital) / summary.initial_capital) * 100 : null;
  // gross_exposure is a raw dollar notional (sum of abs position notional),
  // not a fraction — the percentage figure is notional / equity.
  const exposurePct = payload.equity > 0 ? (payload.gross_exposure / payload.equity) * 100 : null;
  const unrealizedPnl = payload.equity - payload.cash;

  return (
    <div className="h-full overflow-auto p-4 flex flex-col gap-3">
      <div className="rounded-xl border border-border/50 bg-muted/10 p-4 flex flex-col gap-1">
        <span className="text-[9px] font-bold tracking-wider text-muted-foreground/70 uppercase">Total Equity</span>
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-black tabular-nums text-foreground">
            <AnimatedNumber value={payload.equity} format={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })} />
          </span>
          {equityReturnPct != null && (
            <span className={cn("text-[13px] font-bold tabular-nums", equityReturnPct >= 0 ? "text-emerald-500" : "text-rose-500")}>
              {equityReturnPct >= 0 ? "+" : ""}
              {equityReturnPct.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Balance">
          <span className="text-[15px] font-mono font-semibold text-foreground tabular-nums">
            {payload.cash.toLocaleString(undefined, { maximumFractionDigits: 2 })}
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
          {summary?.leverage != null && <span className="text-[10px] font-mono text-muted-foreground">{summary.leverage}x</span>}
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
              Equity Curve — {historyUpToCursor.length} bars observed
            </span>
            <div className="flex-1 min-h-0">
              <MiniSpark
                points={equitySeries}
                color="#818cf8"
                yMin={knownEquityMin}
                yMax={knownEquityMax}
                xMin={firstCandleIndex ?? undefined}
                xMax={lastCandleIndex ?? undefined}
                valueLabel="Equity"
              />
            </div>
          </div>
          <div className="rounded-xl border border-border/50 bg-muted/10 p-3 flex flex-col gap-1 h-full min-h-0">
            <span className="text-[9px] font-bold tracking-wider text-muted-foreground/70 uppercase shrink-0">Drawdown</span>
            <div className="flex-1 min-h-0">
              <MiniSpark
                points={drawdownSeries}
                color="#ef4444"
                fillBottom
                yMax={knownMaxDrawdown}
                xMin={firstCandleIndex ?? undefined}
                xMax={lastCandleIndex ?? undefined}
                valueLabel="Drawdown"
                formatValue={(v) => `${(v * 100).toFixed(2)}%`}
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[10.5px] text-muted-foreground">
          The equity curve grows as you play forward — only bars you&apos;ve actually visited are plotted.
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
  xMin,
  xMax,
  valueLabel,
  formatValue,
}: {
  points: [number, number][];
  color: string;
  fillBottom?: boolean;
  /** Known real bounds (e.g. the run's actual min/max equity) to scale
   * against, instead of just the min/max of the points plotted so far — a
   * 2-point line otherwise always draws corner-to-corner regardless of how
   * small the real move was. */
  yMin?: number;
  yMax?: number;
  /** Known real candle-index range (the whole run's bounds) so the x-axis
   * stays fixed — a new point extends the line rather than every earlier
   * point rescaling horizontally. */
  xMin?: number;
  xMax?: number;
  valueLabel: string;
  formatValue?: (v: number) => string;
}) {
  const values = points.map(([, v]) => v);
  const indices = points.map(([i]) => i);
  const yDomain: [number, number] = [yMin ?? (fillBottom ? 0 : Math.min(...values)), yMax ?? Math.max(...values)];
  const xDomain: [number, number] = [xMin ?? Math.min(...indices), xMax ?? Math.max(...indices)];
  const format = formatValue ?? ((v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 }));
  const data = points.map(([candleIndex, value]) => ({ candleIndex, value }));
  const gradientId = `mini-spark-${valueLabel.replace(/\s+/g, "-").toLowerCase()}`;

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
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={false}
        />
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

// ─── Metrics: executive cards, never a flat grid ──────────────────────────────

function MetricsTab({
  runId,
  run,
  currentCandleTimestamp,
}: {
  runId: string;
  run: ResearchRun | undefined;
  currentCandleTimestamp: number | undefined;
}) {
  const { data: trades } = useReplayDataset(runId, "trades", 0, PAGE_SIZE - 1);
  const s = run?.summary_json as BacktestSummary | undefined;
  if (!s) return <EmptyState title="No summary metrics available for this run yet." />;

  // Trade Quality is computed live from trades reached so far — a real,
  // honest client-side aggregation gated on each trade's real entry_time/
  // exit_time (trades have no candle-index field). Returns/Risk stay
  // whole-run static (Sharpe etc. can't be honestly recomputed per-bar
  // without engine support) and are labeled "(Final)" so the two are never
  // confused.
  const cursor = currentCandleTimestamp ?? Infinity;
  const closedSoFar = (trades ?? []).filter((t) => {
    const exitTime = num(t.exit_time);
    return exitTime != null && exitTime <= cursor;
  });
  const openSoFar = (trades ?? []).filter((t) => {
    const entryTime = num(t.entry_time);
    const exitTime = num(t.exit_time);
    return entryTime != null && entryTime <= cursor && (exitTime == null || exitTime > cursor);
  });
  const pnlOf = (t: Record<string, unknown>) => num(t.net_pnl) ?? 0;
  const wins = closedSoFar.filter((t) => pnlOf(t) > 0);
  const losses = closedSoFar.filter((t) => pnlOf(t) < 0);
  const grossProfit = wins.reduce((sum, t) => sum + pnlOf(t), 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + pnlOf(t), 0));
  const netProfitLive = closedSoFar.reduce((sum, t) => sum + pnlOf(t), 0);
  const winRateLive = closedSoFar.length > 0 ? wins.length / closedSoFar.length : 0;
  const profitFactorLive = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : null;

  return (
    <div className="h-full overflow-auto p-3 grid grid-cols-3 gap-3">
      <MetricCard title="Returns (Final)" headline={`${s.total_return_pct >= 0 ? "+" : ""}${s.total_return_pct.toFixed(1)}%`}>
        <CardRow label="Net Profit" value={s.net_profit.toFixed(2)} />
        <CardRow label="Avg Trade" value={s.average_trade?.toFixed(2) ?? "—"} />
        <CardRow label="Trades" value={String(s.trade_count)} />
      </MetricCard>
      <MetricCard
        title="Risk (Final)"
        headline={s.sharpe_ratio != null ? s.sharpe_ratio.toFixed(2) : "—"}
        headlineLabel={s.sharpe_ratio != null ? computeMetricLabel("sharpe", s.sharpe_ratio) : undefined}
      >
        <CardRow label="Sortino" value={s.sortino_ratio?.toFixed(2) ?? "—"} />
        <CardRow label="Calmar" value={s.calmar_ratio?.toFixed(2) ?? "—"} />
        <CardRow
          label="Max Drawdown"
          value={`${s.max_drawdown_pct.toFixed(1)}%`}
          badge={computeMetricLabel("max_drawdown_pct", s.max_drawdown_pct)}
        />
      </MetricCard>
      <MetricCard
        title="Trade Quality — live"
        headline={<AnimatedNumber value={winRateLive * 100} format={(v) => `${v.toFixed(0)}%`} />}
        headlineLabel={closedSoFar.length > 0 ? computeMetricLabel("win_rate", winRateLive) : "No trades closed yet"}
      >
        <CardRow label="Closed Trades" value={<AnimatedNumber value={closedSoFar.length} format={(v) => String(Math.round(v))} />} />
        <CardRow label="Open Trades" value={String(openSoFar.length)} />
        <CardRow
          label="Profit Factor"
          value={profitFactorLive == null ? "—" : profitFactorLive === Infinity ? "∞" : profitFactorLive.toFixed(2)}
          badge={profitFactorLive != null && Number.isFinite(profitFactorLive) ? computeMetricLabel("profit_factor", profitFactorLive) : undefined}
        />
        <CardRow
          label="Net Profit"
          value={<AnimatedNumber value={netProfitLive} format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}`} />}
        />
      </MetricCard>
    </div>
  );
}

function MetricCard({
  title,
  headline,
  headlineLabel,
  children,
}: {
  title: string;
  headline: React.ReactNode;
  headlineLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/10 p-3 flex flex-col gap-2">
      <span className="text-[9px] font-bold tracking-wider text-muted-foreground/70 uppercase">{title}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[20px] font-black tabular-nums text-foreground">{headline}</span>
        {headlineLabel && (
          <span className="text-[9.5px] font-semibold text-muted-foreground">{headlineLabel}</span>
        )}
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

// Small count-up number — motion tweens the numeric value and re-formats it
// on every tick, so Metrics/Portfolio figures animate instead of jumping.
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

// ─── System Logs ─────────────────────────────────────────────────────────────

function SystemLogsTab({ runId }: { runId: string }) {
  const { data, isLoading } = useReplayDataset(runId, "execution_logs", 0, PAGE_SIZE - 1);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string | null>(null);

  const filtered = (data ?? []).filter((row) => {
    const level = String(row.level ?? "INFO");
    const message = String(row.message ?? "");
    if (levelFilter && level !== levelFilter) return false;
    if (query && !message.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  if (isLoading) return <EmptyState title="Loading logs…" />;
  if (!data || data.length === 0) {
    return <EmptyState title="No execution logs for this run." detail="Nothing was logged at INFO/WARNING/ERROR level during this backtest." />;
  }

  const levels = Array.from(new Set(data.map((r) => String(r.level ?? "INFO"))));

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border/40 shrink-0">
        <IconSearch className="size-3 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search logs…"
          className="flex-1 bg-transparent text-[10.5px] outline-none placeholder:text-muted-foreground/50"
        />
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => setLevelFilter((l) => (l === level ? null : level))}
            className={cn(
              "text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer",
              levelFilter === level
                ? level === "WARNING" ? "bg-amber-500/20 text-amber-500" : level === "ERROR" ? "bg-rose-500/20 text-rose-500" : "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-muted/60"
            )}
          >
            {level}
          </button>
        ))}
      </div>
      <ScrollTable>
        <div className="p-2 flex flex-col gap-0.5">
          {filtered.map((row, i) => (
            <div key={i} className="flex items-start gap-2 py-0.5">
              <span
                className={cn(
                  "text-[9px] font-bold shrink-0 w-14",
                  row.level === "WARNING" ? "text-amber-500" : row.level === "ERROR" ? "text-rose-500" : "text-muted-foreground"
                )}
              >
                {String(row.level ?? "INFO")}
              </span>
              <span className="text-muted-foreground/90">{String(row.message ?? "")}</span>
            </div>
          ))}
        </div>
      </ScrollTable>
    </div>
  );
}

// ─── Debug ───────────────────────────────────────────────────────────────────

function DebugTab({
  strategyId,
  tree,
  window,
  currentCandleIndex,
}: {
  strategyId: string;
  tree: CandleTreeGroup | undefined;
  window: ReplayWindow | undefined;
  currentCandleIndex: number | null;
}) {
  const { data: strategy } = useStrategy(strategyId);
  const snap = window?.indicator_snapshots.find((s) => (s.bar_index ?? -1) === currentCandleIndex);
  const rawEvents: ReplayEventNode[] = tree ? flattenCandleTree(tree) : [];

  return (
    <ScrollTable>
      <div className="p-3 flex flex-col gap-3">
        <DebugSection title="Current bar decision tree" value={tree} />
        <DebugSection title="Raw events (this bar, flattened)" value={rawEvents} />
        <DebugSection title="Current bar indicator snapshot" value={snap} />
        <DebugSection title="Compiled strategy (Python)" value={strategy?.compiled_code} raw />
      </div>
    </ScrollTable>
  );
}

function DebugSection({ title, value, raw }: { title: string; value: unknown; raw?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-bold tracking-wider text-muted-foreground/70 uppercase">{title}</span>
      <pre className="text-[9.5px] bg-muted/30 rounded-md p-2 overflow-auto max-h-48 whitespace-pre-wrap break-all">
        {value == null ? "—" : raw ? String(value) : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────

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
function fmtTime(v: unknown): string {
  if (v == null) return "—";
  const d = new Date(typeof v === "number" ? v : String(v));
  return isNaN(d.getTime()) ? String(v) : d.toLocaleTimeString(undefined, { hour12: false });
}
function fmtDuration(entry: unknown, exit: unknown): string {
  if (entry == null || exit == null) return "—";
  const entryDate = new Date(typeof entry === "number" ? entry : String(entry));
  const exitDate = new Date(typeof exit === "number" ? exit : String(exit));
  if (isNaN(entryDate.getTime()) || isNaN(exitDate.getTime())) return "—";
  const ms = exitDate.getTime() - entryDate.getTime();
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
