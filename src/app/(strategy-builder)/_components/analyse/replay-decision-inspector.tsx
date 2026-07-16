"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import {
  IconCheck,
  IconX,
  IconChevronDown,
  IconSparkles,
  IconArrowRight,
  IconArrowBigUpLine,
  IconArrowBigDownLine,
  IconGitBranch,
} from "@tabler/icons-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { REPLAY_COLORS, type ReplayColorCategory } from "@/lib/replay-colors";
import {
  buildExecutionSteps,
  buildTradeNarrative,
  computeCurrentPosition,
  computeDecisionQuality,
  computeFillLatencyMs,
  findActivePolicies,
  findConditionEvents,
  findPortfolioSnapshot,
  flattenCandleTree,
  inferReasonTags,
  presentEvent,
  computeDrawdownSeries,
  type PortfolioHistoryPoint,
} from "@/lib/replay-analysis";
import type { CandleTreeGroup } from "@/types/replay";
import type { ResearchRun, BacktestSummary } from "@/types/strategy-actions";

const GRAPH_STEPS = ["Market", "Indicators", "Conditions", "Decision", "Execution", "Portfolio"];

interface ReplayDecisionInspectorProps {
  tree: CandleTreeGroup | undefined;
  currentCandleIndex: number;
  run: ResearchRun | undefined;
  /** Real per-visited-bar portfolio snapshots, shared with the Analysis
   * Console's Portfolio tab — grows as replay advances. */
  portfolioHistory: PortfolioHistoryPoint[];
}

