"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { IconCheck, IconX, IconBolt, IconListTree } from "@tabler/icons-react";
import type { CandleTreeGroup, ReplayEventNode, ConditionEvaluatedPayload } from "@/types/replay";

const TYPE_COLOR: Record<string, string> = {
  BAR_CLOSED: "border-border/50 bg-muted/20 text-muted-foreground",
  CONDITION_EVALUATED: "",
  ACTION_TRIGGERED: "border-primary/30 bg-primary/5 text-primary",
  ACTION_SKIPPED: "border-border/40 bg-muted/10 text-muted-foreground",
  ORDER_FILLED: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  ORDER_CREATED: "border-sky-500/30 bg-sky-500/5 text-sky-600 dark:text-sky-400",
  POSITION_OPENED: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  POSITION_CLOSED: "border-rose-500/30 bg-rose-500/5 text-rose-500",
  LIQUIDATION: "border-red-500/40 bg-red-500/10 text-red-500",
};

function EventNodeView({ node, depth }: { node: ReplayEventNode; depth: number }) {
  const isCondition = node.type === "CONDITION_EVALUATED";
  // node.type narrowing doesn't fully propagate through the recursive
  // ReplayEventNode intersection type, so pull the payload out explicitly
  // once we've already confirmed the discriminant matches.
  const conditionPayload = isCondition ? (node.payload as ConditionEvaluatedPayload) : null;
  const passed = conditionPayload?.passed;
  const conditionColor =
    passed === true
      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
      : passed === false
        ? "border-rose-500/20 bg-rose-500/5 text-rose-500"
        : "";
  const colorClass = isCondition ? conditionColor : (TYPE_COLOR[node.type] ?? "border-border/40 bg-muted/10");

  return (
    <div className={cn("rounded-lg border px-2.5 py-1.5", colorClass)}>
      <div className="flex items-center gap-1.5 flex-wrap">
        {isCondition ? (
          passed ? (
            <IconCheck className="size-3 shrink-0" stroke={3} />
          ) : (
            <IconX className="size-3 shrink-0" stroke={3} />
          )
        ) : (
          <IconBolt className="size-3 shrink-0 opacity-60" />
        )}
        <Badge variant="outline" className="text-[8.5px] px-1 py-0 font-mono font-bold tracking-wide">
          {node.type}
        </Badge>
        {node.node_id && (
          <span className="text-[9.5px] font-mono text-muted-foreground/70 truncate">{node.node_id}</span>
        )}
      </div>
      {conditionPayload?.expression && (
        <p className="text-[10px] font-mono mt-1 truncate opacity-90">{conditionPayload.expression}</p>
      )}
      {!isCondition && "payload" in node && node.payload && Object.keys(node.payload).length > 0 && (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
          {Object.entries(node.payload).slice(0, 4).map(([k, v]) => (
            <span key={k} className="text-[9.5px] font-mono text-muted-foreground">
              {k}: <span className="text-foreground/80">{typeof v === "number" ? v.toFixed(2) : String(v)}</span>
            </span>
          ))}
        </div>
      )}

      {node.children.length > 0 && (
        <div className="mt-1.5 pl-3 border-l border-dashed border-border/40 space-y-1.5">
          {node.children.map((child, i) => (
            <EventNodeView key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReplayDecisionPanelProps {
  tree: CandleTreeGroup | undefined;
  currentCandleIndex: number;
}

export function ReplayDecisionPanel({ tree, currentCandleIndex }: ReplayDecisionPanelProps) {
  return (
    <div className="h-full rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
        <IconListTree className="size-3.5 text-primary" />
        <h3 className="text-[12px] font-semibold text-foreground/80 tracking-wide">Decision Trace</h3>
        <span className="text-[10px] font-mono text-muted-foreground/60 ml-auto">bar {currentCandleIndex}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
        {!tree || (tree.events.length === 0 && tree.orphans.length === 0) ? (
          <p className="text-[11px] text-muted-foreground px-1">No engine events at this bar.</p>
        ) : (
          <>
            {tree.events.map((node, i) => (
              <EventNodeView key={i} node={node} depth={0} />
            ))}
            {tree.orphans.map((node, i) => (
              <EventNodeView key={`orphan-${i}`} node={node} depth={0} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
