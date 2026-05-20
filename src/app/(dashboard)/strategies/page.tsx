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
import { IconPlus, IconTerminal2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

import { LaunchConsole } from "./_components/launch-console";
import { WorkspaceToolbar } from "./_components/workspace-toolbar";
import { StrategyCard } from "./_components/strategy-card";
import { StrategyTable } from "./_components/strategy-table";
import type { Strategy, TemplateStrategy } from "./_components/types";

export default function DashboardPage() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Handlers ───

  const handleCreateStrategy = (type?: "create" | "ai" | any) => {
    const id = Math.random().toString(36).substr(2, 9);
    if (type === "ai") {
      router.push(`/workflow/${id}?mode=ai`);
    } else {
      router.push(`/workflow/${id}`);
    }
  };

  const handleDeployTemplate = (template: TemplateStrategy) => {
    const id = Math.random().toString(36).substr(2, 9);
    const templateId = template.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    router.push(`/workflow/${id}?template-id=${templateId}`);
  };

  const handleDelete = (id: string) => {
    setStrategies((prev) => prev.filter((s) => s.id !== id));
  };

  const handleBacktest = (id: string) => {
    setStrategies((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              trades: s.trades + 1,
              performance: Number(
                (s.performance + (Math.random() * 5 - 2)).toFixed(1),
              ),
            }
          : s,
      ),
    );
  };

  const handleToggleLive = (id: string) => {
    setStrategies((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "active" ? "paused" : "active" }
          : s,
      ),
    );
  };

  const handleEdit = (id: string) => {
    const strat = strategies.find((s) => s.id === id);
    if (!strat) return;
    const newName = prompt("Rename Strategy:", strat.name);
    if (newName?.trim()) {
      setStrategies((prev) =>
        prev.map((s) => (s.id === id ? { ...s, name: newName.trim() } : s)),
      );
    }
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
          totalCount={strategies.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {filteredStrategies.length === 0 ? (
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
                  onClick={handleCreateStrategy}
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
          </>
        )}
      </section>
    </div>
  );
}
