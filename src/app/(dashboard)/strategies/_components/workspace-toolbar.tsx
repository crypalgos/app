import { Badge } from "@/components/ui/badge";
import {
  IconSearch,
  IconLayoutGrid,
  IconList,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface WorkspaceToolbarProps {
  totalCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: "card" | "table";
  onViewModeChange: (mode: "card" | "table") => void;
  showArchived: boolean;
  onShowArchivedChange: (value: boolean) => void;
}

export function WorkspaceToolbar({
  totalCount,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  showArchived,
  onShowArchivedChange,
}: WorkspaceToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Active/Archive Tab selector */}
      <div className="flex items-center gap-1.5 bg-muted/40 p-0.5 rounded-xl border border-border/50">
        <button
          onClick={() => onShowArchivedChange(false)}
          className={cn(
            "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
            !showArchived
              ? "bg-background text-foreground shadow-sm border border-border/50"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Active Workspace
          {totalCount > 0 && !showArchived && (
            <span className="tabular-nums text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-mono">
              {totalCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onShowArchivedChange(true)}
          className={cn(
            "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
            showArchived
              ? "bg-background text-foreground shadow-sm border border-border/50"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Archive
          {totalCount > 0 && showArchived && (
            <span className="tabular-nums text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-mono">
              {totalCount}
            </span>
          )}
        </button>
      </div>

      {/* Right: search + view toggle */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search strategies..."
            className="h-8 w-48 pl-8 pr-3 text-xs rounded-xl bg-muted/40 border border-border/50 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/40 placeholder:text-muted-foreground/40 transition-all"
          />
        </div>

        {/* View toggle */}
        <div className="hidden md:flex items-center rounded-xl border border-border/50 bg-muted/30 p-0.5 gap-0.5">
          <button
            onClick={() => onViewModeChange("card")}
            title="Card view"
            className={cn(
              "flex items-center justify-center size-7 rounded-lg transition-all cursor-pointer",
              viewMode === "card"
                ? "bg-background text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <IconLayoutGrid className="size-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange("table")}
            title="Table view"
            className={cn(
              "flex items-center justify-center size-7 rounded-lg transition-all cursor-pointer",
              viewMode === "table"
                ? "bg-background text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <IconList className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
