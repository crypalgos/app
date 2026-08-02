"use client";

import { create } from "zustand";
import type { Table } from "apache-arrow";
import { ChunkCache } from "@/lib/replay/chunk-cache";
import { LoaderQueue, type LoaderPriority } from "@/lib/replay/loader-queue";
import {
  decodeCandles,
  decodeIndicatorSnapshots,
  decodeRuntimeEvents,
  decodeTrades,
} from "@/lib/replay/decode-arrow";
import { buildCandleTrees } from "@/lib/trading/candle-tree";
import { ReplayActions } from "@/api-actions/replay-actions";
import type { PortfolioHistoryPoint } from "@/lib/replay-analysis";
import type {
  ReplaySession as ReplaySessionMeta,
  ReplayCandle,
  CandleTreeGroup,
  RuntimeEvent,
  IndicatorSnapshotRecord,
  PortfolioSnapshotEventType,
} from "@/types/replay";

const DEFAULT_CHUNK_SIZE = 1000;
// Simple synchronous LRU on insert — applies only to candles/indicators
// (the chart's local display window, safe to evict and re-fetch). Sufficient
// until there's a measured memory problem to justify async/pressure-aware
// eviction (deferred, see plan).
//
// runtime_events is deliberately NOT LRU-evicted (see evictLruIfNeeded) —
// Orders/Trades/Portfolio need the FULL cumulative history from the run's
// start up to wherever the user has seeked, not just a local window, so once
// a runtime_events chunk loads it's kept for the lifetime of the run. This
// is a real memory trade-off (a very long run backfills every runtime_events
// chunk into memory), accepted because a strategy run's event volume is
// small relative to candles/indicators — revisit if that stops holding.
const MAX_CACHED_CHUNKS = 12;

export interface ReplayPlaybackSession {
  cursor: number;
  playbackSpeed: number;
  direction: "forward" | "backward";
  status: "playing" | "paused" | "seeking";
  visibleRange: [number, number];
  selectedTradeId: string | null;
}

interface ReplayStoreState {
  runId: string | null;
  sessionMeta: ReplaySessionMeta | null;
  isSessionLoading: boolean;
  sessionError: string | null;

  candlesByChunk: ChunkCache<Table>;
  runtimeEventsByChunk: ChunkCache<Table>;
  indicatorsByChunk: ChunkCache<Table>;
  chunkLastAccessed: Map<number, number>;
  trades: Table | null;

  session: ReplayPlaybackSession;

  initRun: (runId: string) => Promise<void>;
  setCursor: (candleIndex: number) => void;
  setStatus: (status: ReplayPlaybackSession["status"]) => void;
  setPlaybackSpeed: (speed: number) => void;
  setDirection: (direction: ReplayPlaybackSession["direction"]) => void;
  setSelectedTradeId: (tradeId: string | null) => void;
  setVisibleRange: (range: [number, number]) => void;
}

// One LoaderQueue for the whole app — request() already de-dupes by
// runId+dataset+chunkId, so a stale run's in-flight fetches just resolve
// into a store that has since moved on and are ignored (see `run` check
// inside the load handlers below).
const loaderQueue = new LoaderQueue();

function chunkIdForCandle(sessionMeta: ReplaySessionMeta | null, chunkSize: number, candleIndex: number): number {
  const first = sessionMeta?.first_candle_index ?? 0;
  return Math.floor((candleIndex - first) / chunkSize);
}

function chunkCandleRange(sessionMeta: ReplaySessionMeta | null, chunkSize: number, chunkId: number): [number, number] {
  const first = sessionMeta?.first_candle_index ?? 0;
  const from = first + chunkId * chunkSize;
  return [from, from + chunkSize - 1];
}

function totalChunkCount(sessionMeta: ReplaySessionMeta, chunkSize: number): number {
  const first = sessionMeta.first_candle_index ?? 0;
  const last = sessionMeta.last_candle_index ?? first;
  return Math.floor((last - first) / chunkSize) + 1;
}

const initialSession: ReplayPlaybackSession = {
  cursor: 0,
  playbackSpeed: 1,
  direction: "forward",
  status: "paused",
  visibleRange: [0, 0],
  selectedTradeId: null,
};

