"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import {
  IconChevronDown,
  IconArrowRight,
  IconArrowBigUpLine,
  IconArrowBigDownLine,
  IconBolt,
  IconWallet,
  IconCircleDot,
} from "@tabler/icons-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  buildExecutionSteps,
  computeCurrentPosition,
  computeDecisionQuality,
  computeFillLatencyMs,
  findActivePolicies,
  findConditionEvents,
  findPortfolioSnapshot,
  flattenCandleTree,
  presentEvent,
  computeDrawdownSeries,
  type PortfolioHistoryPoint,
} from "@/lib/replay-analysis";
import { useReplayStore, selectTreeForCandle, selectPortfolioHistory } from "@/store/replay-store";
import type { ResearchRun, BacktestSummary } from "@/types/strategy-actions";

interface ReplayDecisionInspectorProps {
  currentCandleIndex: number;
  run: ResearchRun | undefined;
}

export function ReplayDecisionInspector({ currentCandleIndex, run }: ReplayDecisionInspectorProps) {
  const [executionOpen, setExecutionOpen] = useState(true);
  const [portfolioOpen, setPortfolioOpen] = useState(true);

  const store = useReplayStore();
  const tree = useMemo(() => selectTreeForCandle(store, currentCandleIndex) ?? undefined, [store, currentCandleIndex]);
  // Already gated at <= currentCandleIndex by construction (built from
  // selectRuntimeEventsUpTo) — rewinding shrinks this back down for free,
  // no separate filter needed here.
  const portfolioHistoryUpToCursor = useMemo(
    () => selectPortfolioHistory(store, currentCandleIndex),
    [store, currentCandleIndex]
  );

  const flatEvents = useMemo(() => (tree ? flattenCandleTree(tree) : []), [tree]);
  const conditionEvents = useMemo(() => findConditionEvents(flatEvents), [flatEvents]);
  const quality = useMemo(() => computeDecisionQuality(conditionEvents), [conditionEvents]);
  const executionSteps = useMemo(() => buildExecutionSteps(flatEvents), [flatEvents]);
  const policies = useMemo(() => findActivePolicies(flatEvents), [flatEvents]);
  const portfolio = useMemo(() => findPortfolioSnapshot(flatEvents), [flatEvents]);
  const latencyMs = useMemo(() => computeFillLatencyMs(flatEvents), [flatEvents]);
  const position = useMemo(() => computeCurrentPosition(flatEvents), [flatEvents]);

  const actionEvent = flatEvents.find((e) => e.type === "ACTION_TRIGGERED");
  const actionSide = actionEvent
    ? String((actionEvent.payload as Record<string, unknown>).action_type ?? "").toUpperCase() || null
    : null;
  const isBuy = actionSide?.includes("BUY") || actionSide?.includes("LONG");

  const summary = run?.summary_json as BacktestSummary | undefined;
  const orders = flatEvents.filter((e) => e.type.startsWith("ORDER_"));
  const equityReturnPct =
    portfolio && summary?.initial_capital ? ((portfolio.equity - summary.initial_capital) / summary.initial_capital) * 100 : null;
  // gross_exposure is a raw dollar notional, not a fraction — the percentage
  // is notional / equity, matching the engine's own gross_exposure_pct
  // definition (portfolio/models.py).
  const exposurePct = portfolio && portfolio.equity > 0 ? (portfolio.gross_exposure / portfolio.equity) * 100 : null;
  const unrealizedPnl = portfolio ? portfolio.equity - portfolio.cash : null;

  return (
    <div className="h-full rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
      {/* ─── Fixed header ─── */}
      <div className="flex flex-col gap-2 px-4 py-3 border-b border-border/40 shrink-0 bg-gradient-to-b from-muted/20 to-transparent">
        <div className="flex items-center gap-2">
          <h3 className="text-[12px] font-bold text-foreground tracking-wide">Decision Inspector</h3>
          <span className="text-[10px] font-mono text-muted-foreground/60">bar {currentCandleIndex}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {actionSide ? (
            <Badge
              className={cn(
                "text-[10px] px-2 py-0.5 font-bold gap-1",
                isBuy
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 border-rose-500/20"
              )}
            >
              {isBuy ? <IconArrowBigUpLine className="size-3" /> : <IconArrowBigDownLine className="size-3" />}
              {actionSide} · {quality.pct}% · {quality.label}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-semibold text-muted-foreground">
              No Action
            </Badge>
          )}
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-2 py-0.5 font-bold gap-1",
              position.side === "LONG" && "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
              position.side === "SHORT" && "border-rose-500/30 text-rose-500",
              position.side === "FLAT" && "text-muted-foreground"
            )}
          >
            {position.side !== "FLAT" && (
              <motion.span
                className={cn("size-1.5 rounded-full", position.side === "LONG" ? "bg-emerald-500" : "bg-rose-500")}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            )}
            {position.side}
            {position.quantity != null && ` · ${position.quantity}`}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {/* Decision Summary + per-condition breakdown live in the Timeline
            tab now (Bar closed → Condition evaluated → ...) — no need to
            duplicate them here. This panel is Execution + Portfolio only. */}

        {/* ─── Execution ─── */}
        <SectionAccordion title="Execution" icon={IconBolt} open={executionOpen} onOpenChange={setExecutionOpen}>
          {executionSteps.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 py-3 text-center">
              <IconCircleDot className="size-4 text-muted-foreground/30" />
              <p className="text-[10.5px] text-muted-foreground">No execution activity at this bar.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {executionSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {i > 0 && <IconArrowRight className="size-2.5 text-muted-foreground/40 shrink-0" />}
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-semibold">
                    {step.label}
                  </Badge>
                  <span className="text-[9px] font-mono text-muted-foreground">
                    {new Date(step.timestamp).toLocaleTimeString(undefined, { hour12: false })}
                  </span>
                </div>
              ))}
            </div>
          )}
          {orders.length > 0 && (
            <div className="flex flex-col gap-1 pt-1 border-t border-border/40">
              <span className="text-[9px] font-bold tracking-wider text-muted-foreground/70 uppercase">Orders</span>
              {orders.map((o, i) => (
                <div key={i} className="text-[10px] font-mono text-muted-foreground">
                  {presentEvent(o).label}
                  {typeof (o.payload as Record<string, unknown>).fill_price === "number" && (
                    <span className="text-foreground"> @ {((o.payload as Record<string, unknown>).fill_price as number).toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {(policies.stopLoss != null || policies.takeProfit != null) && (
            <div className="flex items-center gap-3 pt-1 border-t border-border/40 text-[10px] font-mono">
              {policies.stopLoss != null && (
                <span className="text-muted-foreground">
                  SL <span className="text-orange-500 font-semibold">{policies.stopLoss.toLocaleString()}</span>
                </span>
              )}
              {policies.takeProfit != null && (
                <span className="text-muted-foreground">
                  TP <span className="text-sky-500 font-semibold">{policies.takeProfit.toLocaleString()}</span>
                </span>
              )}
            </div>
          )}
          {(summary?.leverage != null || latencyMs != null) && (
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40 text-[10px] font-mono">
              {summary?.leverage != null && (
                <span className="text-muted-foreground">
                  Leverage <span className="text-foreground font-semibold">{summary.leverage}x</span>
                </span>
              )}
              {latencyMs != null && (
                <span className="text-muted-foreground col-span-2">
                  Fill Latency <span className="text-foreground font-semibold">{latencyMs}ms</span>
                </span>
              )}
            </div>
          )}
        </SectionAccordion>

        {/* ─── Portfolio ─── */}
        <SectionAccordion title="Portfolio" icon={IconWallet} open={portfolioOpen} onOpenChange={setPortfolioOpen}>
          {portfolio ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8.5px] font-bold tracking-wider text-muted-foreground/70 uppercase">Equity</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[22px] font-black tabular-nums text-foreground leading-none">
                    {portfolio.equity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  {equityReturnPct != null && (
                    <span className={cn("text-[11px] font-bold tabular-nums", equityReturnPct >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {equityReturnPct >= 0 ? "+" : ""}
                      {equityReturnPct.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <MiniStat label="Cash" value={portfolio.cash} />
                <MiniStat
                  label="Unrealized"
                  value={unrealizedPnl ?? 0}
                  color={unrealizedPnl != null && unrealizedPnl >= 0 ? "#22c55e" : "#ef4444"}
                />
                {/* gross_exposure is a raw dollar notional, not a fraction —
                    the percentage is notional / equity, matching the
                    engine's own gross_exposure_pct (portfolio/models.py). */}
                <MiniStat label="Exposure" value={exposurePct ?? 0} suffix="%" />
                <MiniStat label="Drawdown" value={portfolio.drawdown * 100} suffix="%" color="#ef4444" />
              </div>
              {portfolioHistoryUpToCursor.length > 1 && (
                <div className="pt-1 border-t border-border/40 flex flex-col gap-1">
                  <span className="text-[9px] font-mono text-muted-foreground/70">
                    Equity so far — {portfolioHistoryUpToCursor.length} bars observed
                  </span>
                  <MiniEquityTrail history={portfolioHistoryUpToCursor} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-3 text-center">
              <IconWallet className="size-4 text-muted-foreground/30" />
              <p className="text-[10.5px] text-muted-foreground">No portfolio snapshot at this bar.</p>
            </div>
          )}
        </SectionAccordion>
      </div>
    </div>
  );
}

function SectionAccordion({
  title,
  icon: Icon,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="rounded-lg border border-border/50 bg-muted/[0.03]">
      <CollapsibleTrigger className="w-full flex items-center gap-2 px-3 py-2 cursor-pointer">
        <Icon className="size-3.5 text-muted-foreground/70 shrink-0" />
        <span className="text-[11px] font-semibold text-foreground/80">{title}</span>
        <IconChevronDown className={cn("size-3.5 ml-auto text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-2.5 flex flex-col gap-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function MiniEquityTrail({ history }: { history: PortfolioHistoryPoint[] }) {
  const drawdownSeries = computeDrawdownSeries(history.map((p) => [p.candleIndex, p.equity]));
  const inDrawdown = (drawdownSeries[drawdownSeries.length - 1]?.[1] ?? 0) > 0.01;
  const color = inDrawdown ? "#ef4444" : "#22c55e";
  const data = history.map((p) => ({ candleIndex: p.candleIndex, equity: p.equity }));
  return (
    <div className="w-full h-9">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 1, bottom: 0, left: 1 }}>
          <defs>
            <linearGradient id="mini-equity-trail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="equity"
            stroke={color}
            strokeWidth={1.5}
            fill="url(#mini-equity-trail)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniStat({
  label,
  value,
  suffix = "",
  color,
}: {
  label: string;
  value: number;
  suffix?: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/10 px-2.5 py-1.5 flex flex-col gap-0.5">
      <span className="text-[8.5px] font-bold tracking-wider text-muted-foreground/70 uppercase">{label}</span>
      <span className="text-[12px] font-mono font-semibold tabular-nums" style={color ? { color } : undefined}>
        {value >= 0 ? "" : "-"}
        {Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        {suffix}
      </span>
    </div>
  );
}
