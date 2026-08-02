// Shared trading-analysis pipeline stage: groups a flat event stream into
// per-bar trees. Used identically by backtest replay (fed a window of
// already-persisted runtime_events) and live sessions (fed the WS/timeline
// event stream) — a pure function of (sequence_number, candle_index,
// parent_sequence), agnostic to where the events came from.

import type { CandleTreeGroup, ReplayEventNode, RuntimeEvent } from "@/types/replay";

/**
 * Client-side port of crypalgos_core.pipeline.replay_tree.build_candle_trees.
 * The chunk endpoints return flat runtime_events rows (parent_sequence /
 * root_sequence, no server-side nesting) — this is the client's job,
 * mirroring the Python implementation exactly (including the "audit finding
 * #72" rule below) since it's the one place the tree shape is reconstructed.
 *
 * Pure function of (sequence_number, parent_sequence) — deterministic
 * regardless of input order, same as the source it's ported from.
 */
export function buildCandleTrees(events: RuntimeEvent[]): CandleTreeGroup[] {
  const nodes = new Map<number, ReplayEventNode>();
  const sorted = [...events].sort((a, b) => a.sequence_number - b.sequence_number);
  for (const ev of sorted) {
    if (ev.sequence_number == null) continue;
    nodes.set(ev.sequence_number, { ...ev, children: [] });
  }

  const groups = new Map<number, CandleTreeGroup>();
  const group = (candleIndex: number): CandleTreeGroup => {
    let g = groups.get(candleIndex);
    if (!g) {
      g = { candle_index: candleIndex, bar: null, events: [], orphans: [] };
      groups.set(candleIndex, g);
    }
    return g;
  };

  const seqsInOrder = Array.from(nodes.keys()).sort((a, b) => a - b);
  for (const seq of seqsInOrder) {
    const node = nodes.get(seq)!;
    const candleIndex = node.candle_index ?? 0;
    const g = group(candleIndex);

    if (node.type === "BAR_CLOSED") {
      g.bar = node;
      g.events.push(node);
      continue;
    }

    const parentSeq = node.parent_sequence;
    const parent = parentSeq != null ? nodes.get(parentSeq) : undefined;

    // Same rule as the Python source (audit finding #72): only nest into the
    // parent's children when the parent belongs to the SAME candle group —
    // otherwise it's an orphan in the child's own candle group, never
    // silently dropped or buried inside a different candle's tree.
    if (parent != null && (parent.candle_index ?? 0) === candleIndex) {
      parent.children.push(node);
    } else if (parentSeq != null) {
      g.orphans.push(node);
    } else {
      g.events.push(node);
    }
  }

  return Array.from(groups.keys())
    .sort((a, b) => a - b)
    .map((idx) => groups.get(idx)!);
}

/** Recursively flattens one candle's nested event tree (events + orphans)
 * into a flat list. Shared by the Decision Inspector, Analysis Console, and
 * chart marker logic — previously duplicated per-file. */
export function flattenCandleTree(tree: CandleTreeGroup): ReplayEventNode[] {
  const out: ReplayEventNode[] = [];
  const walk = (nodes: ReplayEventNode[]) => {
    for (const node of nodes) {
      out.push(node);
      if (node.children.length > 0) walk(node.children);
    }
  };
  walk(tree.events);
  walk(tree.orphans);
  return out;
}

/** Flattens every candle tree in a window into one flat event list, sorted
 * by sequence number. Used where a component needs events across the whole
 * loaded window, not just the current bar (e.g. chart markers). */
export function flattenAllTrees(trees: CandleTreeGroup[]): ReplayEventNode[] {
  return trees.flatMap(flattenCandleTree).sort((a, b) => a.sequence_number - b.sequence_number);
}
