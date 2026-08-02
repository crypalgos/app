"use client";

import React from "react";
import { motion } from "framer-motion";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

interface ReportTabItem {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ReportTabsListProps {
  tabs: ReportTabItem[];
  /** The currently active tab value -- pass the same controlled value given
   * to the parent <Tabs value=... onValueChange=...>, so this can mount/
   * unmount the sliding pill on the correct trigger (framer-motion's
   * layoutId animates between a component unmounting in one place and an
   * identically-keyed one mounting in another -- it can't animate between
   * simultaneously-mounted siblings). */
  activeValue: string;
  /** Unique per <Tabs> instance so multiple animated tab bars on one page don't share a layoutId. */
  layoutId: string;
}

/**
 * Drop-in replacement for <TabsList> that renders a sliding animated pill
 * behind the active tab (matching the strategy-level page header's own
 * "Premium Animated Pill Tabs" pattern) instead of the plain default
 * TabsList look. Still built on the same Radix Tabs primitive as the
 * shared <Tabs>/<TabsContent>, so it's a drop-in for report-page tab bars
 * specifically -- not a change to the shared ui/tabs.tsx used everywhere.
 */
export function ReportTabsList({ tabs, activeValue, layoutId }: ReportTabsListProps) {
  return (
    <TabsPrimitive.List className="inline-flex items-center p-1.5 bg-muted/40 border border-border/40 rounded-full w-fit gap-0.5">
      {tabs.map((tab) => {
        const isActive = tab.value === activeValue;
        return (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "relative flex items-center gap-1.5 px-4 h-9 text-[13px] font-medium transition-colors duration-200 whitespace-nowrap outline-none rounded-full cursor-pointer",
              isActive ? "text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon && <tab.icon className="size-3.5 relative z-10 shrink-0" />}
            <span className="relative z-10">{tab.label}</span>
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 bg-primary shadow-[0_2px_10px_rgba(14,70,255,0.3)] rounded-full z-0"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </TabsPrimitive.Trigger>
        );
      })}
    </TabsPrimitive.List>
  );
}
