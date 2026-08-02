/**
 * Small storage primitive wrapping `Map<chunkId, T>` — get/put/evict, one per
 * dataset (candles, runtime_events, indicator_snapshots). Deliberately dumb:
 * it holds no eviction policy of its own. The replay store owns a single
 * `chunkLastAccessed` recency map shared across every `ChunkCache` instance,
 * so a chunk id is loaded/evicted as one unit across all datasets even
 * though each dataset's rows live in its own cache. Wrapping the bare `Map`
 * (instead of using one directly) is what future work — memory limits,
 * metrics, persistence — hooks into without touching the engine.
 */
export class ChunkCache<T> {
  private readonly store = new Map<number, T>();

  get(chunkId: number): T | undefined {
    return this.store.get(chunkId);
  }

  has(chunkId: number): boolean {
    return this.store.has(chunkId);
  }

  put(chunkId: number, value: T): void {
    this.store.set(chunkId, value);
  }

  evict(chunkId: number): void {
    this.store.delete(chunkId);
  }

  keys(): number[] {
    return Array.from(this.store.keys());
  }

  get size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}
