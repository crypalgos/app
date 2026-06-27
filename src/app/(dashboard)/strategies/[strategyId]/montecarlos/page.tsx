"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconChartBar, IconDice, IconAlertTriangle } from "@tabler/icons-react";

export default function StrategyMontecarlosPage() {
  return (
    <div className="grid gap-6 animate-in fade-in duration-300">
      <Card className="border-border/50 bg-card/40 backdrop-blur-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <IconChartBar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Monte Carlo Risk Simulator</h2>
            <Badge variant="secondary" className="text-[10px] font-semibold tracking-wider bg-primary/10 text-primary border border-primary/20">
              UPCOMING
            </Badge>
          </div>
          <CardDescription>
            Simulate thousands of randomized trade order and equity curve variations to forecast extreme risk models.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconDice className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">Resampling Runs</h3>
              <p className="text-xs text-muted-foreground">Scramble executed trades dynamically to verify strategy resilience under varying market paths.</p>
            </div>
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconAlertTriangle className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">Ruined Probability</h3>
              <p className="text-xs text-muted-foreground">Analyze peak-to-trough drawdowns to compute exact margin call or account ruin probabilities.</p>
            </div>
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconChartBar className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">Confidence Bands</h3>
              <p className="text-xs text-muted-foreground">Generate 95% and 99% confidence level equity curves to construct worst-case bounding filters.</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/30 rounded-xl">
            <p className="text-sm font-medium text-muted-foreground">Monte Carlo engine integration is scheduled next.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
