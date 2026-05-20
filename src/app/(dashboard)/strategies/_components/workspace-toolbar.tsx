import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconSearch,
  IconLayoutGrid,
  IconList,
  IconAdjustmentsHorizontal,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface WorkspaceToolbarProps {
  totalCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: "card" | "table";
  onViewModeChange: (mode: "card" | "table") => void;
}

export function WorkspaceToolbar({
  totalCount,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: WorkspaceToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Section label */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-1/40 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-chart-1" />
        </div>
        <h2 className="text-[11px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
          Active Workspace
        </h2>
        {totalCount > 0 && (
          <Badge variant="secondary" className="tabular-nums">
            {totalCount}
          </Badge>
        )}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1 sm:w-56">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search strategies..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring placeholder:text-muted-foreground/50 transition-all"
          />
        </div>

        {/* View toggle (desktop only) */}
        <div className="hidden md:flex items-center rounded-lg border border-input bg-background p-0.5">
          <button
            onClick={() => onViewModeChange("card")}
            className={cn(
              "flex items-center justify-center size-7 rounded-md transition-colors cursor-pointer",
              viewMode === "card"
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <IconLayoutGrid className="size-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange("table")}
            className={cn(
              "flex items-center justify-center size-7 rounded-md transition-colors cursor-pointer",
              viewMode === "table"
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <IconList className="size-3.5" />
          </button>
        </div>

        {/* Filters button */}
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer shrink-0"
        >
          <IconAdjustmentsHorizontal data-icon="inline-start" /> Filters
        </Button>
      </div>
    </div>
  );
}
