"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronRight } from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useStrategy } from "@/api-actions/hooks/strategy-hooks";

const STATIC_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  strategies: "Strategies",
  "paper-trading": "Paper Trading",
  "live-trading": "Live Trading",
  "coin-research": "Coin Research",
  "coin-alerts": "Coin Alerts",
  exchanges: "Exchanges",
  marketplace: "Marketplace",
  docs: "Documentation",
  settings: "Settings",
  profile: "Profile",
  backtests: "Backtests",
  optimizations: "Optimizations",
  walkforwards: "Walkforward",
  montecarlos: "Monte Carlo",
  versions: "Versions",
  deployments: "Deployments",
};

// Generic label for a run-detail id (e.g. /strategies/[id]/backtests/[runId])
// — cheap by design, no extra data fetching for the run itself.
const RUN_TYPE_LABEL: Record<string, string> = {
  backtests: "Backtest",
  optimizations: "Optimization",
  walkforwards: "Walkforward",
  montecarlos: "Monte Carlo",
};

function titleize(segment: string) {
  return (
    STATIC_LABELS[segment] ??
    segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

interface Crumb {
  label: ReactNode;
  href?: string;
}

export function DashboardBreadcrumb() {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);

  const isStrategyRoute = segments[0] === "strategies" && !!segments[1];
  const { data: strategy, isLoading: strategyLoading } = useStrategy(
    isStrategyRoute ? segments[1] : null
  );

  if (segments.length === 0) return null;

  const crumbs: Crumb[] = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const isLast = i === segments.length - 1;

    // Strategy id segment -> resolve to the strategy's name.
    if (isStrategyRoute && i === 1) {
      return {
        label: strategyLoading ? (
          <Skeleton className="h-3.5 w-20 inline-block" />
        ) : (
          strategy?.name || "Strategy"
        ),
        href: isLast ? undefined : href,
      };
    }

    // Run-detail id segment (e.g. the backtestId in /backtests/[backtestId]).
    if (isStrategyRoute && i === 3 && RUN_TYPE_LABEL[segments[2]]) {
      return { label: RUN_TYPE_LABEL[segments[2]], href: undefined };
    }

    return { label: titleize(seg), href: isLast ? undefined : href };
  });

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium min-w-0 overflow-hidden">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5 min-w-0 shrink-0 last:shrink last:min-w-0">
          {i > 0 && <IconChevronRight className="w-3 h-3 shrink-0 text-muted-foreground/50" />}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-foreground transition-colors truncate">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-foreground truncate max-w-[220px]">{crumb.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
