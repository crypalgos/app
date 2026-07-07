import type { ConditionEvent, RuntimeEvent } from "@/types/replay";

// A DecisionTrace groups every event that shares a causal root — the bar
// close that kicked off one condition -> action -> order reasoning chain.
// `root_sequence` (not a "correlation_id"/"id", which don't exist on real
// events — see ADR-006/Engine v2) is the only stable key for this grouping.

export interface DecisionTrace {
  trace_id: string;
  root_sequence: number;
  timestamp: number;
  conditions: ConditionEvent[];
  triggered_action: string | null;
  outcome: "executed" | "rejected" | "skipped";
  rejection_reason: string | null;
}

function isConditionEvent(e: RuntimeEvent): e is ConditionEvent {
  return e.type === "CONDITION_EVALUATED";
}

function bucketByRootSequence(events: RuntimeEvent[]): Map<number, RuntimeEvent[]> {
  const buckets = new Map<number, RuntimeEvent[]>();
  for (const e of events) {
    const key = e.root_sequence ?? e.sequence_number;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(e);
    else buckets.set(key, [e]);
  }
  return buckets;
}

function buildTraceFromChain(rootSequence: number, chain: RuntimeEvent[]): DecisionTrace {
  const sorted = [...chain].sort((a, b) => a.sequence_number - b.sequence_number);
  const conditions = sorted.filter(isConditionEvent);
  const action = sorted.find(
    (e) =>
      e.type === "ACTION_TRIGGERED" ||
      e.type === "ACTION_REJECTED" ||
      e.type === "ACTION_SKIPPED" ||
      // Stop-loss/take-profit/trailing-stop exits are policy-driven, not
      // condition-driven — they emit POLICY_TRIGGERED instead of ACTION_*.
      e.type === "POLICY_TRIGGERED"
  );

  let outcome: DecisionTrace["outcome"] = "skipped";
  let rejectionReason: string | null = null;
  let triggeredAction: string | null = null;

  if (action) {
    const p = action.payload as {
      action_type?: string;
      action_id?: string;
      policy_type?: string;
      policy_id?: string;
      reason?: string;
    };
    if (action.type === "ACTION_TRIGGERED") {
      triggeredAction = p.action_type || p.action_id || action.type;
      outcome = "executed";
    } else if (action.type === "POLICY_TRIGGERED") {
      triggeredAction = p.policy_type || p.policy_id || action.type;
      outcome = "executed";
    } else if (action.type === "ACTION_REJECTED") {
      triggeredAction = p.action_type || p.action_id || action.type;
      outcome = "rejected";
      rejectionReason = p.reason || "Unknown reason";
    } else {
      triggeredAction = p.action_type || p.action_id || action.type;
      outcome = "skipped";
      rejectionReason = p.reason || null;
    }
  }

  const anchor = sorted[0];
  return {
    trace_id: String(rootSequence),
    root_sequence: rootSequence,
    timestamp: anchor?.timestamp ?? 0,
    conditions,
    triggered_action: triggeredAction,
    outcome,
    rejection_reason: rejectionReason,
  };
}

/** Groups the full event stream into one DecisionTrace per causal chain — O(n). */
export function groupEventsByRootSequence(events: RuntimeEvent[]): DecisionTrace[] {
  if (!events?.length) return [];
  const buckets = bucketByRootSequence(events);
  return Array.from(buckets.entries())
    .map(([rootSeq, chain]) => buildTraceFromChain(rootSeq, chain))
    .filter((t) => t.conditions.length > 0 || t.triggered_action)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export interface TraceIndex {
  bySequence: Map<number, RuntimeEvent>;
  byRootSequence: Map<number, DecisionTrace>;
}

/** Builds a lookup index once — use this instead of repeated
 * findDecisionTraceForSequence() calls in a loop (e.g. one per row in a
 * trades table), since that would be O(trades * events). */
export function buildTraceIndex(events: RuntimeEvent[]): TraceIndex {
  const bySequence = new Map<number, RuntimeEvent>();
  for (const e of events) bySequence.set(e.sequence_number, e);

  const byRootSequence = new Map<number, DecisionTrace>();
  for (const [rootSeq, chain] of bucketByRootSequence(events)) {
    byRootSequence.set(rootSeq, buildTraceFromChain(rootSeq, chain));
  }

  return { bySequence, byRootSequence };
}

/** Resolves the decision trace behind a specific event sequence (O(1) with a
 * prebuilt TraceIndex) — e.g. a trade's entry_sequence/exit_sequence pointer. */
export function resolveTraceForSequence(
  index: TraceIndex,
  sequenceNumber: number | null | undefined
): DecisionTrace | null {
  if (sequenceNumber == null) return null;
  const anchor = index.bySequence.get(sequenceNumber);
  if (!anchor) return null;
  const rootSeq = anchor.root_sequence ?? anchor.sequence_number;
  return index.byRootSequence.get(rootSeq) ?? null;
}

/** Convenience one-off lookup (builds a throwaway index). Prefer
 * buildTraceIndex()+resolveTraceForSequence() when resolving many sequences. */
export function findDecisionTraceForSequence(
  events: RuntimeEvent[],
  sequenceNumber: number | null | undefined
): DecisionTrace | null {
  if (sequenceNumber == null || !events?.length) return null;
  return resolveTraceForSequence(buildTraceIndex(events), sequenceNumber);
}
