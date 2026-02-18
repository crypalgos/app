"use client";

import { useState } from "react";
import { ArrowDown, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileDropdown from "@/components/kokonutui/profile-dropdown";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ActionGrid } from "./action-grid";

const tabs = ["All Strategies", "Active", "Backtesting", "Drafts", "Archived"];

export function DashboardContent() {
  const [activeTab, setActiveTab] = useState("All Strategies");

  return (
    <main className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-2 border-b border-border/50 min-h-[52px] bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="h-5 bg-border/60" />

          {/* Tabs */}
          <nav className="flex items-center gap-0.5">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-all duration-150 ${
                  activeTab === tab
                    ? "bg-accent text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <ProfileDropdown />
        </div>
      </header>

      {/* Action Cards */}
      <div className="px-6 pt-6 pb-2">
        <ActionGrid />
      </div>

      {/* Table Header */}
      <div className="px-6 pt-4">
        <div className="flex items-center py-2.5 border-b border-border/50">
          <div className="flex-[2.5] px-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Strategy Name
            </span>
          </div>
          <div className="flex-1 px-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Status
            </span>
          </div>
          <div className="flex-[0.7] px-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Created
            </span>
          </div>
          <div className="flex-[0.7] px-3 flex items-center gap-1.5">
            <ArrowDown className="h-3 w-3 text-foreground/70" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">
              Performance
            </span>
          </div>
          <div className="flex-[0.7] px-3 text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Trades
            </span>
          </div>
          <div className="flex-[0.7] px-3 text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Author
            </span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground/50">
            No strategies found
          </p>
          <p className="text-xs text-muted-foreground/30">
            Create your first strategy to get started
          </p>
        </div>
      </div>

      {/* Help Button */}
      <Button
        size="icon"
        variant="secondary"
        className="fixed bottom-5 right-5 h-9 w-9 rounded-full shadow-md hover:shadow-lg transition-shadow border border-border/50"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>
    </main>
  );
}
