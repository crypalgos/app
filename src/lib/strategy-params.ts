import type { CanvasPayload, IndicatorConfig } from "@/types/strategy-builder";
import { isIndicatorNode, isActionNode } from "@/types/strategy-builder";
import type { ParameterDefinition } from "@/types/optimization";

// Mirror of crypalgos_core/compiler/registry.py INDICATOR_REGISTRY's allowed
// params. The compiler rejects any parameter outside this list, and the
// optimization engine resolves keys via the compiled PARAMETER_HASH — so the
// key format here must match ir_builder.py exactly:
//   indicator.{indicatorNode.id}.{indicatorConfig.id}.{param}
//   action.{actionNode.id}.sizing.value
const INDICATOR_PARAMS: Record<string, string[]> = {
  BB: ["period", "std"],
  ATR: ["period"],
  EMA: ["period"],
  SMA: ["period"],
  RSI: ["period"],
  MACD: ["fast_period", "slow_period", "signal_period"],
};

export interface TunableParameter {
  /** PARAMETER_HASH key the optimization engine resolves, e.g. "indicator.ind-1.rsi_ind.period" */
  key: string;
  /** Human label, e.g. "RSI(rsi_ind) · period" */
  label: string;
  /** Current value from the canvas — used to seed a sensible min/max range */
  currentValue: number;
  /** "int" for periods, "float" for std/sizing */
  type: "int" | "float";
}

function indicatorParams(nodeId: string, ind: IndicatorConfig): TunableParameter[] {
  const allowed = INDICATOR_PARAMS[ind.indicator] ?? [];
  const out: TunableParameter[] = [];
  for (const param of allowed) {
    const value = ind[param];
    if (typeof value !== "number") continue;
    out.push({
      key: `indicator.${nodeId}.${ind.id}.${param}`,
      label: `${ind.indicator}(${ind.id}) · ${param}`,
      currentValue: value,
      type: param === "std" ? "float" : "int",
    });
  }
  return out;
}

/** Derives every tunable parameter a compiled strategy exposes, straight from
 * its canvas graph. Same keys the engine's PARAMETER_HASH resolves — an
 * unknown key makes the optimization run fail with ParameterResolutionError. */
export function deriveTunableParameters(canvas: CanvasPayload | null | undefined): TunableParameter[] {
  if (!canvas?.nodes?.length) return [];
  const params: TunableParameter[] = [];

  for (const node of canvas.nodes) {
    if (isIndicatorNode(node)) {
      for (const ind of node.data.indicators ?? []) {
        params.push(...indicatorParams(node.id, ind));
      }
    } else if (isActionNode(node)) {
      const actionType = (node.data.actionType ?? "").toLowerCase();
      const sizingValue = node.data.sizing?.value;
      if (["buy", "sell", "short", "cover"].includes(actionType) && typeof sizingValue === "number") {
        params.push({
          key: `action.${node.id}.sizing.value`,
          label: `${actionType.toUpperCase()}(${node.id}) · position size`,
          currentValue: sizingValue,
          type: "float",
        });
      }
    }
  }
  return params;
}

/** Seeds a grid-search range around the canvas's current value: roughly
 * 0.5x–1.5x in 4 steps. Purely a starting point — the user edits it. */
export function defaultRangeFor(param: TunableParameter): ParameterDefinition {
  const v = param.currentValue;
  if (param.type === "int") {
    const min = Math.max(2, Math.round(v * 0.5));
    const max = Math.max(min + 2, Math.round(v * 1.5));
    const step = Math.max(1, Math.round((max - min) / 4));
    return { name: param.key, type: "int", min_val: min, max_val: max, step };
  }
  const min = Number((v * 0.5).toPrecision(3));
  const max = Number((v * 1.5).toPrecision(3));
  const step = Number(((max - min) / 4).toPrecision(3));
  return { name: param.key, type: "float", min_val: min, max_val: max, step: step || 0.1 };
}
