"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  IconGitBranch,
  IconGitCommit,
  IconStarFilled,
  IconCode,
  IconPlus,
} from "@tabler/icons-react";
import type { StrategyVersion, ApiStrategy } from "@/types/strategy-actions";

interface VersionHeaderProps {
  strategy?: ApiStrategy;
  versions?: StrategyVersion[];
  onCreateSnapshot: () => void;
}

export function VersionHeader({ strategy, versions = [], onCreateSnapshot }: VersionHeaderProps) {
  const totalSnapshots = versions.length;
  const currentVersionNum = strategy?.current_version ?? 1;
  const goldenVersionObj = versions.find((v) => v.is_golden);
  const customCodeCount = versions.filter((v) => v.is_code_modified).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Top Title & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <IconGitBranch className="size-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Version History & Commits
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Track visual DAG canvas compiles, restore historical snapshots, and manage golden production candidates.
          </p>
        </div>

        <Button
          onClick={onCreateSnapshot}
          className="h-9 px-4 text-xs font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shrink-0"
        >
          <IconPlus className="size-4" />
          <span>Create Manual Snapshot</span>
        </Button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
        <div className="flex flex-col rounded-xl bg-card border border-border/50 p-3.5 min-w-0">
          <span className="text-[11px] font-medium text-muted-foreground mb-1">Current Draft</span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold font-mono text-foreground">v{currentVersionNum}</span>
            <span className="text-[10.5px] font-mono text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.2 rounded-md">
              Active Draft
            </span>
          </div>
        </div>

        <div className="flex flex-col rounded-xl bg-card border border-border/50 p-3.5 min-w-0">
          <span className="text-[11px] font-medium text-muted-foreground mb-1">Golden Version</span>
          <div className="flex items-center gap-1.5">
            {goldenVersionObj ? (
              <>
                <IconStarFilled className="size-4 text-amber-500 shrink-0" />
                <span className="text-lg font-bold font-mono text-amber-500">
                  v{goldenVersionObj.version}
                </span>
                {goldenVersionObj.label && (
                  <span className="text-[10.5px] font-mono text-muted-foreground truncate">
                    ({goldenVersionObj.label})
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm font-medium text-muted-foreground italic">None assigned</span>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-xl bg-card border border-border/50 p-3.5 min-w-0">
          <span className="text-[11px] font-medium text-muted-foreground mb-1">Total Snapshots</span>
          <span className="text-lg font-bold font-mono text-foreground">{totalSnapshots}</span>
        </div>

        <div className="flex flex-col rounded-xl bg-card border border-border/50 p-3.5 min-w-0">
          <span className="text-[11px] font-medium text-muted-foreground mb-1">Code Overrides</span>
          <span className="text-lg font-bold font-mono text-foreground">{customCodeCount}</span>
        </div>
      </div>
    </div>
  );
}
