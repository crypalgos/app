"use client";

import { Plus, Sparkles, FileText, ArrowRight } from "lucide-react";

const actions = [
  {
    icon: Plus,
    label: "Create Strategy",
    description: "Build a new trading algorithm from scratch.",
    accent: "primary" as const,
  },
  {
    icon: Sparkles,
    label: "Generate with AI",
    description: "Describe your strategy and let AI build it.",
    accent: "violet" as const,
  },
  {
    icon: FileText,
    label: "Browse Templates",
    description: "Start with pre-built strategies like MA Cross.",
    accent: "blue" as const,
  },
];

const accentStyles = {
  primary: {
    iconBg: "bg-primary/10 text-primary border-primary/15",
    hoverBorder: "hover:border-primary/30",
    hoverText: "group-hover:text-primary",
    arrow: "text-primary",
  },
  violet: {
    iconBg: "bg-violet-500/10 text-violet-500 border-violet-500/15",
    hoverBorder: "hover:border-violet-500/30",
    hoverText: "group-hover:text-violet-500",
    arrow: "text-violet-500",
  },
  blue: {
    iconBg: "bg-blue-500/10 text-blue-500 border-blue-500/15",
    hoverBorder: "hover:border-blue-500/30",
    hoverText: "group-hover:text-blue-500",
    arrow: "text-blue-500",
  },
};

export function ActionGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actions.map((action) => {
        const styles = accentStyles[action.accent];
        return (
          <button
            key={action.label}
            className={`relative group flex flex-col items-start gap-4 p-5 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm ${styles.hoverBorder} transition-all duration-200 hover:bg-card/60 hover:-translate-y-0.5 hover:shadow-sm text-left`}
          >
            <div
              className={`w-10 h-10 rounded-lg ${styles.iconBg} border flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}
            >
              <action.icon className="h-5 w-5" strokeWidth={1.8} />
            </div>

            <div className="space-y-1">
              <h3
                className={`text-[14px] font-semibold text-foreground/90 ${styles.hoverText} transition-colors duration-200`}
              >
                {action.label}
              </h3>
              <p className="text-[12.5px] text-muted-foreground/60 leading-relaxed">
                {action.description}
              </p>
            </div>

            <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200">
              <ArrowRight className={`h-4 w-4 ${styles.arrow}`} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
