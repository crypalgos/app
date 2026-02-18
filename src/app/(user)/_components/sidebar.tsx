"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Zap,
  Layers,
  BarChart3,
  BookOpen,
  Plus,
  ChevronDown,
  FlaskConical,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { icon: Bot, label: "Strategies", href: "/dashboard" },
  { icon: FlaskConical, label: "Backtests", href: "/backtests" },
  { icon: Zap, label: "Live Trading", href: "/live-trading", badge: "ACTIVE" },
  { icon: Layers, label: "Exchanges", href: "/exchanges" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: BookOpen, label: "Documentation", href: "/docs" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
    >
      {/* Logo */}
      <SidebarHeader className={cn("pt-5 pb-6", isCollapsed ? "px-2" : "px-5")}>
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          {isCollapsed ? (
            <img
              src="/favicon.svg"
              alt="CrypAlgos"
              width={24}
              height={24}
              className="shrink-0 mx-auto"
            />
          ) : (
            <>
              <img
                src="/logo_light.svg"
                alt="CrypAlgos"
                width={160}
                height={160}
                className="block dark:hidden"
              />
              <img
                src="/logo_dark.svg"
                alt="CrypAlgos"
                width={160}
                height={160}
                className="hidden dark:block"
              />
            </>
          )}
        </Link>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className={cn("flex-1", isCollapsed ? "px-1.5" : "px-3")}>
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            const linkContent = (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "relative flex items-center rounded-lg font-medium transition-all duration-200 group",
                  isCollapsed
                    ? "justify-center p-2.5 text-[13px]"
                    : "gap-3 px-3 py-2.5 text-[13.5px]",
                  isActive
                    ? "bg-primary/8 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-[0_0_8px_rgba(var(--color-primary),0.4)]" />
                )}

                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                  strokeWidth={1.8}
                />

                {!isCollapsed && (
                  <>
                    <span className="truncate">{item.label}</span>

                    {item.badge && (
                      <span className="ml-auto text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md tracking-wide bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="flex items-center gap-2"
                  >
                    {item.label}
                    {item.badge && (
                      <span className="text-[9px] font-semibold uppercase px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {item.badge}
                      </span>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>
      </SidebarContent>

      {/* New Strategy Button */}
      <SidebarFooter className={cn(isCollapsed ? "p-2" : "p-4")}>
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center justify-center w-full h-9 rounded-lg bg-primary hover:brightness-110 transition-all duration-200 shadow-sm">
                <Plus
                  className="h-4 w-4 text-primary-foreground"
                  strokeWidth={2.5}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">New Strategy</TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex rounded-xl overflow-hidden bg-primary hover:brightness-110 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-primary/15">
            <button className="flex-1 flex items-center justify-center gap-2.5 h-10 text-[13px] font-semibold text-primary-foreground">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              New Strategy
            </button>
            <div className="w-px bg-white/15 my-2" />
            <button className="flex items-center justify-center w-9 h-10 text-primary-foreground hover:bg-white/10 transition-colors">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
