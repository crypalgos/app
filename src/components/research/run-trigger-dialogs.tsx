"use client";

import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { IconFlask, IconPlayerPlay } from "@tabler/icons-react";

import { useStrategy, useStrategyBacktests, useTriggerMonteCarlo, useTriggerOptimization, useTriggerWalkForward } from "@/api-actions/hooks/strategy-hooks";
import { deriveTunableParameters, defaultRangeFor, type TunableParameter } from "@/lib/strategy-params";
import type { ParameterDefinition, OptimizationRequest } from "@/types/optimization";
import type { WalkForwardRequest } from "@/types/walkforward";
import type { MonteCarloRequest } from "@/types/montecarlo";

// ─── Shared bits ──────────────────────────────────────────────────────────────

const OBJECTIVES = [
  "sharpe_ratio",
  "net_profit",
  "sortino_ratio",
  "calmar_ratio",
  "profit_factor",
  "max_drawdown",
  "win_rate",
  "expectancy",
  "recovery_factor",
] as const;

type Objective = OptimizationRequest["objective"];

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function DateRangeFields({
  startDate,
  endDate,
  onStart,
  onEnd,
}: {
  startDate: string;
  endDate: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Start date</Label>
        <Input type="date" value={startDate} onChange={(e) => onStart(e.target.value)} className="h-9" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">End date</Label>
        <Input type="date" value={endDate} onChange={(e) => onEnd(e.target.value)} className="h-9" />
      </div>
    </div>
  );
}

