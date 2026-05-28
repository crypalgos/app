"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  IconPlus,
  IconSparkles,
  IconLayout2,
  IconCpu,
  IconRocket,
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
    shortLabel: "Create",
    type: "create" as const,
    description: "Build a new trading algorithm from scratch.",
    accentClass:
      "text-primary bg-primary/8 border-primary/15 group-hover:bg-primary/14 group-hover:border-primary/30",
  },
  {
    icon: IconSparkles,
    label: "Generate with AI",
    shortLabel: "AI Gen",
    type: "ai" as const,
    description: "Describe your strategy and let AI build it.",
    accentClass:
      "text-chart-3 bg-chart-3/8 border-chart-3/15 group-hover:bg-chart-3/14 group-hover:border-chart-3/30",
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
    <section className="flex flex-col gap-4">
      {/* Section heading */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/40 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </div>
        <h2 className="text-[11px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
          Launch Console
        </h2>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-3 gap-3">
        {LAUNCH_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onCreateStrategy(action.type)}
            disabled={isCreating}
            className="group relative flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-4 md:p-5 transition-all hover:border-primary/20 hover:shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div
              className={cn(
                "flex size-10 md:size-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
                action.accentClass
              )}
            >
              <action.icon className="size-5" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-[12px] md:text-sm font-semibold text-foreground leading-tight">
                <span className="block md:hidden">{action.shortLabel}</span>
                <span className="hidden md:block">{action.label}</span>
              </span>
              <p className="hidden md:block text-[11px] text-muted-foreground leading-snug max-w-[200px]">
                {action.description}
              </p>
            </div>
          </button>
        ))}

        {/* Browse Templates — opens dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="group relative flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-4 md:p-5 transition-all hover:border-primary/20 hover:shadow-sm cursor-pointer">
              <div className="flex size-10 md:size-11 shrink-0 items-center justify-center rounded-xl border text-chart-1 bg-chart-1/8 border-chart-1/15 group-hover:bg-chart-1/14 group-hover:border-chart-1/30 transition-colors">
                <IconLayout2 className="size-5" />
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-[12px] md:text-sm font-semibold text-foreground leading-tight">
                  <span className="block md:hidden">Templates</span>
                  <span className="hidden md:block">Browse Templates</span>
                </span>
                <p className="hidden md:block text-[11px] text-muted-foreground leading-snug max-w-[200px]">
                  Start with pre-built strategies like MA Cross.
                </p>
              </div>
            </button>
          </DialogTrigger>

          <DialogContent
            style={{ maxWidth: "1100px", width: "95%" }}
            className="p-6 md:p-10"
          >
            <DialogHeader className="mb-6">
              <DialogTitle className="flex items-center gap-2.5">
                <IconCpu data-icon="inline-start" />
                Pre-built Trading Templates
              </DialogTitle>
              <DialogDescription>
                Instantly deploy premium quantitative frameworks to your
                workspace with a single click.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TEMPLATE_STRATEGIES.map((temp) => (
                <Card
                  key={temp.name}
                  className="group flex flex-col justify-between hover:border-primary/20 transition-all"
                >
                  <CardHeader className="gap-2 pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px]">
                        {temp.type}
                      </Badge>
                      <span
                        className={cn(
                          "text-xs font-bold tabular-nums",
                          temp.performance >= 0
                            ? "text-success"
                            : "text-destructive"
                        )}
                      >
                        {temp.performance >= 0 ? "+" : ""}
                        {temp.performance}%
                      </span>
                    </div>
                    <CardTitle className="text-sm leading-snug group-hover:text-primary transition-colors">
                      {temp.name}
                    </CardTitle>
                    <CardDescription className="text-[11px] leading-relaxed">
                      {temp.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button
                      size="sm"
                      onClick={() => handleDeploy(temp)}
                      className="w-full cursor-pointer"
                    >
                      <IconRocket data-icon="inline-start" /> Deploy
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
