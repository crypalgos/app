import { Badge } from "@/components/ui/badge";
import { IconCheck, IconX, IconBolt } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { isEvalGroup, type EvalTreeNode } from "@/types/replay";
import type { DecisionTrace } from "@/lib/replay";

export type { DecisionTrace };

function EvalTreeView({ node }: { node: EvalTreeNode }) {
  if (isEvalGroup(node)) {
    return (
      <div
        className={cn(
          "rounded-lg border p-2 space-y-1.5",
          node.passed ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"
        )}
      >
        <div className="flex items-center gap-1.5">
          {node.passed ? (
            <IconCheck className="size-3 text-emerald-500" stroke={3} />
          ) : (
            <IconX className="size-3 text-rose-500" stroke={3} />
          )}
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] py-0 px-1.5 uppercase font-bold tracking-wider",
              node.passed
                ? "border-emerald-500/20 text-emerald-600 bg-emerald-500/10"
                : "border-rose-500/20 text-rose-600 bg-rose-500/10"
            )}
          >
            {node.operator}
          </Badge>
        </div>
        <div className="pl-3 border-l border-dashed border-border/50 space-y-1.5">
          {node.children.map((child, idx) => (
            <EvalTreeView key={idx} node={child} />
          ))}
        </div>
      </div>
    );
  }

  // Leaf node — either a real comparison (left/right operands) or the
  // degenerate single-node fallback hand-written strategies get ({operator:
  // null, name, passed} — never absent, per ADR-008).
  const isComparison = node.left !== undefined;
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded p-1.5 text-[10px] font-mono",
        node.passed ? "bg-emerald-500/5" : "bg-rose-500/5"
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {node.passed ? (
          <IconCheck className="size-2.5 text-emerald-500 shrink-0" stroke={4} />
        ) : (
          <IconX className="size-2.5 text-rose-500 shrink-0" stroke={4} />
        )}
        <span className="truncate text-foreground/80">
          {isComparison ? `${node.left!.name} ${node.operator ?? ""} ${node.right?.name ?? ""}` : node.name}
        </span>
      </div>
      {isComparison && (
        <span className="text-muted-foreground shrink-0">
          {JSON.stringify(node.left!.value)} {node.operator} {JSON.stringify(node.right?.value)}
        </span>
      )}
    </div>
  );
}

interface DecisionTraceTimelineProps {
  trace: DecisionTrace | null | undefined;
}

export function DecisionTraceTimeline({ trace }: DecisionTraceTimelineProps) {
  if (!trace || (!trace.conditions?.length && !trace.triggered_action)) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/20 rounded-xl border border-dashed border-border/50 text-center">
        No decision trace data available for this event.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60 mt-4">
      {trace.conditions.map((cond, idx) => (
        <div key={`${cond.node_id ?? cond.payload.condition_id}-${idx}`} className="relative">
          <div
            className={cn(
              "absolute -left-[22px] top-1.5 size-3.5 rounded-full border-2 border-background flex items-center justify-center",
              cond.payload.passed ? "bg-emerald-500" : "bg-rose-500"
            )}
          >
            {cond.payload.passed ? (
              <IconCheck className="size-2 text-white" stroke={4} />
            ) : (
              <IconX className="size-2 text-white" stroke={4} />
            )}
          </div>

          <div className="bg-card border border-border/50 rounded-lg p-3 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-foreground/80 truncate">
                {cond.payload.condition_id}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] py-0 px-1.5 uppercase font-bold tracking-wider shrink-0",
                  cond.payload.passed
                    ? "border-emerald-500/20 text-emerald-600 bg-emerald-500/10"
                    : "border-rose-500/20 text-rose-600 bg-rose-500/10"
                )}
              >
                {cond.payload.passed ? "Passed" : "Failed"}
              </Badge>
            </div>

            {cond.payload.expression && (
              <div className="text-[10px] font-mono text-muted-foreground/80 truncate">
                {cond.payload.expression}
              </div>
            )}

            <EvalTreeView node={cond.payload.evaluation} />
          </div>
        </div>
      ))}

      {trace.triggered_action && (
        <div className="relative">
          <div className="absolute -left-[22px] top-1.5 size-3.5 rounded-full bg-indigo-500 border-2 border-background flex items-center justify-center">
            <IconBolt className="size-2.5 text-white" stroke={3} />
          </div>
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Action Triggered</span>
              <Badge variant="default" className="bg-indigo-500 hover:bg-indigo-600 text-[10px] py-0 uppercase">
                {trace.triggered_action}
              </Badge>
            </div>
            {trace.outcome !== "executed" && trace.rejection_reason && (
              <div className="text-[10px] text-muted-foreground mt-1.5">{trace.rejection_reason}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
