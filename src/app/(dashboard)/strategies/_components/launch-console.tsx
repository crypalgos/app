"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  IconPlus,
  IconSparkles,
  IconLayout2,
  IconCpu,
  IconRocket,
  IconArrowRight,
  IconBolt,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { TEMPLATE_STRATEGIES, type TemplateStrategy } from "./types";

interface LaunchConsoleProps {
  onCreateStrategy: (type: "create" | "ai") => void;
  onDeployTemplate: (template: TemplateStrategy) => void;
  isCreating?: boolean;
}

const LAUNCH_ACTIONS = [
  {
    icon: IconPlus,
    label: "Create Strategy",
    description: "Build a trading algorithm from scratch using the visual canvas.",
    type: "create" as const,
    gradient: "from-primary/20 via-primary/10 to-transparent",
    iconBg: "bg-primary/15 border-primary/25 text-primary",
    hoverBorder: "hover:border-primary/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)]",
    badge: "Visual Builder",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
  },
  {
    icon: IconSparkles,
    label: "Generate with AI",
    description: "Describe your strategy in plain English and let the AI build it.",
    type: "ai" as const,
    gradient: "from-violet-500/20 via-violet-500/10 to-transparent",
    iconBg: "bg-violet-500/15 border-violet-500/25 text-violet-400",
    hoverBorder: "hover:border-violet-500/40 hover:shadow-[0_0_24px_rgba(139,92,246,0.12)]",
    badge: "AI Powered",
    badgeClass: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
];

export function LaunchConsole({
  onCreateStrategy,
  onDeployTemplate,
  isCreating = false,
}: LaunchConsoleProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDeploy = (template: TemplateStrategy) => {
    onDeployTemplate(template);
    setIsDialogOpen(false);
  };

  return (
    <section className="flex flex-col gap-5">
      {/* Section heading */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/40 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </div>
        <h2 className="text-[11px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
          Launch Console
        </h2>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LAUNCH_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onCreateStrategy(action.type)}
            disabled={isCreating}
            className={cn(
              "group relative flex flex-col gap-4 rounded-2xl border border-border/50 bg-card overflow-hidden p-5 transition-all duration-300 cursor-pointer text-left",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              action.hoverBorder
            )}
          >
            {/* Gradient glow top-right */}
            <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none", action.gradient)} />
            
            <div className="flex items-start justify-between">
              <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors", action.iconBg)}>
                <action.icon className="size-5" />
              </div>
              <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-wider shrink-0", action.badgeClass)}>
                {action.badge}
              </Badge>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                {action.label}
              </span>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {action.description}
              </p>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
              Get started <IconArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        ))}

        {/* Browse Templates */}
        <button
          onClick={() => setIsDialogOpen(true)}
          className={cn(
            "group relative flex flex-col gap-4 rounded-2xl border border-border/50 bg-card overflow-hidden p-5 transition-all duration-300 cursor-pointer text-left",
            "hover:border-emerald-500/40 hover:shadow-[0_0_24px_rgba(16,185,129,0.12)]"
          )}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none from-emerald-500/20 via-emerald-500/10 to-transparent bg-gradient-to-br" />

          <div className="flex items-start justify-between">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-emerald-500/15 border-emerald-500/25 text-emerald-400 transition-colors">
              <IconLayout2 className="size-5" />
            </div>
            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider shrink-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              {TEMPLATE_STRATEGIES.length} Templates
            </Badge>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-foreground leading-tight group-hover:text-emerald-400 transition-colors">
              Browse Templates
            </span>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Deploy pre-built quantitative strategies — EMA, Bollinger Bands, and more.
            </p>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground group-hover:text-emerald-400 transition-colors">
            View all <IconArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>

      {/* Templates dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent style={{ maxWidth: "1100px", width: "95%" }} className="p-6 md:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <IconCpu className="size-4 text-primary" />
              </div>
              Pre-built Trading Templates
            </DialogTitle>
            <DialogDescription>
              Instantly deploy premium quantitative frameworks to your workspace with a single click.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATE_STRATEGIES.map((temp) => (
              <div
                key={temp.name}
                className="group flex flex-col justify-between rounded-xl border border-border/60 bg-muted/20 hover:bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Color accent top strip */}
                <div className={cn(
                  "h-1 w-full",
                  temp.performance >= 0 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-rose-500 to-rose-400"
                )} />

                <div className="flex flex-col gap-3 p-4 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded-full border border-border/60 bg-muted/40">
                      {temp.type}
                    </span>
                    <span className={cn(
                      "text-xs font-bold tabular-nums",
                      temp.performance >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {temp.performance >= 0 ? "+" : ""}{temp.performance}%
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {temp.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 line-clamp-3">
                      {temp.description}
                    </p>
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 font-mono">
                    {temp.trades.toLocaleString()} historical trades
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <Button
                    size="sm"
                    onClick={() => handleDeploy(temp)}
                    className="w-full cursor-pointer gap-1.5 rounded-xl h-8 text-xs font-bold"
                  >
                    <IconRocket className="size-3.5" /> Deploy
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