export const useReplayStore = create<ReplayStoreState>()((set, get) => ({
  runId: null,
  sessionMeta: null,
  isSessionLoading: false,
  sessionError: null,

  candlesByChunk: new ChunkCache<Table>(),
  runtimeEventsByChunk: new ChunkCache<Table>(),
  indicatorsByChunk: new ChunkCache<Table>(),
  chunkLastAccessed: new Map<number, number>(),
  trades: null,

  session: initialSession,

  initRun: async (runId: string) => {
    if (get().runId === runId) return;

    loaderQueue.clear();
    set({
      runId,
      sessionMeta: null,
      isSessionLoading: true,
      sessionError: null,
      candlesByChunk: new ChunkCache<Table>(),
      runtimeEventsByChunk: new ChunkCache<Table>(),
      indicatorsByChunk: new ChunkCache<Table>(),
      chunkLastAccessed: new Map<number, number>(),
      trades: null,
      session: initialSession,
    });

    try {
      const sessionMeta = await ReplayActions.getSession(runId);
      // A newer initRun may have started (and won this race) while this
      // fetch was in flight — never let a stale response overwrite it.
      if (get().runId !== runId) return;

      const first = sessionMeta.first_candle_index ?? 0;
      const last = sessionMeta.last_candle_index ?? first;
      const chunkSize = sessionMeta.chunk_size ?? DEFAULT_CHUNK_SIZE;
      const windowSize = sessionMeta.max_window_candles ?? 500;

      set({
        sessionMeta,
        isSessionLoading: false,
        session: {
          ...initialSession,
          cursor: first,
          visibleRange: [first, Math.min(first + windowSize - 1, last)],
        },
      });

      loadTradesOnce(runId);
      const chunkId = chunkIdForCandle(sessionMeta, chunkSize, first);
      ensureChunkLoaded(runId, chunkId, "high");
      ensureChunkLoaded(runId, chunkId + 1, "low");
      // Orders/Trades/Portfolio need the FULL event history up to wherever
      // the user seeks, not just the chunks visited via sequential scrubbing
      // — background-fill every runtime_events chunk for the whole run at
      // low priority so a big jump (e.g. start -> end -> mid) still shows
      // complete history instead of gaps where chunks were never touched.
      backfillRuntimeEvents(runId, sessionMeta, chunkSize);
    } catch (err) {
      if (get().runId !== runId) return;
      set({ isSessionLoading: false, sessionError: err instanceof Error ? err.message : "Failed to load replay session" });
    }
  },

  setCursor: (candleIndex: number) => {
    const state = get();
    const { runId, sessionMeta } = state;
    if (runId == null || sessionMeta == null) return;

    const first = sessionMeta.first_candle_index ?? 0;
    const last = sessionMeta.last_candle_index ?? first;
    const clamped = Math.min(last, Math.max(first, candleIndex));
    const direction = clamped >= state.session.cursor ? "forward" : "backward";
    const chunkSize = sessionMeta.chunk_size ?? DEFAULT_CHUNK_SIZE;

    set({ session: { ...state.session, cursor: clamped, direction } });

    const chunkId = chunkIdForCandle(sessionMeta, chunkSize, clamped);
    ensureChunkLoaded(runId, chunkId, "high");
    const neighbor = direction === "forward" ? chunkId + 1 : chunkId - 1;
    if (neighbor >= 0) ensureChunkLoaded(runId, neighbor, "low");
  },

  setStatus: (status) => set((s) => ({ session: { ...s.session, status } })),
  setPlaybackSpeed: (playbackSpeed) => set((s) => ({ session: { ...s.session, playbackSpeed } })),
  setDirection: (direction) => set((s) => ({ session: { ...s.session, direction } })),
  setSelectedTradeId: (selectedTradeId) => set((s) => ({ session: { ...s.session, selectedTradeId } })),
  setVisibleRange: (visibleRange) => set((s) => ({ session: { ...s.session, visibleRange } })),
}));

