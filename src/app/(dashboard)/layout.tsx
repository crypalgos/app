"use client";

import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import ProfileDropdown from "@/components/kokonutui/profile-dropdown";
import { useUser } from "@/api-actions/hooks/user-hooks";
import Link from "next/link";
import { NavbarButton } from "@/app/(public)/_components/base/resizable-navbar";
import { IconLogin2 } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useUser();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-4 justify-between">
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <SidebarTrigger className="-ml-2 opacity-70 hover:opacity-100" />
            
            {/* Header Tabs */}
            <div className="flex-1 overflow-x-auto no-scrollbar mask-fade-right">
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
            </div>
          </div>

          {/* Theme Toggle & User Auth Action Controls */}
          <div className="pl-2 shrink-0 flex items-center gap-3">
            <ThemeToggle className="scale-90" />
            
            {isLoading ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground/60" />
              </div>
            ) : user ? (
              <ProfileDropdown className="scale-95 origin-right" />
            ) : (
              <NavbarButton variant="shimmer" href="/login" className="h-8.5 py-1 px-3 text-xs font-bold gap-1.5">
                Login
                <IconLogin2 size={15} stroke={2.5} />
              </NavbarButton>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
