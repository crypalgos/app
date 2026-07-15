"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
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
  HiOutlinePlus,
  HiOutlineChevronDown
} from "react-icons/hi2";

const NAV_ITEMS = [
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
  {
    title: "Paper Trading",
    url: "/paper-trading",
    icon: HiOutlineBeaker,
  },
  {
    title: "Live Trading",
    url: "/live-trading",
    icon: HiOutlineArrowTrendingUp,
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
  {
    title: "Exchanges",
    url: "/exchanges",
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
  }
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar 
      variant="floating" 
      collapsible="icon" 
      className="!top-[56px] !h-[calc(100svh-56px)] border-none bg-transparent !pl-1 [&_[data-slot=sidebar-inner]]:bg-gradient-to-b [&_[data-slot=sidebar-inner]]:from-[#15382D] [&_[data-slot=sidebar-inner]]:to-[#0B211A] dark:[&_[data-slot=sidebar-inner]]:from-[#0C2822] dark:[&_[data-slot=sidebar-inner]]:to-[#061814]"
    >
      <SidebarHeader className="flex flex-row items-center justify-between pt-3 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pt-3 group-data-[collapsible=icon]:px-0">
        <span className="font-semibold text-[11px] uppercase tracking-[0.2em] text-white/40 group-data-[collapsible=icon]:hidden px-2">Menu</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger className="!bg-transparent text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 rounded-md transition-all hover:scale-110 active:scale-95" />
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            Toggle sidebar
            <kbd className="text-[10px] font-mono opacity-70">⌘B</kbd>
          </TooltipContent>
        </Tooltip>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2 scrollbar-none">
        <SidebarMenu className="gap-1 group-data-[collapsible=icon]:gap-1.5 relative">
          {NAV_ITEMS.map((item) => {
            const isActive = 
              pathname === item.url || 
              pathname?.startsWith(`${item.url}/`);

            return (
              <SidebarMenuItem key={item.title} className="relative">
                {/* Subtle active indicator bar on the left for expanded state */}
                {isActive && (
                  <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-1 h-6 bg-white/20 rounded-r-md group-data-[collapsible=icon]:hidden" />
                )}
                
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  className={cn(
                    "transition-all duration-300 cursor-pointer !bg-transparent group/menu-item relative overflow-hidden",
                    // Expanded state styles
                    "h-[38px] px-3 flex items-center gap-3 rounded-xl",
                    isActive 
                      ? "bg-gradient-to-r from-white/10 to-transparent border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" 
                      : "hover:bg-white/5",
                    // Collapsed state styles
                    "group-data-[collapsible=icon]:!h-auto group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!bg-transparent group-data-[collapsible=icon]:!bg-none group-data-[collapsible=icon]:!border-none group-data-[collapsible=icon]:!shadow-none group-data-[collapsible=icon]:hover:!bg-transparent"
                  )}
                >
                  <Link href={item.url} className={cn(
                    "flex items-center w-full",
                    // Expanded: row
                    "flex-row gap-3",
                    // Collapsed: center the icon since text is hidden
                    "group-data-[collapsible=icon]:justify-center"
                  )}>
                    {/* Icon Wrapper */}
                    <div className="relative flex justify-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            "flex items-center justify-center transition-all duration-300",
                            // Subtle bounce effect on hover
                            "group-hover/menu-item:scale-105 active:scale-95",
                            // Expanded size
                            "w-[30px] h-[30px] rounded-lg",
                            // Collapsed size (perfectly sized for 48px width container)
                            "group-data-[collapsible=icon]:w-[36px] group-data-[collapsible=icon]:h-[36px] group-data-[collapsible=icon]:rounded-[12px]",
                            // Glassmorphic active state instead of solid white
                            isActive 
                              ? "bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-[0_4px_15px_rgba(0,0,0,0.2)] ring-1 ring-white/10" 
                              : "text-white/60 group-hover/menu-item:text-white bg-white/0 hover:bg-white/10 border border-transparent hover:border-white/10"
                          )}>
                             <item.icon 
                               className={cn(
                                 "shrink-0 transition-colors",
                                 // Expanded size
                                 "w-[16px] h-[16px]", 
                                 // Collapsed size (sleek, professional icon size)
                                 "group-data-[collapsible=icon]:w-[20px] group-data-[collapsible=icon]:h-[20px]"
                               )} 
                             />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="hidden group-data-[collapsible=icon]:block font-medium">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Text - HIDDEN in collapsed state for ultra sleek look */}
                    <span className={cn(
                      "font-medium transition-all duration-300 tracking-wide",
                      // Expanded size
                      "text-[13px]",
                      // Collapsed size: completely hidden!
                      "group-data-[collapsible=icon]:hidden",
                      isActive ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] font-semibold" : "text-white/60 group-hover/menu-item:text-white"
                    )}>
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3 mb-2 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pb-4">
        {/* Expanded Split Button */}
        <div className="flex w-full group-data-[collapsible=icon]:hidden">
          <button className="flex-1 bg-[#0C2822] hover:bg-[#061814] text-white font-bold py-[8px] px-4 rounded-l-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer outline-none border border-white/20 border-r-0 shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
            <HiOutlinePlus className="w-[16px] h-[16px]" strokeWidth={2.5} />
            <span className="text-[13px]">Invite</span>
          </button>
          <button className="bg-[#0C2822] hover:bg-[#061814] text-white px-2 border border-white/20 rounded-r-xl transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center cursor-pointer outline-none shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
            <HiOutlineChevronDown className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Collapsed Action Button (Invite) */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center w-full cursor-pointer group/invite">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-[36px] h-[36px] shrink-0 mx-auto text-white bg-[#0C2822] hover:bg-[#061814] rounded-[10px] flex flex-col items-center justify-center transition-all duration-300 group-hover/invite:scale-105 active:scale-95 shadow-[0_4px_15px_rgba(0,0,0,0.2)] border border-white/20">
                <HiOutlinePlus className="w-[18px] h-[18px]" strokeWidth={2.5} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              Invite
            </TooltipContent>
          </Tooltip>
          {/* Invite Text - Hidden in collapsed */}
          <span className="group-data-[collapsible=icon]:hidden">Invite</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
