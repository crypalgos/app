import { ReactNode } from "react";
import Link from "next/link";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeaderActions } from "@/components/dashboard-header-actions";
import { AuthGuard } from "@/components/auth-guard";
import { GlobalSearch } from "@/components/global-search";
import { HiOutlineBars3 } from "react-icons/hi2";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider className="flex-col">
        {/* Full width Top Navigation */}
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-4 justify-between w-full">
          {/* Left section: Mobile Hamburger & Logo */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 3-Line Menu Trigger - VISIBLE ONLY ON MOBILE (md:hidden) */}
            <SidebarTrigger className="md:hidden text-muted-foreground hover:text-foreground hover:bg-accent/80 border border-border/40 rounded-lg p-1.5 transition-all duration-200 active:scale-95 cursor-pointer shrink-0">
              <HiOutlineBars3 className="w-5 h-5" strokeWidth={2} />
            </SidebarTrigger>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/"
                className="relative z-20 flex items-center py-1 text-sm font-normal shrink-0"
              >
                <img
                  src="/horizontal_light.svg"
                  alt="CrypAlgos Logo"
                  width={220}
                  height={220}
                  className="block dark:hidden w-[135px] sm:w-[165px] md:w-[185px] h-auto shrink-0"
                  style={{ height: "auto" }}
                  loading="eager"
                />
                <img
                  src="/horizontal_dark.svg"
                  alt="CrypAlgos Logo"
                  width={220}
                  height={220}
                  className="hidden dark:block w-[135px] sm:w-[165px] md:w-[185px] h-auto shrink-0"
                  style={{ height: "auto" }}
                  loading="eager"
                />
              </Link>
            </div>
          </div>

          {/* Center section: Global Search Command Palette */}
          <div className="flex-1 flex justify-center items-center">
             <GlobalSearch />
          </div>

          {/* Right section: Theme Toggle & User Auth Action Controls */}
          <div className="flex items-center justify-end shrink-0">
            <DashboardHeaderActions />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <SidebarInset>
            <div className="flex-1 p-4 md:p-6 bg-background min-h-0 overflow-y-auto">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}

