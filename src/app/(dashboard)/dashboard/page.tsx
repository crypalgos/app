"use client";

import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { IconPlus, IconTerminal2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { LaunchConsole } from "./_components/launch-console";
import { QuantumOrbitLoader } from "@/components/orbit-loader/QuantumOrbitLoader";
import { WorkspaceToolbar } from "./_components/workspace-toolbar";
import { StrategyCard } from "./_components/strategy-card";
import { StrategyTable } from "./_components/strategy-table";
import type { TemplateStrategy } from "./_components/types";
import { toUiStrategy } from "../strategies/_components/types";
import {
  useStrategies,
  useCreateStrategy,
  useDeleteStrategy,
} from "@/api-actions/hooks/strategy-hooks";

export default function DashboardPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 8;

  // ─── API data ───
  const { data: apiStrategies, isLoading } = useStrategies(page, limit, searchQuery);
  const { mutateAsync: createStrategy, isPending: isCreating } = useCreateStrategy();
  const { mutate: deleteStrategy } = useDeleteStrategy();

  // Map API strategies to UI model
  const strategies = (apiStrategies?.strategies ?? []).map(toUiStrategy);

  // ─── Handlers ───

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleCreateStrategy = async (type?: "create" | "ai" | string) => {
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
    }
  };

  const handleDeployTemplate = async (template: TemplateStrategy) => {
    try {
      const { TEMPLATE_STRATEGIES: fullTemplates } = await import("../strategies/_components/types");
      const fullTemplate = fullTemplates.find((t) => t.name === template.name) || template;

      const newStrat = await createStrategy({
        name: fullTemplate.name,
        description: fullTemplate.description,
        canvas_json: (fullTemplate as any).canvas_json || {
          nodes: [
            {
              id: "start-1",
              type: "startNode",
              position: { x: 400, y: 50 },
              data: { label: "Start Strategy", isActive: false },
            },
          ],
          edges: [],
        },
      });
      router.push(`/workflow/${newStrat.id}?template=true`);
    } catch {
      toast.error("Failed to deploy template. Please try again.");
    }
  };

  const handleDelete = (id: string) => {
    deleteStrategy(id, {
      onSuccess: () => {
        toast.success("Strategy deleted.");
        // If deleting the last item on the current page, go back a page
        if (filteredStrategies.length === 1 && page > 1) {
          setPage((p) => p - 1);
        }
      },
      onError: () => toast.error("Failed to delete strategy."),
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

  // ─── Derived state ───

  const filteredStrategies = strategies.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ─── Render ───

  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto w-full px-4 md:px-6 pb-20 pt-2">
      {/* Launch Console */}
      <LaunchConsole
        onCreateStrategy={handleCreateStrategy}
        onDeployTemplate={handleDeployTemplate}
      />

      <Separator />

      {/* Active Workspace */}
      <section className="flex flex-col gap-5">
        <WorkspaceToolbar
          totalCount={apiStrategies?.total ?? 0}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Loading spinner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-border/60 rounded-xl">
            <QuantumOrbitLoader size="md" text="Loading active workspace..." />
          </div>
        ) : filteredStrategies.length === 0 ? (
          <Empty className="border border-dashed border-border/60 min-h-[320px]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconTerminal2 />
              </EmptyMedia>
              <EmptyTitle>
                {searchQuery ? "No Strategies Match" : "No Active Strategies"}
              </EmptyTitle>
              <EmptyDescription>
                {searchQuery
                  ? "Try a different keyword or deploy a new strategy from templates."
                  : "Create a custom strategy, generate one with AI, or deploy a pre-built template to get started."}
              </EmptyDescription>
            </EmptyHeader>
            {!searchQuery && (
              <EmptyContent>
                <Button
                  onClick={() => handleCreateStrategy("create")}
                  disabled={isCreating}
                  className="cursor-pointer"
                >
                  <IconPlus data-icon="inline-start" /> Deploy Strategy
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <>
            {/* Card grid — always on mobile, hidden on desktop when table mode */}
            <div
              className={cn(
                "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                viewMode === "table" && "md:hidden",
              )}
            >
              {filteredStrategies.map((strat) => (
                <StrategyCard
                  key={strat.id}
                  strategy={strat}
                  onBacktest={handleBacktest}
                  onToggleLive={handleToggleLive}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Table — desktop only when table mode */}
            <div
              className={cn(
                viewMode === "table" ? "hidden md:block" : "hidden",
              )}
            >
              <StrategyTable
                strategies={filteredStrategies}
                onBacktest={handleBacktest}
                onToggleLive={handleToggleLive}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
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
          </>
        )}
      </section>
    </div>
  );
}
