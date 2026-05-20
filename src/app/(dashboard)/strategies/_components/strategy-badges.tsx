import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react";
import type { Strategy } from "./types";

/**
 * Renders a status badge with a pulsing dot indicator.
 * Uses semantic chart / destructive tokens — no raw color values.
 */
export function StatusBadge({ status }: { status: Strategy["status"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 text-[10px] font-semibold capitalize",
        status === "active" && "border-chart-1/30 text-chart-1 bg-chart-1/5",
        status === "paused" && "border-chart-5/30 text-chart-5 bg-chart-5/5",
        status === "error" && "border-destructive/30 text-destructive bg-destructive/5"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "active" && "bg-chart-1 animate-pulse",
          status === "paused" && "bg-chart-5",
          status === "error" && "bg-destructive"
        )}
      />
      {status}
    </Badge>
  );
}

/**
 * Compact performance percentage display with a directional arrow icon.
 */
export function PerfDisplay({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-bold tabular-nums",
        isPositive ? "text-success" : "text-destructive"
      )}
    >
      {isPositive ? (
        <IconTrendingUp className="size-3.5" />
      ) : (
        <IconTrendingDown className="size-3.5" />
      )}
      {isPositive ? "+" : ""}
      {value}%
    </span>
  );
}
