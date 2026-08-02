"use client";

import React from "react";
import { IconArrowRight, IconBulb } from "@tabler/icons-react";

export interface SuggestedExperiment {
  current: string;
  suggestion: string;
  /** Grounded in what was actually observed in this run — never a
   * fabricated quantified prediction ("expected: -15% drawdown"). If we
   * haven't run the experiment, we don't know the outcome; we only know
   * why the suggestion follows from the data in front of us. */
  rationale: string;
}

export function SuggestedExperiments({ experiments }: { experiments: SuggestedExperiment[] }) {
  if (experiments.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h3 className="text-[15px] font-semibold text-foreground/80 tracking-wide mb-1">
          Suggested Experiments
        </h3>
        <p className="text-[13px] text-muted-foreground">
          No rule-based suggestions triggered for this run.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <IconBulb className="size-4 text-amber-400" />
        <h3 className="text-[15px] font-semibold text-foreground/80 tracking-wide">
          Suggested Experiments
        </h3>
      </div>
      <div className="space-y-3">
        {experiments.map((e, i) => (
          <div key={i} className="rounded-lg border border-border/40 bg-muted/5 p-3.5">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-muted-foreground">{e.current}</span>
              <IconArrowRight className="size-3.5 text-muted-foreground/50 shrink-0" />
              <span className="font-semibold text-foreground">{e.suggestion}</span>
            </div>
            <p className="text-[12.5px] text-muted-foreground/80 mt-1.5 leading-snug">{e.rationale}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
