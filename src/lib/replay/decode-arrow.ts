import type { Table } from "apache-arrow";
import type { ReplayCandle, RuntimeEvent, IndicatorSnapshotRecord } from "@/types/replay";

/** Parses a value that may be a stringified JSON dict/list — mirrors the
 * backend's `ArrowReader._decode_json_columns` for columns not exploded
 * into their own typed Arrow fields (currently just `payload`). */
function maybeParseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (!value.startsWith("{") && !value.startsWith("[")) return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function rowToObject(table: Table, rowIndex: number): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const field of table.schema.fields) {
    const value = table.getChild(field.name)?.get(rowIndex);
    row[field.name] = typeof value === "bigint" ? Number(value) : value;
  }
  return row;
}

/** Memoizes a decode function per Arrow `Table` instance — a cached chunk's
 * Table reference is stable for as long as it's cached (only replaced on
 * evict+reload), so re-decoding it on every selector call during replay
 * autoplay (many ticks/sec) is pure waste. Keyed by the Table itself via
 * WeakMap so an evicted chunk's decoded rows are GC'd along with it. */
function memoizeByTable<T>(decode: (table: Table) => T): (table: Table) => T {
  const cache = new WeakMap<Table, T>();
  return (table: Table): T => {
    let decoded = cache.get(table);
    if (decoded === undefined) {
      decoded = decode(table);
      cache.set(table, decoded);
    }
    return decoded;
  };
}

/** Decodes a candles chunk table into `ReplayCandle[]` — full row
 * materialization (candles are small/flat, no benefit to staying columnar
 * past this point). */
export const decodeCandles = memoizeByTable((table: Table): ReplayCandle[] => {
  const out: ReplayCandle[] = [];
  for (let i = 0; i < table.numRows; i++) {
    out.push(rowToObject(table, i) as unknown as ReplayCandle);
  }
  return out;
});

/** Decodes a runtime_events chunk table into flat `RuntimeEvent[]` rows,
 * JSON-parsing the `payload` column back into an object per row. */
export const decodeRuntimeEvents = memoizeByTable((table: Table): RuntimeEvent[] => {
  const out: RuntimeEvent[] = [];
  for (let i = 0; i < table.numRows; i++) {
    const row = rowToObject(table, i);
    row.payload = maybeParseJson(row.payload) ?? {};
    out.push(row as unknown as RuntimeEvent);
  }
  return out;
});

/** Decodes an indicator_snapshots chunk table, parsing the `values` column
 * (per-node indicator values, stored the same JSON-string way as payload). */
export const decodeIndicatorSnapshots = memoizeByTable((table: Table): IndicatorSnapshotRecord[] => {
  const out: IndicatorSnapshotRecord[] = [];
  for (let i = 0; i < table.numRows; i++) {
    const row = rowToObject(table, i);
    row.values = maybeParseJson(row.values) ?? {};
    out.push(row as unknown as IndicatorSnapshotRecord);
  }
  return out;
});

/** Decodes a trades chunk table (whole-run, single fetch — see replay-store). */
export const decodeTrades = memoizeByTable((table: Table): Record<string, unknown>[] => {
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < table.numRows; i++) {
    out.push(rowToObject(table, i));
  }
  return out;
});
