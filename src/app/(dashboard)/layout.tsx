import { ReactNode } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeaderActions } from "./dashboard/_components/header-actions";
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-4 justify-between">
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              <SidebarTrigger className="-ml-2 opacity-70 hover:opacity-100" />
            </div>

            {/* Theme Toggle & User Auth Action Controls */}
            <DashboardHeaderActions />
          </header>
          <main className="flex-1 p-4 md:p-6 bg-background">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}

