"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  IconLayoutDashboard,
  IconCpu,
  IconFlask,
  IconTrendingUp,
  IconArrowsExchange,
  IconChartLine,
  IconBook,
  IconPlus,
  IconChevronDown
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconLayoutDashboard,
  },
  {
    title: "Strategies",
    url: "/strategies",
    icon: IconCpu,
  },
  {
    title: "Backtests",
    url: "/backtests",
    icon: IconFlask,
  },
  {
    title: "Live Trading",
    url: "/live-trading",
    icon: IconTrendingUp,
    badge: "ACTIVE",
  },
  {
    title: "Exchanges",
    url: "/exchanges",
    icon: IconArrowsExchange,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: IconChartLine,
  },
  {
    title: "Documentation",
    url: "/docs",
    icon: IconBook,
  }
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border bg-background text-sidebar-foreground h-screen [&_[data-sidebar=sidebar]]:!bg-background">
      <SidebarHeader className="py-6 px-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-4">
        <Link href="/" className="flex items-center gap-3 overflow-hidden group-data-[collapsible=icon]:justify-center">
          <img
            src="/favicon.svg"
            alt="CrypAlgos Icon"
            className="w-8 h-8 shrink-0"
          />
          <span className="font-bold text-xl tracking-tight group-data-[collapsible=icon]:hidden text-sidebar-foreground">
            CrypAlgos
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-2">
        <SidebarMenu className="gap-2">
          {NAV_ITEMS.map((item) => {
            // Determine if the route is active
            const isActive = 
              pathname === item.url || 
              pathname?.startsWith(`${item.url}/`);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  tooltip={item.title}
                  className={cn(
                    "h-10 px-3 group-data-[collapsible=icon]:px-0 transition-all flex items-center justify-between rounded-xl cursor-pointer",
                    isActive 
                      ? "bg-sidebar-primary/8 text-sidebar-primary border border-sidebar-primary/20 dark:bg-sidebar-primary/12 dark:border-sidebar-primary/30 data-active:bg-sidebar-primary/8 data-active:text-sidebar-primary data-active:border-sidebar-primary/20 dark:data-active:bg-sidebar-primary/12 dark:data-active:border-sidebar-primary/30 font-semibold shadow-xs hover:bg-sidebar-primary/12 hover:border-sidebar-primary/30 dark:hover:bg-sidebar-primary/16 dark:hover:border-sidebar-primary/40 data-active:hover:bg-sidebar-primary/12 data-active:hover:border-sidebar-primary/30 dark:data-active:hover:bg-sidebar-primary/16 dark:data-active:hover:border-sidebar-primary/40" 
                      : "text-sidebar-foreground/75 border border-transparent hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Link href={item.url} className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
                    <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0">
                      <item.icon className={cn(
                        "size-4 shrink-0 transition-colors",
                        isActive ? "text-sidebar-primary opacity-100" : "opacity-70 group-hover:opacity-100"
                      )} />
                      <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-400 dark:text-emerald-300 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider ml-auto group-data-[collapsible=icon]:hidden">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 mb-2 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pb-4">
        {/* Expanded Split Button using true Shadcn colors */}
        <div className="flex w-full group-data-[collapsible=icon]:hidden">
          <button className="flex-1 bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground font-semibold py-2.5 px-4 rounded-l-xl flex items-center justify-center gap-2 transition-colors cursor-pointer outline-none border-none">
            <IconPlus className="w-4 h-4" />
            <span className="text-sm">New Strategy</span>
          </button>
          <button className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground px-2.5 border-l border-sidebar-primary-foreground/15 rounded-r-xl transition-colors flex items-center justify-center cursor-pointer outline-none">
            <IconChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
        
        {/* Collapsed Action Button */}
        <button className="hidden group-data-[collapsible=icon]:flex w-9 h-9 shrink-0 mx-auto bg-sidebar-primary/10 hover:bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/20 rounded-xl items-center justify-center transition-all duration-200 cursor-pointer">
          <IconPlus className="w-4 h-4" />
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
