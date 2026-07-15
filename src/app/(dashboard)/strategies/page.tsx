"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { IconPlus, IconTerminal2 } from "@tabler/icons-react";
import { PlusIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { QuantumOrbitLoader } from "@/components/orbit-loader/QuantumOrbitLoader";
import { WorkspaceToolbar } from "./_components/workspace-toolbar";
import { StrategyCard } from "./_components/strategy-card";
import { toUiStrategy } from "./_components/types";
import {
  useStrategies,
  useCreateStrategy,
  useDeleteStrategy,
  useRestoreStrategy,
} from "@/api-actions/hooks/strategy-hooks";

export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);
  const limit = 8;

  // ─── API data ───────────────────────────────────────────────────────────────
  const { data: apiStrategies, isLoading } = useStrategies(page, limit, searchQuery, showArchived);
  const { mutateAsync: createStrategy, isPending: isCreating } = useCreateStrategy();
  const { mutate: deleteStrategy } = useDeleteStrategy();
  const { mutate: restoreStrategy } = useRestoreStrategy();

  // Map API strategies to UI model
  const strategies = (apiStrategies?.strategies ?? []).map(toUiStrategy);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  // `isCreating` (from react-query) lags one render behind a rapid double
  // tap/click, so a synchronous ref guard is needed to actually block a
  // second invocation before the button has re-rendered as disabled.
  const isCreatingRef = useRef(false);

  const handleCreateStrategy = async (type?: "create" | "ai" | string) => {
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;
    try {
      const newStrat = await createStrategy({
        name: type === "ai" ? "AI Strategy" : "New Strategy",
        description: type === "ai"
          ? "AI-generated trading strategy"
          : "Custom visual strategy",
        canvas_json: {
          canvas_version: "4.1",
          nodes: [
            {
              id: "start-1",
              type: "startNode",
              position: { x: 400, y: 50 },
              data: { label: "Start Strategy", isActive: false, exchange: "delta" } as any,
            },
          ],
          edges: [],
        },
      });

      if (type === "ai") {
        router.push(`/workflow/${newStrat.id}?mode=ai`);
      } else {
        router.push(`/workflow/${newStrat.id}`);
      }
    } catch {
      toast.error("Failed to create strategy. Please try again.");
      isCreatingRef.current = false;
    }
    // Deliberately not reset to false on success — the route push away from
    // this page makes the guard moot, and resetting could open a window for
    // a second create if the navigation is slow.
  };

  const handleDelete = (id: string) => {
    deleteStrategy(id, {
      onSuccess: () => {
        toast.success(showArchived ? "Strategy permanently deleted." : "Strategy archived.");
        // If deleting the last item on the current page, go back a page
        if (strategies.length === 1 && page > 1) {
          setPage((p) => p - 1);
        }
      },
      onError: () => toast.error("Failed to delete strategy."),
    });
  };

  const handleRestore = (id: string) => {
    restoreStrategy(id, {
      onSuccess: () => {
        toast.success("Strategy restored successfully.");
      },
      onError: () => toast.error("Failed to restore strategy."),
    });
  };

  const handleBacktest = (id: string) => {
    router.push(`/workflow/${id}`);
  };

  const handleToggleLive = (_id: string) => {
    toast.info("Live trading coming soon.");
  };

  const handleEdit = (id: string) => {
    router.push(`/workflow/${id}`);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 w-full px-6 lg:px-8 xl:px-12 pb-20 pt-6 transition-all duration-300">
      {/* Premium Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Strategies</h1>
          <p className="text-[15px] text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            Build, backtest, and manage your trading strategies in one unified workspace.
          </p>
        </div>
        <Button
          onClick={() => handleCreateStrategy("create")}
          disabled={isCreating}
          className="relative group h-10 px-6 rounded-full gap-2 cursor-pointer shrink-0 text-white font-semibold text-[14px] transition-all duration-300 bg-gradient-to-b from-[#FD428E] to-[#0E46FF] border border-white/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_6px_15px_-4px_rgba(14,70,255,0.4)] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_10px_25px_-5px_rgba(14,70,255,0.6)] hover:-translate-y-0.5 hover:scale-[1.02] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <IconPlus className="size-4 relative z-10 drop-shadow-sm" /> 
          <span className="relative z-10 drop-shadow-sm">New Strategy</span>
        </Button>
      </div>

      {/* Workspace Listing */}
      <section className="flex flex-col gap-5">
        <WorkspaceToolbar
          totalCount={apiStrategies?.total ?? 0}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          showArchived={showArchived}
          onShowArchivedChange={(val) => {
            setShowArchived(val);
            setPage(1);
          }}
        />

        {/* Animated Page Transitions */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-border/60 rounded-xl"
            >
              <QuantumOrbitLoader size="md" text={showArchived ? "Loading archive..." : "Loading active workspace..."} />
            </motion.div>
          ) : strategies.length === 0 ? (
            <motion.div
              key={`empty-${showArchived ? 'archived' : 'active'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Empty className="border border-dashed border-border/60 min-h-[320px]">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconTerminal2 />
                  </EmptyMedia>
                  <EmptyTitle>
                    {searchQuery
                      ? "No Strategies Match"
                      : showArchived
                      ? "No Archived Strategies"
                      : "No Active Strategies"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {searchQuery
                      ? "Try a different keyword or create a new strategy."
                      : showArchived
                      ? "Strategies you archive will appear here. You can permanently delete them from the archive."
                      : "Create a strategy from scratch using the visual canvas to get started."}
                  </EmptyDescription>
                </EmptyHeader>
                {!searchQuery && !showArchived && (
                  <EmptyContent>
                    <Button
                      onClick={() => handleCreateStrategy("create")}
                      disabled={isCreating}
                      className="cursor-pointer bg-gradient-to-r from-[#FD428E] to-[#0E46FF] hover:opacity-90 text-white border-0 shadow-md transition-opacity"
                    >
                      <IconPlus data-icon="inline-start" /> Deploy Strategy
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            </motion.div>
          ) : (
            <motion.div
              key={`grid-${showArchived ? 'archived' : 'active'}-${page}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Card grid */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {strategies.map((strat) => (
                  <StrategyCard
                    key={strat.id}
                    strategy={strat}
                    onBacktest={handleBacktest}
                    onToggleLive={handleToggleLive}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {apiStrategies && apiStrategies.total_pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="cursor-pointer"
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground font-medium">
                    Page {apiStrategies.current_page} of {apiStrategies.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(apiStrategies.total_pages, p + 1))}
                    disabled={page === apiStrategies.total_pages}
                    className="cursor-pointer"
                  >
                    Next
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
