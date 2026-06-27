"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconRocket, IconTerminal2, IconShieldCheck } from "@tabler/icons-react";

export default function StrategyDeploymentsPage() {
  return (
    <div className="grid gap-6 animate-in fade-in duration-300">
      <Card className="border-border/50 bg-card/40 backdrop-blur-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <IconRocket className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Paper & Live Deployments</h2>
            <Badge variant="secondary" className="text-[10px] font-semibold tracking-wider bg-primary/10 text-primary border border-primary/20">
              UPCOMING
            </Badge>
          </div>
          <CardDescription>
            Monitor real-time status and deploy this strategy to paper mock accounts or live brokers.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconTerminal2 className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">Deployment Logs</h3>
              <p className="text-xs text-muted-foreground">Stream live runtime messages and node validation steps directly.</p>
            </div>
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconRocket className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">Deploy Wizard</h3>
              <p className="text-xs text-muted-foreground">Select API keys, configure custom size allocation, and launch execution loops.</p>
            </div>
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconShieldCheck className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">Health Monitors</h3>
              <p className="text-xs text-muted-foreground">Active heartbeat connections monitoring latency, balance checks, and order sizes.</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/30 rounded-xl">
            <p className="text-sm font-medium text-muted-foreground">Deploy to live is disabled. Initialize via Live Trading menu to activate.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
