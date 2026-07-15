"use client";

import { cn } from "@/lib/utils";
import {
  IconWebhook,
  IconBrandDiscord,
  IconBrandTelegram,
  IconBrandSlack,
  IconLink,
  IconArrowUpRight,
  IconCircleDot,
} from "@tabler/icons-react";

interface IntegrationItem {
  name: string;
  category: "exchanges" | "triggers" | "alerts";
  status: "Supported" | "Beta" | "Soon";
  icon?: any;
}

const integrations: IntegrationItem[] = [
  // Exchanges
  { name: "Binance", category: "exchanges", status: "Supported" },
  { name: "Coinbase Advanced", category: "exchanges", status: "Supported" },
  { name: "Bybit", category: "exchanges", status: "Supported" },
  { name: "OKX", category: "exchanges", status: "Beta" },
  { name: "dYdX", category: "exchanges", status: "Soon" },
  
  // Triggers
  { name: "TradingView Webhooks", category: "triggers", status: "Supported", icon: IconWebhook },
  { name: "REST API Endpoint", category: "triggers", status: "Supported", icon: IconLink },
  { name: "WebSocket Feed", category: "triggers", status: "Beta", icon: IconCircleDot },
  
  // Alerts
  { name: "Discord Notifications", category: "alerts", status: "Supported", icon: IconBrandDiscord },
  { name: "Telegram Bot Alert", category: "alerts", status: "Supported", icon: IconBrandTelegram },
  { name: "Slack Webhooks", category: "alerts", status: "Beta", icon: IconBrandSlack },
];

export default function IntegrationsSection() {
  return (
    <section className="bg-background py-16 md:py-24 relative overflow-hidden border-b border-border/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="mb-12 md:mb-16 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50 text-xs font-semibold text-primary mb-5 tracking-wide uppercase">
            Connectivity
          </div>
          <h2 className="text-3xl md:text-5xl font-medium tracking-tighter leading-[1.1] mb-5">
            Connect your sources.
            <br />
            <span className="text-primary">Automate your execution.</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg font-light leading-relaxed max-w-xl mx-auto">
            Plug your strategies directly into major liquidity hubs, notification services, and alert feeds.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: Exchange Connections */}
          <div className="bg-card/40 border border-border/60 rounded-2xl p-6 flex flex-col justify-between hover:border-border/80 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold tracking-tight text-foreground">Liquidity Pools</h3>
                <span className="text-[10px] font-mono text-muted-foreground uppercase bg-muted/50 px-2 py-0.5 rounded">Exchanges</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Direct API connections to execute orders instantly on spot and derivative platforms.
              </p>
              
              <div className="flex flex-col gap-2">
                {integrations.filter(i => i.category === "exchanges").map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/30 hover:border-primary/20 transition-all duration-200"
                  >
                    <span className="text-xs font-semibold text-foreground">{item.name}</span>
                    <span className={cn(
                      "text-[9px] font-semibold px-2 py-0.5 rounded-full",
                      item.status === "Supported" && "bg-success/10 text-success",
                      item.status === "Beta" && "bg-warning/10 text-warning",
                      item.status === "Soon" && "bg-muted text-muted-foreground"
                    )}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border/20 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors group cursor-pointer">
              <span>View API Documentation</span>
              <IconArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Column 2: Inputs & Signals */}
          <div className="bg-card/40 border border-border/60 rounded-2xl p-6 flex flex-col justify-between hover:border-border/80 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold tracking-tight text-foreground">Signals &amp; Feeds</h3>
                <span className="text-[10px] font-mono text-muted-foreground uppercase bg-muted/50 px-2 py-0.5 rounded">Triggers</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Ingest webhook signals or real-time event triggers to execute your algorithmic decisions.
              </p>
              
              <div className="flex flex-col gap-2">
                {integrations.filter(i => i.category === "triggers").map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/30 hover:border-primary/20 transition-all duration-200"
                    >
                      <div className="flex items-center gap-2.5">
                        {Icon && <Icon className="size-4 text-primary shrink-0" />}
                        <span className="text-xs font-semibold text-foreground">{item.name}</span>
                      </div>
                      <span className={cn(
                        "text-[9px] font-semibold px-2 py-0.5 rounded-full",
                        item.status === "Supported" && "bg-emerald-500/10 text-emerald-500",
                        item.status === "Beta" && "bg-amber-500/10 text-amber-500",
                        item.status === "Soon" && "bg-muted text-muted-foreground"
                      )}>
                        {item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/20 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors group cursor-pointer">
              <span>Setup webhook listener</span>
              <IconArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Column 3: Alerts & Logging */}
          <div className="bg-card/40 border border-border/60 rounded-2xl p-6 flex flex-col justify-between hover:border-border/80 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold tracking-tight text-foreground">Alert channels</h3>
                <span className="text-[10px] font-mono text-muted-foreground uppercase bg-muted/50 px-2 py-0.5 rounded">Alerts</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Receive instant status updates, trade logs, and risk alerts directly in your channels.
              </p>
              
              <div className="flex flex-col gap-2">
                {integrations.filter(i => i.category === "alerts").map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/30 hover:border-primary/20 transition-all duration-200"
                    >
                      <div className="flex items-center gap-2.5">
                        {Icon && <Icon className="size-4 text-primary shrink-0" />}
                        <span className="text-xs font-semibold text-foreground">{item.name}</span>
                      </div>
                      <span className={cn(
                        "text-[9px] font-semibold px-2 py-0.5 rounded-full",
                        item.status === "Supported" && "bg-emerald-500/10 text-emerald-500",
                        item.status === "Beta" && "bg-amber-500/10 text-amber-500",
                        item.status === "Soon" && "bg-muted text-muted-foreground"
                      )}>
                        {item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/20 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors group cursor-pointer">
              <span>Configure notifications</span>
              <IconArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
