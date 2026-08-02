import { tableFromIPC, type Table } from "apache-arrow";
import { getCookie } from "cookies-next";
import { BACKEND_URL } from "@/constants";

export type ReplayDatasetName =
  | "candles"
  | "runtime_events"
  | "indicator_snapshots"
  | "decision_traces"
  | "trades";

export type LoaderPriority = "high" | "low";

export interface ChunkLoadResult {
  chunkId: number;
  dataset: ReplayDatasetName;
  table: Table;
}

interface QueueEntry {
  runId: string;
  chunkId: number;
  dataset: ReplayDatasetName;
  priority: LoaderPriority;
  resolve: (result: ChunkLoadResult) => void;
  reject: (err: unknown) => void;
}

const MAX_CONCURRENT = 2;

function chunkUrl(runId: string, dataset: ReplayDatasetName, chunkId: number): string {
  return `${BACKEND_URL}/research-runs/${runId}/replay/chunks/${dataset}/${chunkId}`;
}

/**
 * Owns every replay chunk fetch. A small priority queue with a concurrency
 * cap and in-flight de-dupe (keyed by run+dataset+chunk), so rapid scrubbing
 * never fires duplicate requests for the same binary. Nothing outside the
 * replay store talks to this directly — the store calls `request()` per
 * (chunk, dataset) it needs and awaits the result.
 */
export class LoaderQueue {
  private queue: QueueEntry[] = [];
  private readonly inFlight = new Map<string, Promise<ChunkLoadResult>>();
  private active = 0;

  private key(runId: string, dataset: ReplayDatasetName, chunkId: number): string {
    return `${runId}:${dataset}:${chunkId}`;
  }

  /** Enqueue a (chunk, dataset) fetch. Returns the same in-flight promise if
   * one is already running or queued for this exact key — callers never
   * need to de-dupe themselves. */
  request(
    runId: string,
    chunkId: number,
    dataset: ReplayDatasetName,
    priority: LoaderPriority
  ): Promise<ChunkLoadResult> {
    const key = this.key(runId, dataset, chunkId);
    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const promise = new Promise<ChunkLoadResult>((resolve, reject) => {
      const entry: QueueEntry = { runId, chunkId, dataset, priority, resolve, reject };
      if (priority === "high") {
        // HIGH-priority requests jump ahead of every currently-queued LOW one.
        const firstLowIdx = this.queue.findIndex((q) => q.priority === "low");
        if (firstLowIdx === -1) this.queue.push(entry);
        else this.queue.splice(firstLowIdx, 0, entry);
      } else {
        this.queue.push(entry);
      }
    });

    this.inFlight.set(key, promise);
    void promise.finally(() => this.inFlight.delete(key));
    this.drain();
    return promise;
  }

  /** Drop every still-queued (not yet started) request — called when the
   * replay session resets (runId changes) so a stale run's chunks never
   * land after the fact. */
  clear(): void {
    for (const entry of this.queue) {
      entry.reject(new Error("LoaderQueue cleared"));
    }
    this.queue = [];
  }

  private drain(): void {
    while (this.active < MAX_CONCURRENT && this.queue.length > 0) {
      const entry = this.queue.shift();
      if (!entry) break;
      this.active++;
      void this.run(entry).finally(() => {
        this.active--;
        this.drain();
      });
    }
  }

  private async run(entry: QueueEntry): Promise<void> {
    try {
      const token = getCookie("token");
      const res = await fetch(chunkUrl(entry.runId, entry.dataset, entry.chunkId), {
        // Chunks are immutable (Cache-Control: immutable on the response) —
        // trust the browser's own HTTP cache across page reloads, not just
        // the in-memory store.
        cache: "force-cache",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        throw new Error(`Chunk fetch failed: ${entry.dataset}#${entry.chunkId} (${res.status})`);
      }
      const buf = await res.arrayBuffer();
      const table = tableFromIPC(new Uint8Array(buf));
      entry.resolve({ chunkId: entry.chunkId, dataset: entry.dataset, table });
    } catch (err) {
      entry.reject(err);
    }
  }
}
