"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconScale, IconActivity, IconTimeline } from "@tabler/icons-react";

export default function StrategyWalkforwardsPage() {
  return (
    <div className="grid gap-6 animate-in fade-in duration-300">
      <Card className="border-border/50 bg-card/40 backdrop-blur-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <IconScale className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Walkforward Validation</h2>
            <Badge variant="secondary" className="text-[10px] font-semibold tracking-wider bg-primary/10 text-primary border border-primary/20">
              UPCOMING
            </Badge>
          </div>
          <CardDescription>
            Validate strategy performance using rolling walkforward analysis to mitigate curve-fitting.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconTimeline className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">In-Sample Training</h3>
              <p className="text-xs text-muted-foreground">Train strategy parameters on historical data windows to find local optimums.</p>
            </div>
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconActivity className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">Out-of-Sample Test</h3>
              <p className="text-xs text-muted-foreground">Test the optimized parameters immediately on subsequent unseen forward data.</p>
            </div>
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconScale className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">Overfitting Score</h3>
              <p className="text-xs text-muted-foreground">Calculate the Walkforward Efficiency Ratio (WER) to grade real-world viability.</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/30 rounded-xl">
            <p className="text-sm font-medium text-muted-foreground">Walkforward validator engine is currently in development.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