function ObjectiveSelect({ value, onChange }: { value: Objective; onChange: (v: Objective) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">Objective</Label>
      <Select value={value} onValueChange={(v) => onChange(v as Objective)}>
        <SelectTrigger className="h-9 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OBJECTIVES.map((o) => (
            <SelectItem key={o} value={o}>
              {o.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Parameter space editor ───────────────────────────────────────────────────

interface ParamRow {
  param: TunableParameter;
  enabled: boolean;
  def: ParameterDefinition;
}

function useParamRows(strategyId: string): [ParamRow[], React.Dispatch<React.SetStateAction<ParamRow[]>>, boolean] {
  const { data: strategy, isLoading } = useStrategy(strategyId);
  const derived = useMemo(() => deriveTunableParameters(strategy?.canvas_json), [strategy?.canvas_json]);
  const [rows, setRows] = useState<ParamRow[]>([]);

  // Re-seed rows when the canvas-derived list changes (strategy loads/changes).
  const derivedKey = derived.map((p) => p.key).join("|");
  const [seededFor, setSeededFor] = useState("");
  if (derivedKey !== seededFor) {
    setSeededFor(derivedKey);
    setRows(
      derived.map((param, i) => ({
        param,
        enabled: i === 0, // first param on by default so the form is instantly valid
        def: defaultRangeFor(param),
      }))
    );
  }
  return [rows, setRows, isLoading];
}

function ParameterSpaceEditor({ rows, setRows }: { rows: ParamRow[]; setRows: React.Dispatch<React.SetStateAction<ParamRow[]>> }) {
  const update = (idx: number, patch: Partial<ParamRow["def"]> | { enabled: boolean }) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        if ("enabled" in patch) return { ...r, enabled: patch.enabled };
        return { ...r, def: { ...r.def, ...patch } };
      })
    );
  };

  if (rows.length === 0) {
    return (
      <div className="text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg p-4 text-center">
        No tunable parameters found in this strategy&apos;s canvas. Add indicators with numeric
        parameters (period, std) in the builder first.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">Parameter space</Label>
      <div className="border border-border/60 rounded-lg divide-y divide-border/40 max-h-[220px] overflow-y-auto">
        {rows.map((row, idx) => (
          <div key={row.param.key} className="flex items-center gap-3 px-3 py-2">
            <Checkbox
              checked={row.enabled}
              onCheckedChange={(checked) => update(idx, { enabled: checked === true })}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{row.param.label}</div>
              <div className="text-[10px] text-muted-foreground font-mono truncate">
                current: {row.param.currentValue}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {(["min_val", "max_val", "step"] as const).map((field) => (
                <Input
                  key={field}
                  type="number"
                  step="any"
                  disabled={!row.enabled}
                  value={row.def[field] ?? ""}
                  onChange={(e) => update(idx, { [field]: e.target.value === "" ? undefined : Number(e.target.value) })}
                  placeholder={field.replace("_val", "")}
                  className="h-8 w-[72px] text-xs font-mono"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">min / max / step per enabled parameter</p>
    </div>
  );
}

function enabledDefinitions(rows: ParamRow[]): ParameterDefinition[] {
  return rows.filter((r) => r.enabled).map((r) => r.def);
}

function validateParamRows(rows: ParamRow[]): string | null {
  const enabled = rows.filter((r) => r.enabled);
  if (enabled.length === 0) return "Enable at least one parameter to optimize.";
  for (const r of enabled) {
    const { min_val, max_val, step } = r.def;
    if (min_val == null || max_val == null || step == null) return `${r.param.label}: min, max and step are required.`;
    if (min_val >= max_val) return `${r.param.label}: min must be below max.`;
    if (step <= 0) return `${r.param.label}: step must be positive.`;
  }
  return null;
}

// ─── Optimization ─────────────────────────────────────────────────────────────

export function OptimizationTriggerDialog({ strategyId, onTriggered }: { strategyId: string; onTriggered?: () => void }) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(isoDate(180));
  const [endDate, setEndDate] = useState(isoDate(0));
  const [objective, setObjective] = useState<Objective>("sharpe_ratio");
  const [searchType, setSearchType] = useState<"grid" | "random">("grid");
  const [maxRuns, setMaxRuns] = useState(200);
  const [initialCapital, setInitialCapital] = useState(10000);
  const [rows, setRows] = useParamRows(strategyId);

  const { mutateAsync: trigger, isPending } = useTriggerOptimization(strategyId);

  const handleSubmit = async () => {
    const error = validateParamRows(rows);
    if (error) {
      toast.error(error);
      return;
    }
    const payload: OptimizationRequest = {
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      parameter_space: enabledDefinitions(rows),
      objective,
      search_type: searchType,
      max_runs: maxRuns,
      initial_capital: initialCapital,
    };
    try {
      await trigger(payload);
      toast.success("Optimization run enqueued.");
      setOpen(false);
      onTriggered?.();
    } catch {
      toast.error("Failed to enqueue optimization run.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 font-semibold cursor-pointer">
          <IconPlayerPlay className="size-4" />
          New Optimization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Run Parameter Optimization</DialogTitle>
          <DialogDescription>
            Grid or random search over your strategy&apos;s indicator parameters.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <DateRangeFields startDate={startDate} endDate={endDate} onStart={setStartDate} onEnd={setEndDate} />
          <div className="grid grid-cols-3 gap-3">
            <ObjectiveSelect value={objective} onChange={setObjective} />
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Search</Label>
              <Select value={searchType} onValueChange={(v) => setSearchType(v as "grid" | "random")}>
                <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">grid</SelectItem>
                  <SelectItem value="random">random</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Max runs</Label>
              <Input type="number" min={1} max={5000} value={maxRuns} onChange={(e) => setMaxRuns(Number(e.target.value))} className="h-9" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Initial capital (USD)</Label>
            <Input type="number" min={100} value={initialCapital} onChange={(e) => setInitialCapital(Number(e.target.value))} className="h-9 w-[200px]" />
          </div>
          <ParameterSpaceEditor rows={rows} setRows={setRows} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="cursor-pointer gap-2">
            {isPending ? "Enqueuing…" : "Run Optimization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Walk-forward ─────────────────────────────────────────────────────────────

export function WalkForwardTriggerDialog({ strategyId, onTriggered }: { strategyId: string; onTriggered?: () => void }) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(isoDate(365));
  const [endDate, setEndDate] = useState(isoDate(0));
  const [objective, setObjective] = useState<Objective>("sharpe_ratio");
  const [trainMonths, setTrainMonths] = useState(6);
  const [testMonths, setTestMonths] = useState(2);
  const [stepMonths, setStepMonths] = useState(2);
  const [windowType, setWindowType] = useState<"rolling" | "expanding">("rolling");
  const [initialCapital, setInitialCapital] = useState(10000);
  const [rows, setRows] = useParamRows(strategyId);

  const { mutateAsync: trigger, isPending } = useTriggerWalkForward(strategyId);

  const handleSubmit = async () => {
    const error = validateParamRows(rows);
    if (error) {
      toast.error(error);
      return;
    }
    const payload: WalkForwardRequest = {
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      train_period_months: trainMonths,
      test_period_months: testMonths,
      step_months: stepMonths,
      objective,
      parameter_space: enabledDefinitions(rows),
      initial_capital: initialCapital,
      window_type: windowType,
    };
    try {
      await trigger(payload);
      toast.success("Walk-forward run enqueued.");
      setOpen(false);
      onTriggered?.();
    } catch {
      toast.error("Failed to enqueue walk-forward run.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 font-semibold cursor-pointer">
          <IconPlayerPlay className="size-4" />
          New Walk-Forward
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Run Walk-Forward Validation</DialogTitle>
          <DialogDescription>
            Rolling train/validate windows that measure how optimized parameters generalize out-of-sample.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <DateRangeFields startDate={startDate} endDate={endDate} onStart={setStartDate} onEnd={setEndDate} />
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Train (mo)</Label>
              <Input type="number" min={1} max={60} value={trainMonths} onChange={(e) => setTrainMonths(Number(e.target.value))} className="h-9" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Validate (mo)</Label>
              <Input type="number" min={1} max={24} value={testMonths} onChange={(e) => setTestMonths(Number(e.target.value))} className="h-9" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Step (mo)</Label>
              <Input type="number" min={1} max={12} value={stepMonths} onChange={(e) => setStepMonths(Number(e.target.value))} className="h-9" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Window</Label>
              <Select value={windowType} onValueChange={(v) => setWindowType(v as "rolling" | "expanding")}>
                <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rolling">rolling</SelectItem>
                  <SelectItem value="expanding">expanding</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ObjectiveSelect value={objective} onChange={setObjective} />
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Initial capital (USD)</Label>
              <Input type="number" min={100} value={initialCapital} onChange={(e) => setInitialCapital(Number(e.target.value))} className="h-9" />
            </div>
          </div>
          <ParameterSpaceEditor rows={rows} setRows={setRows} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="cursor-pointer gap-2">
            {isPending ? "Enqueuing…" : "Run Walk-Forward"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Monte Carlo ──────────────────────────────────────────────────────────────

const MC_METHODS: MonteCarloRequest["method"][] = [
  "BOOTSTRAP",
  "TRADE_SHUFFLE",
  "RETURN_PERTURBATION",
  "BLOCK_BOOTSTRAP",
];

export function MonteCarloTriggerDialog({ strategyId, onTriggered }: { strategyId: string; onTriggered?: () => void }) {
  const [open, setOpen] = useState(false);
  const [sourceBacktestId, setSourceBacktestId] = useState("");
  const [simulationCount, setSimulationCount] = useState(1000);
  const [method, setMethod] = useState<MonteCarloRequest["method"]>("BOOTSTRAP");
  const [seed, setSeed] = useState<string>("42");

  // Monte Carlo perturbs a completed backtest's trades — needs a source run.
  const { data: backtests } = useStrategyBacktests(open ? strategyId : null, 1, 50);
  const completed = (backtests?.runs ?? []).filter((r) => r.status === "COMPLETED");

  const { mutateAsync: trigger, isPending } = useTriggerMonteCarlo(strategyId);

  const handleSubmit = async () => {
    if (!sourceBacktestId) {
      toast.error("Select a completed backtest to perturb.");
      return;
    }
    const payload: MonteCarloRequest = {
      source_backtest_id: sourceBacktestId,
      simulation_count: simulationCount,
      method,
      ...(seed.trim() === "" ? {} : { random_seed: Number(seed) }),
    };
    try {
      await trigger(payload);
      toast.success("Monte Carlo run enqueued.");
      setOpen(false);
      onTriggered?.();
    } catch {
      toast.error("Failed to enqueue Monte Carlo run.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 font-semibold cursor-pointer">
          <IconFlask className="size-4" />
          New Monte Carlo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Run Monte Carlo Simulation</DialogTitle>
          <DialogDescription>
            Perturbs a completed backtest&apos;s trade sequence to measure robustness. Needs at least 30 trades.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Source backtest</Label>
            <Select value={sourceBacktestId} onValueChange={setSourceBacktestId}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Select a completed backtest…" />
              </SelectTrigger>
              <SelectContent>
                {completed.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No completed backtests yet.</div>
                )}
                {completed.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className="flex items-center gap-2">
                      {r.name}
                      <Badge variant="outline" className="text-[9px] font-mono">
                        {(r.summary_json as { trade_count?: number } | null)?.trade_count ?? "?"} trades
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5 col-span-1">
              <Label className="text-xs">Simulations</Label>
              <Input type="number" min={100} max={100000} value={simulationCount} onChange={(e) => setSimulationCount(Number(e.target.value))} className="h-9" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as MonteCarloRequest["method"])}>
                <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MC_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m.replace(/_/g, " ").toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Seed</Label>
              <Input type="number" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="random" className="h-9" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || !sourceBacktestId} className="cursor-pointer gap-2">
            {isPending ? "Enqueuing…" : "Run Monte Carlo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
