"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  IconArrowLeft,
  IconLayout,
  IconChartBar,
  IconRocket,
  IconCloud,
  IconLoader2,
  IconCloudUpload,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNodesStore } from "../../store/nodes-store";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import ProfileDropdown from "@/components/kokonutui/profile-dropdown";
import { useUser } from "@/api-actions/hooks/user-hooks";
import { useAuthStore } from "@/store/auth-store";
import { Loader2 } from "lucide-react";

interface SubNavProps {
  strategyId: string;
}

export default function SubNav({ strategyId }: SubNavProps) {
  const {
    isSynced,
    isSaving,
    nodes,
    strategyName,
    strategyDescription,
    isCodeModified,
    setStrategyMeta,
    isRunning,
  } = useNodesStore();

  const pathname = usePathname();

  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleNameClick = () => {
    setTempName(strategyName);
    setIsEditing(true);
  };

  const handleNameSubmit = () => {
    const newName = tempName.trim() || strategyName;
    if (strategyId && (newName !== strategyName)) {
      setStrategyMeta(strategyId, newName, strategyDescription, isCodeModified);
    }
    setIsEditing(false);
  };

  const handleNameCancel = () => setIsEditing(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleNameSubmit();
    else if (e.key === "Escape") handleNameCancel();
  };

  const { data: user } = useUser();
  const { isAuthenticated } = useAuthStore();

  const isSyncBusy = isSaving;

  const tabs: { key: "build" | "analyse" | "live"; label: string; icon: typeof IconLayout; href: string }[] = [
    { key: "build", label: "Build", icon: IconLayout, href: `/workflow/${strategyId}` },
    { key: "analyse", label: "Analyse", icon: IconChartBar, href: `/workflow/${strategyId}/analyse` },
    { key: "live", label: "Live", icon: IconRocket, href: `/workflow/${strategyId}/live` },
  ];
  const isTabActive = (tab: (typeof tabs)[number]) =>
    tab.key === "build" ? pathname === tab.href : pathname?.startsWith(tab.href);

  return (
    <>
      {/* Outer bar — position:relative so we can absolute-center the toggle */}
      <div className="fixed top-0 left-0 right-0 h-[68px] bg-background/85 dark:bg-background/80 backdrop-blur-md border-b border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] z-40 transition-all duration-300">

        {/* ─── LEFT: Back + Logo + Editable Title ─── */}
        <div className="absolute left-0 top-0 bottom-0 flex items-center gap-3 pl-6 max-w-[42%] min-w-0">
          <Link href="/strategies">
            <button className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer shadow-xs">
              <IconArrowLeft className="size-4" />
            </button>
          </Link>

          {/* Brand Logo */}
          <div className="shrink-0 flex items-center p-1">
            <Image src="/favicon.svg" alt="Logo" width={26} height={26} className="h-7 w-7 select-none pointer-events-none" />
          </div>

          <div className="flex flex-col min-w-0 select-none">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleNameSubmit}
                  onKeyDown={handleKeyDown}
                  className="h-7 w-[160px] text-sm font-bold text-foreground bg-muted/60 border border-sidebar-primary/45 rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-sidebar-primary focus:border-sidebar-primary transition-all font-sans"
                  spellCheck="false"
                />
              ) : (
                <div
                  onClick={handleNameClick}
                  className="flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 rounded-lg py-0.5 px-1.5 -ml-1.5 transition-all group min-w-0"
                >
                  <h1 className="font-extrabold text-[15px] tracking-tight leading-none text-foreground group-hover:text-sidebar-primary truncate max-w-[200px]">
                    {strategyName}
                  </h1>
                  <IconCloud className="size-3.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              )}

              {isCodeModified && (
                <Badge className="text-[9px] py-0 px-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold tracking-wide shrink-0">
                  Custom
                </Badge>
              )}

              {/* Cloud sync status */}
              <div className="flex items-center select-none shrink-0">
                {isSyncBusy ? (
                  <span title="Auto-saving..." className="p-1 rounded-full text-amber-500 bg-amber-500/5">
                    <IconLoader2 className="size-3.5 animate-spin" />
                  </span>
                ) : !isSynced ? (
                  <span title="Unsaved changes — saving automatically..." className="p-1 rounded-full text-amber-500 animate-pulse">
                    <IconCloudUpload className="size-3.5" />
                  </span>
                ) : (
                  <span title="All changes saved ✓" className="p-1 rounded-full text-emerald-500">
                    <IconCloud className="size-3.5" />
                  </span>
                )}
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground/70 mt-0.5 truncate font-medium">
              {`${nodes.length} logic blocks`}
            </span>
          </div>
        </div>

        {/* ─── CENTER: Build / Analyse / Live ─── */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex p-0.5 bg-muted/60 border border-border/80 rounded-full shadow-xs">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={tab.href}
                className={cn(
                  "relative flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none border border-transparent",
                  isTabActive(tab)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="size-3.5" />
                <span>{tab.label}</span>
                {tab.key === "live" && isRunning && (
                  <span className="absolute -top-0.5 -right-0.5 flex size-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-background" />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* ─── RIGHT: Theme toggle + Profile ─── */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-6 shrink-0">
          <ThemeToggle className="scale-90" />
          {user ? (
            <ProfileDropdown className="scale-95 origin-right" />
          ) : isAuthenticated ? (
            <div className="w-8 h-8 flex items-center justify-center">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground/60" />
            </div>
          ) : null}
        </div>

      </div>
    </>
  );
}