function touchChunk(chunkId: number): void {
  const state = useReplayStore.getState();
  state.chunkLastAccessed.set(chunkId, Date.now());
  evictLruIfNeeded();
}

function evictLruIfNeeded(): void {
  const state = useReplayStore.getState();
  const { chunkLastAccessed, candlesByChunk, indicatorsByChunk } = state;
  const currentChunkId = state.sessionMeta
    ? chunkIdForCandle(state.sessionMeta, state.sessionMeta.chunk_size ?? DEFAULT_CHUNK_SIZE, state.session.cursor)
    : null;

  while (chunkLastAccessed.size > MAX_CACHED_CHUNKS) {
    let oldestId: number | null = null;
    let oldestTime = Infinity;
    for (const [id, time] of chunkLastAccessed) {
      if (id === currentChunkId) continue;
      if (time < oldestTime) {
        oldestTime = time;
        oldestId = id;
      }
    }
    if (oldestId == null) break;
    // runtime_events is intentionally NOT evicted here — see the
    // MAX_CACHED_CHUNKS comment. Only the chart's display-window datasets
    // (candles/indicators) are LRU-bounded.
    candlesByChunk.evict(oldestId);
    indicatorsByChunk.evict(oldestId);
    chunkLastAccessed.delete(oldestId);
  }
}

function ensureChunkLoaded(runId: string, chunkId: number, priority: LoaderPriority): void {
  const state = useReplayStore.getState();
  if (chunkId < 0) return;
  if (state.sessionMeta) {
    const chunkSize = state.sessionMeta.chunk_size ?? DEFAULT_CHUNK_SIZE;
    if (chunkId >= totalChunkCount(state.sessionMeta, chunkSize)) return;
  }
  touchChunk(chunkId);

  const datasets: Array<["candles" | "runtime_events" | "indicator_snapshots", ChunkCache<Table>]> = [
    ["candles", state.candlesByChunk],
    ["runtime_events", state.runtimeEventsByChunk],
    ["indicator_snapshots", state.indicatorsByChunk],
  ];

  for (const [dataset, cache] of datasets) {
    if (cache.has(chunkId)) continue;
    loaderQueue
      .request(runId, chunkId, dataset, priority)
      .then((result) => {
        // Ignore results for a run the store has since moved away from.
        if (useReplayStore.getState().runId !== runId) return;
        cache.put(result.chunkId, result.table);
        touchChunk(result.chunkId);
        // Bump a version-ish field so subscribers relying on plain
        // useReplayStore(selector) re-render once the chunk lands —
        // ChunkCache mutates in place, so give React a new reference to diff.
        useReplayStore.setState((s) => ({ chunkLastAccessed: new Map(s.chunkLastAccessed) }));
      })
      .catch(() => {
        // Transient fetch failure — the next setCursor/prefetch pass will
        // retry naturally since the chunk id still shows as not-cached.
      });
  }
}

let tradesLoadedForRun: string | null = null;
function loadTradesOnce(runId: string): void {
  if (tradesLoadedForRun === runId) return;
  tradesLoadedForRun = runId;
  loaderQueue
    .request(runId, 0, "trades", "high")
    .then((result) => {
      if (useReplayStore.getState().runId !== runId) return;
      useReplayStore.setState({ trades: result.table });
    })
    .catch(() => {
      tradesLoadedForRun = null;
    });
}

/** Background-fills every runtime_events chunk for the whole run, low
 * priority so it never competes with the current chunk's HIGH-priority
 * display load. Deliberately bypasses touchChunk/evictLruIfNeeded — this
 * writes straight into runtimeEventsByChunk (never evicted, see
 * MAX_CACHED_CHUNKS) and only bumps chunkLastAccessed's reference to trigger
 * a re-render, without adding entries that would count toward the
 * candles/indicators LRU cap. */
