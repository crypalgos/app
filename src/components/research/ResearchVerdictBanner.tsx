"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconChevronDown, IconChevronUp, IconArrowRight, IconCheck, IconAlertTriangle } from "@tabler/icons-react";

export interface VerdictReason {
  label: string;
  value?: string;
}

export interface NextStep {
  /** Deterministic, rule-based recommendation — never AI-generated. Computed
   * from the same verdict/confidence/reasons data already on this banner. */
  action: string;
  /** "proceed" renders a check (safe to move to the next research stage),
   * "stop" renders a warning (don't proceed until the underlying issue is fixed). */
  kind: "proceed" | "stop";
  detail?: string;
}

export interface ResearchVerdictBannerProps {
  /** Short verdict headline, e.g. "Strong Candidate" / "Research Only" / "Rejected". */
  verdict: string;
  /** True = pass-styled (emerald), false = fail-styled (red), undefined = neutral (amber). */
  passed?: boolean;
  /** 0-100. Drives the qualitative label shown as the headline — the raw
   * number is secondary (shown small), since "83%" reads as more precise
   * than a heuristic confidence actually is. */
  confidence: number;
  reasons: VerdictReason[];
  nextStep?: NextStep;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

function confidenceLabel(score: number): { label: string; className: string } {
  if (score >= 85) return { label: "Excellent", className: "text-emerald-400" };
  if (score >= 70) return { label: "Good", className: "text-emerald-400" };
  if (score >= 50) return { label: "Moderate", className: "text-amber-400" };
  return { label: "Weak", className: "text-red-400" };
}

export function ResearchVerdictBanner({
  verdict,
  passed,
  confidence,
  reasons,
  nextStep,
  ctaLabel,
  onCtaClick,
}: ResearchVerdictBannerProps) {
  const [expanded, setExpanded] = useState(true);
  const { label, className } = confidenceLabel(confidence);

  const accent =
    passed === true
      ? "border-emerald-500/30 bg-emerald-500/[0.04]"
      : passed === false
      ? "border-red-500/30 bg-red-500/[0.04]"
      : "border-amber-500/30 bg-amber-500/[0.04]";

  const dot =
    passed === true ? "bg-emerald-400" : passed === false ? "bg-red-400" : "bg-amber-400";

  return (
    <div className={cn("rounded-2xl border p-5", accent)}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className={cn("size-2.5 rounded-full", dot)} />
          <div>
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-muted-foreground/70">
              Research Verdict
            </span>
            <h2 className="text-2xl font-bold text-foreground leading-tight">{verdict}</h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className={cn("text-xl font-bold leading-none", className)}>{label}</div>
            <div className="text-[11.5px] text-muted-foreground/70 mt-1">
              Confidence &middot; {confidence.toFixed(0)}%
            </div>
          </div>
          {ctaLabel && (
            <Button size="sm" onClick={onCtaClick} className="gap-1.5">
              {ctaLabel}
              <IconArrowRight className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {reasons.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Why?
            {expanded ? <IconChevronUp className="size-3.5" /> : <IconChevronDown className="size-3.5" />}
          </button>
          {expanded && (
            <ul className="mt-2.5 space-y-2">
              {reasons.map((r, i) => (
                <li key={i} className="text-[13px] text-muted-foreground flex items-baseline gap-1.5">
                  <span className="text-muted-foreground/40">&bull;</span>
                  <span>
                    {r.label}
                    {r.value != null && (
                      <span className="font-mono font-semibold text-foreground ml-1">{r.value}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {nextStep && (
        <div
          className={cn(
            "mt-4 flex items-start gap-2 rounded-lg border px-3 py-2.5",
            nextStep.kind === "proceed"
              ? "border-emerald-500/25 bg-emerald-500/[0.06]"
              : "border-amber-500/25 bg-amber-500/[0.06]"
          )}
        >
          {nextStep.kind === "proceed" ? (
            <IconCheck className="size-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <IconAlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground/70">
              Next Step
            </div>
            <div className="text-[15px] font-semibold text-foreground">{nextStep.action}</div>
            {nextStep.detail && (
              <div className="text-[13px] text-muted-foreground mt-0.5">{nextStep.detail}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
