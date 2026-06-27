"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconGitBranch, IconGitCommit, IconGitMerge } from "@tabler/icons-react";

export default function StrategyVersionsPage() {
  return (
    <div className="grid gap-6 animate-in fade-in duration-300">
      <Card className="border-border/50 bg-card/40 backdrop-blur-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <IconGitBranch className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Version Control</h2>
            <Badge variant="secondary" className="text-[10px] font-semibold tracking-wider bg-primary/10 text-primary border border-primary/20">
              UPCOMING
            </Badge>
          </div>
          <CardDescription>
            Track edits, commit changes, and compare historical visual node structures of your trading strategy.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconGitCommit className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">Commit History</h3>
              <p className="text-xs text-muted-foreground">Restore prior strategy compiles and track visual edits chronologically.</p>
            </div>
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconGitBranch className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">Branching Layouts</h3>
              <p className="text-xs text-muted-foreground">Branch off configurations to test independent trade entry or exit criteria safely.</p>
            </div>
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconGitMerge className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">Difference Engine</h3>
              <p className="text-xs text-muted-foreground">Compare nodes, parameter settings, and compiled code differences side-by-side.</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/30 rounded-xl">
            <p className="text-sm font-medium text-muted-foreground">Version tracking is currently active as local cache only.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