function backfillRuntimeEvents(runId: string, sessionMeta: ReplaySessionMeta, chunkSize: number): void {
  const total = totalChunkCount(sessionMeta, chunkSize);
  const cache = useReplayStore.getState().runtimeEventsByChunk;
  for (let chunkId = 0; chunkId < total; chunkId++) {
    if (cache.has(chunkId)) continue;
    loaderQueue
      .request(runId, chunkId, "runtime_events", "low")
      .then((result) => {
        if (useReplayStore.getState().runId !== runId) return;
        cache.put(result.chunkId, result.table);
        useReplayStore.setState((s) => ({ chunkLastAccessed: new Map(s.chunkLastAccessed) }));
      })
      .catch(() => {
        // Best-effort — a failed chunk just leaves a gap in cumulative
        // history until the next initRun for this run re-attempts it.
      });
  }
}

// ─── Selectors ──────────────────────────────────────────────────────────
// Plain functions over store state (not hooks) — every one decodes Arrow
// rows into a fresh array/object per call. Passing one of these directly as
// `useReplayStore(selector)` breaks React's `useSyncExternalStore` contract
// (getSnapshot must return a referentially stable value when state hasn't
// changed) — it surfaces as "Maximum update depth exceeded" / "getSnapshot
// should be cached". Always read them the same way every other component in
// this codebase does:
//   const store = useReplayStore();                 // stable identity read
//   const x = useMemo(() => selectXyz(store, arg), [store, arg]);
// `store` only changes reference when `set()` actually runs, so the useMemo
// recomputes exactly when the underlying data could have changed — never in
// a tight render loop. (The deps array must stay a literal — no spreading a
// caller-supplied array — the React Compiler rejects non-literal-length
// useMemo dep arrays.)

function chunkIdsOverlapping(
  sessionMeta: ReplaySessionMeta | null,
  chunkSize: number,
  from: number,
  to: number
): number[] {
  const first = sessionMeta?.first_candle_index ?? 0;
  const startChunk = Math.floor((from - first) / chunkSize);
  const endChunk = Math.floor((to - first) / chunkSize);
  const ids: number[] = [];
  for (let id = Math.max(0, startChunk); id <= endChunk; id++) ids.push(id);
  return ids;
}

export function selectCandlesInRange(state: ReplayStoreState, from: number, to: number): ReplayCandle[] {
  const chunkSize = state.sessionMeta?.chunk_size ?? DEFAULT_CHUNK_SIZE;
  const ids = chunkIdsOverlapping(state.sessionMeta, chunkSize, from, to);
  const out: ReplayCandle[] = [];
  for (const id of ids) {
    const table = state.candlesByChunk.get(id);
    if (!table) continue;
    for (const candle of decodeCandles(table)) {
      if (candle.candle_index >= from && candle.candle_index <= to) out.push(candle);
    }
  }
  return out.sort((a, b) => a.candle_index - b.candle_index);
}

export function selectRuntimeEventsUpTo(state: ReplayStoreState, cursor: number): RuntimeEvent[] {
  const chunkSize = state.sessionMeta?.chunk_size ?? DEFAULT_CHUNK_SIZE;
  const first = state.sessionMeta?.first_candle_index ?? 0;
  const ids = chunkIdsOverlapping(state.sessionMeta, chunkSize, first, cursor);
  const out: RuntimeEvent[] = [];
  for (const id of ids) {
    const table = state.runtimeEventsByChunk.get(id);
    if (!table) continue;
    for (const ev of decodeRuntimeEvents(table)) {
      if (ev.candle_index <= cursor) out.push(ev);
    }
  }
  return out.sort((a, b) => a.sequence_number - b.sequence_number);
}

export function selectTreeForCandle(state: ReplayStoreState, candleIndex: number): CandleTreeGroup | null {
  const chunkSize = state.sessionMeta?.chunk_size ?? DEFAULT_CHUNK_SIZE;
  const chunkId = chunkIdForCandle(state.sessionMeta, chunkSize, candleIndex);
  const table = state.runtimeEventsByChunk.get(chunkId);
  if (!table) return null;
  const events = decodeRuntimeEvents(table);
  const trees = buildCandleTrees(events);
  return trees.find((t) => t.candle_index === candleIndex) ?? null;
}

