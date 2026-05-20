import { ReactNode } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeaderActions } from "./dashboard/_components/header-actions";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-4 justify-between">
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <SidebarTrigger className="-ml-2 opacity-70 hover:opacity-100" />

            {/* Header Tabs */}
            {/* <div className="flex-1 overflow-x-auto no-scrollbar mask-fade-right">
              <nav className="flex items-center gap-1 text-[13px] font-medium min-w-max pr-4">
                <button className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md transition-colors">
                  All Strategies
                </button>
                <button className="px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors">
                  Active
                </button>
                <button className="px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors">
                  Backtesting
                </button>
                <button className="px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors">
                  Drafts
                </button>
                <button className="px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors">
                  Archived
                </button>
              </nav>
            </div> */}
          </div>

          {/* Theme Toggle & User Auth Action Controls */}
          <DashboardHeaderActions />
        </header>
        <main className="flex-1 p-4 md:p-6 bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
