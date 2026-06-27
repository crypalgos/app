"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconSettings, IconCpu, IconRocket } from "@tabler/icons-react";

export default function StrategyOptimizationsPage() {
  return (
    <div className="grid gap-6 animate-in fade-in duration-300">
      <Card className="border-border/50 bg-card/40 backdrop-blur-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <IconSettings className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Optimization Engine</h2>
            <Badge variant="secondary" className="text-[10px] font-semibold tracking-wider bg-primary/10 text-primary border border-primary/20">
              UPCOMING
            </Badge>
          </div>
          <CardDescription>
            Run high-performance multi-parameter optimization sweeps on your visual trading strategy.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconCpu className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">Grid Search</h3>
              <p className="text-xs text-muted-foreground">Exhaustively search through a specified subset of the strategy parameter space.</p>
            </div>
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconSettings className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">Bayesian Optimization</h3>
              <p className="text-xs text-muted-foreground">Utilize probabilistic models to find optimal parameters in fewer simulation runs.</p>
            </div>
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconRocket className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">Parallel Execution</h3>
              <p className="text-xs text-muted-foreground">Distribute backtest runs across parallel cloud threads for rapid parameter scanning.</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/30 rounded-xl">
            <p className="text-sm font-medium text-muted-foreground">Engine integration is currently in progress.</p>
            <p className="text-xs text-muted-foreground/80 mt-1">Configure your strategy parameters in the builder to prepare for parameter sweep optimization.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