export function selectIndicatorsAtCandle(state: ReplayStoreState, candleIndex: number): IndicatorSnapshotRecord[] {
  const chunkSize = state.sessionMeta?.chunk_size ?? DEFAULT_CHUNK_SIZE;
  const chunkId = chunkIdForCandle(state.sessionMeta, chunkSize, candleIndex);
  const table = state.indicatorsByChunk.get(chunkId);
  if (!table) return [];
  return decodeIndicatorSnapshots(table).filter((s) => (s.bar_index ?? -1) === candleIndex);
}

export function selectTrades(state: ReplayStoreState): Record<string, unknown>[] {
  return state.trades ? decodeTrades(state.trades) : [];
}

export function selectChunkRange(state: ReplayStoreState, chunkId: number): [number, number] {
  const chunkSize = state.sessionMeta?.chunk_size ?? DEFAULT_CHUNK_SIZE;
  return chunkCandleRange(state.sessionMeta, chunkSize, chunkId);
}

export function selectCandleAt(state: ReplayStoreState, candleIndex: number): ReplayCandle | undefined {
  return selectCandlesInRange(state, candleIndex, candleIndex)[0];
}

/** Unlike selectRuntimeEventsUpTo (gated at `cursor`, from the run's start),
 * this walks an arbitrary [from, to] range — used for anything that needs
 * the whole visible chart window's events (chart markers), not just
 * "everything visited so far". Only returns events from currently-cached
 * chunks — a chunk evicted by LRU simply contributes nothing here, same
 * trade-off as every other selector in this file. */
export function selectRuntimeEventsInRange(state: ReplayStoreState, from: number, to: number): RuntimeEvent[] {
  const chunkSize = state.sessionMeta?.chunk_size ?? DEFAULT_CHUNK_SIZE;
  const ids = chunkIdsOverlapping(state.sessionMeta, chunkSize, from, to);
  const out: RuntimeEvent[] = [];
  for (const id of ids) {
    const table = state.runtimeEventsByChunk.get(id);
    if (!table) continue;
    for (const ev of decodeRuntimeEvents(table)) {
      if (ev.candle_index >= from && ev.candle_index <= to) out.push(ev);
    }
  }
  return out.sort((a, b) => a.sequence_number - b.sequence_number);
}

export function selectTreesInRange(state: ReplayStoreState, from: number, to: number): CandleTreeGroup[] {
  return buildCandleTrees(selectRuntimeEventsInRange(state, from, to));
}

export function selectIndicatorsInRange(
  state: ReplayStoreState,
  from: number,
  to: number
): IndicatorSnapshotRecord[] {
  const chunkSize = state.sessionMeta?.chunk_size ?? DEFAULT_CHUNK_SIZE;
  const ids = chunkIdsOverlapping(state.sessionMeta, chunkSize, from, to);
  const out: IndicatorSnapshotRecord[] = [];
  for (const id of ids) {
    const table = state.indicatorsByChunk.get(id);
    if (!table) continue;
    for (const s of decodeIndicatorSnapshots(table)) {
      const barIndex = s.bar_index ?? -1;
      if (barIndex >= from && barIndex <= to) out.push(s);
    }
  }
  return out;
}

/** One point per visited candle with a real PORTFOLIO_SNAPSHOT — the
 * live-growing equity/drawdown curve used by the Decision Inspector and the
 * Analysis Console's Portfolio tab. Deliberately skips buildCandleTrees —
 * PORTFOLIO_SNAPSHOT doesn't need parent/child nesting, just a flat scan —
 * and this runs on every autoplay tick over the run's full cumulative
 * history (see backfillRuntimeEvents), so avoiding tree assembly here
 * matters for playback smoothness. */
export function selectPortfolioHistory(state: ReplayStoreState, cursor: number): PortfolioHistoryPoint[] {
  const events = selectRuntimeEventsUpTo(state, cursor);
  const byCandle = new Map<number, PortfolioHistoryPoint>();
  for (const ev of events) {
    if (ev.type !== "PORTFOLIO_SNAPSHOT" || byCandle.has(ev.candle_index)) continue;
    const payload = (ev as PortfolioSnapshotEventType).payload;
    byCandle.set(ev.candle_index, { candleIndex: ev.candle_index, ...payload });
  }
  return Array.from(byCandle.values()).sort((a, b) => a.candleIndex - b.candleIndex);
}
