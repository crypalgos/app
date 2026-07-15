import { ReactNode } from "react";
import Link from "next/link";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeaderActions } from "@/components/dashboard-header-actions";
import { AuthGuard } from "@/components/auth-guard";
import { GlobalSearch } from "@/components/global-search";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider className="flex-col">
        {/* Full width Top Navigation */}
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-4 justify-between w-full">
          {/* Left section: Logo */}
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="relative z-20 flex items-center space-x-2 px-2 py-1 text-sm font-normal"
              >
                <img
                  src="/horizontal_light.svg"
                  alt="CrypAlgos Logo"
                  width={220}
                  height={220}
                  className="block dark:hidden w-[150px] lg:w-[150px] h-auto"
                  style={{ height: "auto" }}
                  loading="eager"
                />
                <img
                  src="/horizontal_dark.svg"
                  alt="CrypAlgos Logo"
                  width={220}
                  height={220}
                  className="hidden dark:block w-[150px] lg:w-[150px] h-auto"
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
          <div className="flex-1 flex justify-end items-center">
            <DashboardHeaderActions />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <SidebarInset>
            <main className="flex-1 p-4 md:p-6 bg-background">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}

