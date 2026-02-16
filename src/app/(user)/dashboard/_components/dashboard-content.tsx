"use client";

import { useState } from "react";
import { Plus, Sparkles, FileText, ArrowDown, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


const tabs = ["All", "Recents", "Created by Me", "Folders", "Unsorted"];

const actionCards = [
    { icon: Plus, label: "Create a Blank File" },
    { icon: Sparkles, label: "Generate an AI Diagram" },
    { icon: FileText, label: "Generate an AI outline" },
];

export function DashboardContent() {
    const [activeTab, setActiveTab] = useState("All");

    return (
        <main className="flex-1 flex flex-col bg-background">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-2.5 border-b border-border/40">
                {/* Tabs */}
                <nav className="flex gap-0.5">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1.5 text-[13px] rounded transition-colors ${activeTab === tab
                                ? "bg-accent text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>



                {/* Right Section */}
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 cursor-pointer border border-border/40 hover:bg-accent transition-colors">
                        <AvatarFallback className="bg-orange-500 text-white text-xs font-medium">G</AvatarFallback>
                    </Avatar>
                </div>
            </header>

            {/* Action Cards */}
            <div className="px-6 pt-5 pb-4">
                <div className="grid grid-cols-3 gap-4 max-w-3xl">
                    {actionCards.map((card) => (
                        <button
                            key={card.label}
                            className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border border-border/60 bg-card/50 hover:bg-accent/30 hover:border-border transition-all"
                        >
                            <card.icon className="h-10 w-10 text-muted-foreground/70" strokeWidth={1} />
                            <span className="text-sm text-foreground/90">{card.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Header */}
            <div className="px-6 pt-2">
                <div className="flex items-center py-2 border-b border-border/40">
                    <div className="flex-[2.5] px-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Name</span>
                    </div>
                    <div className="flex-1 px-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Location</span>
                    </div>
                    <div className="flex-[0.7] px-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Created</span>
                    </div>
                    <div className="flex-[0.7] px-2 flex items-center gap-1">
                        <ArrowDown className="h-3 w-3 text-foreground" />
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground">Edited</span>
                    </div>
                    <div className="flex-[0.7] px-2 text-right">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Comments</span>
                    </div>
                    <div className="flex-[0.7] px-2 text-right">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Author</span>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            <div className="flex-1 flex items-center justify-center py-20">
                <p className="text-sm text-muted-foreground/60">Your list is empty</p>
            </div>

            {/* Help Button */}
            <Button
                size="icon"
                variant="secondary"
                className="fixed bottom-5 right-5 h-9 w-9 rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
                <HelpCircle className="h-4 w-4" />
            </Button>
        </main >
    );
}
