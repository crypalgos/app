"use client";

import Link from "next/link";
import {
    Grid2X2,
    Bot,
    Sparkles,
    Layers,
    Github,
    Lock,
    Archive,
    ChevronDown,
    FolderPlus,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";


export function DashboardSidebar() {
    const navItems = [
        { icon: Bot, label: "Eraserbot", shortcut: "B", badge: "BETA" },
        { icon: Sparkles, label: "AI Presets", shortcut: "C" },
        { icon: Layers, label: "Team Templates", shortcut: "T" },
        { icon: Github, label: "Github Sync", shortcut: "G", badge: "BETA" },
        { icon: Lock, label: "Private Files", badge: "UPGRADE" },
        { icon: Archive, label: "Archive", shortcut: "E" },
    ];

    return (
        <Sidebar className="border-r border-border/40">
            {/* Logo */}
            <SidebarHeader className="p-4 pb-3">
                <Link href="/" className="flex items-center gap-2">
                    <img
                        src="/logo_light.svg"
                        alt="CrypAlgos"
                        width={120}
                        height={120}
                        className="block dark:hidden"
                    />
                    <img
                        src="/logo_dark.svg"
                        alt="CrypAlgos"
                        width={120}
                        height={120}
                        className="hidden dark:block"
                    />
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-2">
                {/* All Files */}
                <SidebarGroup className="py-1">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton className="bg-sidebar-accent hover:bg-sidebar-accent">
                                    <Grid2X2 className="h-3.5 w-3.5" />
                                    <span className="text-sm">All Files</span>
                                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center rounded bg-background/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                                        A
                                    </kbd>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Team Folders */}
                <SidebarGroup className="py-1">
                    <SidebarGroupLabel className="flex items-center justify-between px-2 h-8">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Team folders</span>
                        <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-sidebar-accent">
                            <FolderPlus className="h-3.5 w-3.5" />
                        </Button>
                    </SidebarGroupLabel>
                </SidebarGroup>

                {/* Spacer to push footer items down */}
                <div className="flex-1" />

                {/* Footer Navigation */}
                <SidebarGroup className="mt-auto pb-1">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.label}>
                                    <SidebarMenuButton className="h-8 hover:bg-sidebar-accent/50">
                                        <item.icon className="h-3.5 w-3.5" />
                                        <span className="text-[13px]">{item.label}</span>
                                        {item.badge && (
                                            <span className={`ml-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${item.badge === "BETA" ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                                                }`}>
                                                {item.badge}
                                            </span>
                                        )}
                                        {item.shortcut && !item.badge && (
                                            <kbd className="ml-auto pointer-events-none inline-flex select-none items-center font-mono text-[10px] text-muted-foreground">
                                                {item.shortcut}
                                            </kbd>
                                        )}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* New File Button */}
            <SidebarFooter className="p-3 pt-2">
                <div className="flex">
                    <Button className="flex-1 rounded-r-none h-9 text-sm font-medium gap-2">
                        New File
                        <span className="flex gap-0.5">
                            <kbd className="pointer-events-none inline-flex h-4 select-none items-center rounded bg-primary-foreground/20 px-1 font-mono text-[9px] font-medium text-primary-foreground">
                                Alt
                            </kbd>
                            <kbd className="pointer-events-none inline-flex h-4 select-none items-center rounded bg-primary-foreground/20 px-1 font-mono text-[9px] font-medium text-primary-foreground">
                                N
                            </kbd>
                        </span>
                    </Button>
                    <Button className="rounded-l-none border-l border-primary-foreground/20 px-2.5 h-9">
                        <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