export function ReplayDecisionInspector({ tree, currentCandleIndex, run, portfolioHistory }: ReplayDecisionInspectorProps) {
  const [explainExpanded, setExplainExpanded] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(true);
  const [executionOpen, setExecutionOpen] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);

  const flatEvents = useMemo(() => (tree ? flattenCandleTree(tree) : []), [tree]);
  const conditionEvents = useMemo(() => findConditionEvents(flatEvents), [flatEvents]);
  const quality = useMemo(() => computeDecisionQuality(conditionEvents), [conditionEvents]);
  const reasonTags = useMemo(() => inferReasonTags(conditionEvents), [conditionEvents]);
  const executionSteps = useMemo(() => buildExecutionSteps(flatEvents), [flatEvents]);
  const policies = useMemo(() => findActivePolicies(flatEvents), [flatEvents]);
  const portfolio = useMemo(() => findPortfolioSnapshot(flatEvents), [flatEvents]);
  const latencyMs = useMemo(() => computeFillLatencyMs(flatEvents), [flatEvents]);
  const position = useMemo(() => computeCurrentPosition(flatEvents), [flatEvents]);
  // Same rewind-sync rule as the console's Portfolio tab: only ever plot
  // bars at-or-before the current one, so rewinding shrinks the trail back
  // down instead of still showing bars played past before rewinding.
  const portfolioHistoryUpToCursor = useMemo(
    () => portfolioHistory.filter((p) => p.candleIndex <= currentCandleIndex),
    [portfolioHistory, currentCandleIndex]
  );

  const actionEvent = flatEvents.find((e) => e.type === "ACTION_TRIGGERED");
  const actionSide = actionEvent
    ? String((actionEvent.payload as Record<string, unknown>).action_type ?? "").toUpperCase() || null
    : null;
  const isBuy = actionSide?.includes("BUY") || actionSide?.includes("LONG");

  const narrative = buildTradeNarrative({
    actionSide,
    conditionEvents,
    quality,
    executionSteps,
    policies,
    portfolio,
  });

  const summary = run?.summary_json as BacktestSummary | undefined;
  const orders = flatEvents.filter((e) => e.type.startsWith("ORDER_"));

  return (
    <div className="h-full rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
      {/* ─── Fixed header ─── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 shrink-0">
        <h3 className="text-[12px] font-semibold text-foreground/80 tracking-wide">Decision Inspector</h3>
        <span className="text-[10px] font-mono text-muted-foreground/60">bar {currentCandleIndex}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {position.side !== "FLAT" && (
            <motion.span
              className="size-1.5 rounded-full bg-emerald-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              title="Position open"
            />
          )}
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
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {/* ─── Decision Summary — always visible ─── */}
        <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 flex flex-col gap-2">
          <p className="text-[11px] text-foreground/90 leading-relaxed">{narrative}</p>
          <button
            onClick={() => setExplainExpanded((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline cursor-pointer self-start"
          >
            <IconSparkles className="size-3" />
            {explainExpanded ? "Hide details" : "Explain This Trade"}
          </button>
          {explainExpanded && (
            <div className="flex flex-col gap-1.5 pt-1.5 border-t border-border/40">
              {conditionEvents.map((c) => (
                <div key={c.sequence_number} className="flex items-center gap-1.5 text-[10px] font-mono">
                  {c.payload.passed ? (
                    <IconCheck className="size-3 text-emerald-500 shrink-0" stroke={3} />
                  ) : (
                    <IconX className="size-3 text-rose-500 shrink-0" stroke={3} />
                  )}
                  <span className="text-muted-foreground truncate">{c.payload.expression}</span>
                </div>
              ))}
              {reasonTags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap pt-1">
                  {reasonTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0" style={{ borderColor: REPLAY_COLORS.indicators, color: REPLAY_COLORS.indicators }}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {executionSteps.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap pt-1">
                  {executionSteps.map((step, i) => (
                    <span key={i} className="text-[9.5px] font-mono text-muted-foreground">
                      {i > 0 && <IconArrowRight className="size-2.5 inline mr-1 text-muted-foreground/40" />}
                      {step.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Decision (default open) ─── */}
        <SectionAccordion
          title="Decision"
          category="trading"
          open={decisionOpen}
          onOpenChange={setDecisionOpen}
        >
          <div className="flex items-center gap-1 flex-wrap py-1">
            {GRAPH_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-1">
                {i > 0 && <IconArrowRight className="size-2.5 text-muted-foreground/40" />}
                <span
                  className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                    step === "Decision" ? "bg-primary/15 text-primary" : "text-muted-foreground bg-muted/40"
                  )}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
          {conditionEvents.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No conditions evaluated at this bar.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {conditionEvents.map((c) => (
                <div
                  key={c.sequence_number}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 flex items-center gap-1.5",
                    c.payload.passed
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-rose-500/20 bg-rose-500/5"
                  )}
                >
                  {c.payload.passed ? (
                    <IconCheck className="size-3 text-emerald-500 shrink-0" stroke={3} />
                  ) : (
                    <IconX className="size-3 text-rose-500 shrink-0" stroke={3} />
                  )}
                  <span className="text-[10px] font-mono truncate">{c.payload.expression}</span>
                </div>
              ))}
            </div>
          )}
          {actionEvent?.node_id && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground pt-1">
              <IconGitBranch className="size-3" />
              Triggered Node: <span className="text-foreground font-semibold">{actionEvent.node_id}</span>
              <span className="ml-auto">{new Date(actionEvent.timestamp).toLocaleTimeString(undefined, { hour12: false })}</span>
            </div>
          )}
        </SectionAccordion>

        {/* ─── Execution (default collapsed) ─── */}
        <SectionAccordion
          title="Execution"
          category="risk"
          open={executionOpen}
          onOpenChange={setExecutionOpen}
        >
          {executionSteps.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No execution activity at this bar.</p>
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
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40 text-[10px] font-mono">
            <span className="text-muted-foreground">
              Position <span className="text-foreground font-semibold">{position.side}{position.quantity != null ? ` · ${position.quantity}` : ""}</span>
            </span>
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
        </SectionAccordion>

        {/* ─── Portfolio (default collapsed) ─── */}
        <SectionAccordion
          title="Portfolio"
          category="system"
          open={portfolioOpen}
          onOpenChange={setPortfolioOpen}
        >
          {portfolio ? (
            <div className="flex flex-col gap-2">
              <BarStat label="Cash" value={portfolio.cash} max={summary?.initial_capital ? summary.initial_capital * 1.5 : portfolio.cash} />
              <BarStat label="Equity" value={portfolio.equity} max={summary?.initial_capital ? summary.initial_capital * 1.5 : portfolio.equity} />
              {/* gross_exposure is a raw dollar notional, not a fraction — the
                  percentage is notional / equity, matching the engine's own
                  gross_exposure_pct definition (portfolio/models.py). */}
              <BarStat
                label="Exposure"
                value={portfolio.equity > 0 ? (portfolio.gross_exposure / portfolio.equity) * 100 : 0}
                max={100}
                suffix="%"
              />
              <BarStat label="Drawdown" value={portfolio.drawdown * 100} max={100} suffix="%" color="#ef4444" />
              <BarStat
                label="Unrealized"
                value={portfolio.equity - portfolio.cash}
                max={Math.max(Math.abs(portfolio.equity - portfolio.cash), 1)}
                color={portfolio.equity - portfolio.cash >= 0 ? "#22c55e" : "#ef4444"}
              />
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
            <p className="text-[11px] text-muted-foreground">No portfolio snapshot at this bar.</p>
          )}
        </SectionAccordion>
      </div>
    </div>
  );
}

function SectionAccordion({
  title,
  category,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  category: ReplayColorCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="rounded-lg border border-border/50">
      <CollapsibleTrigger className="w-full flex items-center gap-2 px-3 py-2 cursor-pointer">
        <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: REPLAY_COLORS[category] }} />
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
    <div className="w-full h-7">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 1, bottom: 0, left: 1 }}>
          <defs>
            <linearGradient id="mini-equity-trail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
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

function BarStat({
  label,
  value,
  max,
  suffix = "",
  color = "#3b82f6",
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  color?: string;
}) {
  const pct = Math.max(0, Math.min(100, (Math.abs(value) / (max || 1)) * 100));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-semibold tabular-nums">
          {value >= 0 ? "" : "-"}
          {Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          {suffix}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
