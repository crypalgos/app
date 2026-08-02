"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { 
  HiOutlineSquares2X2,
  HiOutlineCpuChip,
  HiOutlineBeaker,
  HiOutlineArrowTrendingUp,
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineArrowsRightLeft,
  HiOutlineBuildingStorefront,
  HiOutlineBookOpen,
  HiOutlineCog8Tooth,
  HiOutlineUserPlus,
  HiOutlineSparkles
} from "react-icons/hi2";

interface NavItem {
  title: string;
  url: string;
  matchPath?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: HiOutlineSquares2X2,
      },
      {
        title: "Strategies",
        url: "/strategies",
        icon: HiOutlineCpuChip,
      },
    ],
  },
  {
    label: "Trading & Research",
    items: [
      {
        title: "Paper Trading",
        url: "/paper-trading",
        icon: HiOutlineBeaker,
      },
      {
        title: "Live Trading",
        url: "/live-trading",
        icon: HiOutlineArrowTrendingUp,
        badge: "Live",
      },
      {
        title: "Coin Research",
        url: "/coin-research",
        icon: HiOutlineMagnifyingGlass,
      },
      {
        title: "Coin Alerts",
        url: "/coin-alerts",
        icon: HiOutlineBell,
      },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        title: "Exchanges",
        url: "/profile?tab=exchanges",
        matchPath: "/profile",
        icon: HiOutlineArrowsRightLeft,
      },
      {
        title: "Marketplace",
        url: "/marketplace",
        icon: HiOutlineBuildingStorefront,
      },
      {
        title: "Documentation",
        url: "/docs",
        icon: HiOutlineBookOpen,
      },
      {
        title: "Settings",
        url: "/settings",
        icon: HiOutlineCog8Tooth,
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  const handleInvite = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.origin);
      toast.success("Invite link copied to clipboard!");
    }
  };

  return (
    <Sidebar 
      variant="floating" 
      collapsible="icon" 
      className="!top-[56px] !h-[calc(100svh-56px)] border-none bg-transparent !pl-1.5 [&_[data-slot=sidebar-inner]]:bg-card/75 [&_[data-slot=sidebar-inner]]:backdrop-blur-xl [&_[data-slot=sidebar-inner]]:border [&_[data-slot=sidebar-inner]]:border-border/60 [&_[data-slot=sidebar-inner]]:shadow-md dark:[&_[data-slot=sidebar-inner]]:bg-slate-950/75 dark:[&_[data-slot=sidebar-inner]]:border-white/10 dark:[&_[data-slot=sidebar-inner]]:shadow-2xl transition-all duration-300"
    >
      {/* Sidebar Header & Toggle */}
      <SidebarHeader className="flex flex-row items-center justify-between pt-3 pb-1 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden px-1">
          <HiOutlineSparkles className="w-3.5 h-3.5 text-[#FD428E] animate-pulse" />
          <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground/70">Navigation</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger className="hidden md:inline-flex !bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent/80 dark:hover:bg-white/10 border border-transparent hover:border-border/40 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer" />
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2 font-medium text-xs">
            Toggle navigation
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">⌘B</kbd>
          </TooltipContent>
        </Tooltip>
      </SidebarHeader>

      {/* Main Navigation Menu */}
      <SidebarContent className="px-2 py-1 group-data-[collapsible=icon]:px-1 scrollbar-none space-y-4">
        {NAV_SECTIONS.map((section, idx) => (
          <SidebarGroup key={section.label || idx} className="p-0">
            {section.label && (
              <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 py-1 h-auto mb-1 group-data-[collapsible=icon]:hidden">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarMenu className="gap-1 relative">
              {section.items.map((item) => {
                const targetPath = item.matchPath || item.url;
                const isActive = 
                  pathname === targetPath || 
                  pathname?.startsWith(`${targetPath}/`);

                return (
                  <SidebarMenuItem key={item.title} className="relative">
                    {/* Active Left Pill Accent Bar */}
                    {isActive && (
                      <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-[#FD428E] to-[#0E46FF] rounded-r-full shadow-sm group-data-[collapsible=icon]:hidden transition-all duration-300" />
                    )}
                    
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={cn(
                        "transition-all duration-200 cursor-pointer !bg-transparent group/menu-item relative overflow-hidden",
                        "h-[38px] px-2.5 flex items-center gap-3 rounded-xl",
                        isActive 
                          ? "bg-gradient-to-r from-[#0E46FF]/10 via-[#0E46FF]/5 to-transparent dark:from-[#0E46FF]/20 dark:via-[#0E46FF]/10 border border-[#0E46FF]/20 text-foreground font-semibold shadow-xs" 
                          : "hover:bg-accent/60 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground",
                        // Collapsed overrides
                        "group-data-[collapsible=icon]:!h-auto group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!bg-transparent group-data-[collapsible=icon]:!border-none group-data-[collapsible=icon]:!shadow-none"
                      )}
                    >
                      <Link href={item.url} className={cn(
                        "flex items-center w-full",
                        "flex-row gap-2.5",
                        "group-data-[collapsible=icon]:justify-center"
                      )}>
                        {/* Icon Wrapper */}
                        <div className="relative flex justify-center shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                "flex items-center justify-center transition-all duration-200",
                                "group-hover/menu-item:scale-105 active:scale-95",
                                "w-7 h-7 rounded-lg",
                                // Collapsed size
                                "group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:rounded-xl",
                                isActive 
                                  ? "bg-gradient-to-tr from-[#0E46FF] to-[#3D63FF] text-white shadow-md shadow-blue-500/25 ring-1 ring-white/20" 
                                  : "text-muted-foreground group-hover/menu-item:text-foreground group-hover/menu-item:bg-accent/80 dark:group-hover/menu-item:bg-white/10"
                              )}>
                                <item.icon 
                                  className={cn(
                                    "shrink-0 transition-transform duration-200",
                                    "w-4 h-4", 
                                    "group-data-[collapsible=icon]:w-[18px] group-data-[collapsible=icon]:h-[18px]"
                                  )} 
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="hidden group-data-[collapsible=icon]:flex items-center gap-2 font-semibold text-xs">
                              {item.title}
                              {item.badge && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30">
                                  {item.badge}
                                </span>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {/* Title & Badge */}
                        <div className="flex items-center justify-between flex-1 group-data-[collapsible=icon]:hidden overflow-hidden">
                          <span className={cn(
                            "text-[13px] tracking-tight truncate transition-colors duration-200",
                            isActive ? "font-semibold text-foreground" : "font-normal text-muted-foreground group-hover/menu-item:text-foreground"
                          )}>
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer Workspace & Invite Action Bar */}
      <SidebarFooter className="p-2.5 mt-auto border-t border-border/40 dark:border-white/5 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:border-t-0 group-data-[collapsible=icon]:py-3 group-data-[collapsible=icon]:px-1.5">
        {/* Expanded State Footer */}
        <div className="group-data-[collapsible=icon]:hidden flex items-center justify-between gap-2 p-2 rounded-xl bg-card/80 dark:bg-slate-900/60 border border-border/60 shadow-xs transition-all duration-200">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent/50 dark:bg-white/5 border border-border/60 p-1 flex items-center justify-center shrink-0 shadow-xs">
              <img src="/favicon.svg" alt="CrypAlgos Favicon" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="text-[12px] font-semibold text-foreground truncate leading-tight">CrypAlgos Team</span>
              <span className="text-[10px] text-muted-foreground truncate leading-tight">Pro Workspace</span>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleInvite}
                className="h-7.5 px-2.5 rounded-lg bg-gradient-to-r from-[#FD428E] to-[#0E46FF] hover:opacity-95 text-white text-[11px] font-semibold flex items-center gap-1.5 shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs cursor-pointer border-0"
              >
                <HiOutlineUserPlus className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Invite</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="font-semibold text-xs">
              Copy invite link
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Collapsed (Closed) State Footer: Spacious & Sleek */}
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleInvite}
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FD428E] to-[#0E46FF] text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer shadow-md shadow-blue-500/20 ring-1 ring-white/20"
              >
                <HiOutlineUserPlus className="w-4 h-4" strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-semibold text-xs flex items-center gap-1.5">
              <span>Invite Team Members</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

