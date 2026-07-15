import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  IconSearch,
  IconLayoutGrid,
  IconList,
  IconArchive,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface WorkspaceToolbarProps {
  totalCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showArchived: boolean;
  onShowArchivedChange: (value: boolean) => void;
}

export function WorkspaceToolbar({
  totalCount,
  searchQuery,
  onSearchChange,
  showArchived,
  onShowArchivedChange,
}: WorkspaceToolbarProps) {
  const [internalShowArchived, setInternalShowArchived] = useState(showArchived);

  useEffect(() => {
    setInternalShowArchived(showArchived);
  }, [showArchived]);

  const handleToggle = (val: boolean) => {
    if (val === internalShowArchived) return;
    setInternalShowArchived(val);
    
    // Allow the 60fps CSS animation to complete before triggering parent render
    setTimeout(() => {
      onShowArchivedChange(val);
    }, 250);
  };
  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center justify-between w-full">
      {/* Left: Premium Search */}
      <div className="relative group w-full sm:w-auto">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search strategies..."
          className="h-10 w-full sm:w-[280px] pl-9 pr-12 text-[13px] font-medium rounded-full bg-background border border-black/5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 placeholder:text-muted-foreground/50 transition-all dark:bg-[#0a0a0a] dark:border-[#222] dark:shadow-none"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none opacity-60 group-focus-within:opacity-0 transition-opacity">
          <span className="text-[10px] font-mono border border-border/60 bg-muted/50 rounded px-1.5 py-0.5 text-muted-foreground font-semibold">
            ⌘K
          </span>
        </div>
      </div>

      {/* Right: Active/Archive Tab selector */}
      <div className="relative flex w-full sm:w-fit items-center rounded-full border border-border/40 bg-muted/40 p-1">
        {/* Animated Slider */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            "bg-primary shadow-[0_2px_10px_rgba(14,70,255,0.3)]",
            internalShowArchived ? "translate-x-full" : "translate-x-0"
          )}
        />
        {/* Buttons */}
        <button
          className={cn(
            "relative z-10 flex w-full sm:w-36 h-8 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition-colors duration-200 cursor-pointer",
            !internalShowArchived ? "text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => handleToggle(false)}
          type="button"
        >
          <IconLayoutGrid className="size-3.5" />
          Active
          {totalCount > 0 && !internalShowArchived && (
            <span className="flex items-center justify-center h-[18px] px-1.5 rounded-full bg-primary-foreground/20 text-[10px] font-bold">
              {totalCount}
            </span>
          )}
        </button>
        <button
          className={cn(
            "relative z-10 flex w-full sm:w-36 h-8 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition-colors duration-200 cursor-pointer",
            internalShowArchived ? "text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => handleToggle(true)}
          type="button"
        >
          <IconArchive className="size-3.5" />
          Archive
          {totalCount > 0 && internalShowArchived && (
            <span className="flex items-center justify-center h-[18px] px-1.5 rounded-full bg-primary-foreground/20 text-[10px] font-bold">
              {totalCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
