"use client";

import { useState } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Sparkles, 
  FileText, 
  ChevronDown, 
  HelpCircle, 
  Search, 
  SlidersHorizontal, 
  Activity,
  LayoutGrid,
  TableProperties,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  Edit3,
  Trash2,
  MoreVertical,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Strategy {
  id: string;
  name: string;
  status: "active" | "paused" | "error";
  created: string;
  performance: number;
  trades: number;
  author: string;
  type: string;
  description: string;
}

const TEMPLATE_STRATEGIES = [
  {
    name: "Golden Cross (SMA 50/200)",
    type: "Trend Following",
    performance: 18.4,
    description: "Classic golden crossover strategy on 1-day candles. Deploys with default parameters.",
    trades: 12,
  },
  {
    name: "BB Mean Reversion",
    type: "Mean Reversion",
    performance: 22.1,
    description: "Trades price reversals at the 2-standard-deviation bands. Perfect for rangebound markets.",
    trades: 85,
  },
  {
    name: "Grid Trading Bot",
    type: "Market Making",
    performance: 9.7,
    description: "Builds a grid of limit buy and sell orders to capture constant micro-volatility.",
    trades: 620,
  },
  {
    name: "Arbitrage Scalper Pro",
    type: "Arbitrage",
    performance: -2.3,
    description: "Scans cross-exchange price differences in real-time to execute micro-arbitrages.",
    trades: 1240,
  }
];

export default function DashboardPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDeployTemplate = (template: typeof TEMPLATE_STRATEGIES[0]) => {
    const newStrategy: Strategy = {
      id: Math.random().toString(36).substr(2, 9),
      name: template.name,
      status: "active",
      created: "Just now",
      performance: template.performance,
      trades: template.trades,
      author: "System",
      type: template.type,
      description: template.description
    };
    setStrategies((prev) => [newStrategy, ...prev]);
    setIsDialogOpen(false);
  };

  const handleDeployNewStrategy = () => {
    const newStrategy: Strategy = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Custom strategy #${strategies.length + 1}`,
      status: "active",
      created: "Just now",
      performance: 0.0,
      trades: 0,
      author: "User",
      type: "Custom",
      description: "A custom strategy built from scratch in the workspace."
    };
    setStrategies((prev) => [newStrategy, ...prev]);
  };

  const handleDeleteStrategy = (id: string) => {
    setStrategies((prev) => prev.filter((s) => s.id !== id));
  };

  const handleBacktestStrategy = (id: string) => {
    setStrategies((prev) => prev.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          trades: s.trades + 1,
          performance: Number((s.performance + (Math.random() * 5 - 2)).toFixed(1))
        };
      }
      return s;
    }));
  };

  const handleDeployLiveStrategy = (id: string) => {
    setStrategies((prev) => prev.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          status: s.status === "active" ? "paused" : "active"
        };
      }
      return s;
    }));
  };

  const handleEditStrategy = (id: string) => {
    const strat = strategies.find(s => s.id === id);
    if (!strat) return;
    const newName = prompt("Rename Strategy:", strat.name);
    if (newName && newName.trim()) {
      setStrategies((prev) => prev.map((s) => {
        if (s.id === id) {
          return { ...s, name: newName.trim() };
        }
        return s;
      }));
    }
  };

  // Filter strategies based on search query
  const filteredStrategies = strategies.filter(strat => 
    strat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    strat.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full max-w-[1400px] mx-auto w-full relative min-h-[calc(100vh-4rem)] pb-20 px-4 md:px-6">
      
      {/* Decorative Atmospheric Tech Grid & Radial Blurs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-[0.3] dark:opacity-[0.4]">
        <div className="absolute top-[-5%] left-[10%] w-[500px] h-[500px] bg-primary/10 blur-[130px] rounded-full"></div>
        <div className="absolute top-[25%] right-[-5%] w-[550px] h-[550px] bg-purple-500/5 blur-[160px] rounded-full"></div>
        <div className="absolute top-[60%] left-[-5%] w-[450px] h-[450px] bg-blue-500/5 blur-[140px] rounded-full"></div>
        
        {/* Crisp grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800b_1px,transparent_1px),linear-gradient(to_bottom,#8080800b_1px,transparent_1px)] bg-[size:16px_28px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_80%,transparent_100%)]"></div>
      </div>

      {/* Quick Launch Section Header */}
      <div className="flex items-center justify-between mb-4 mt-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-3.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]"></span>
          <h2 className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-muted-foreground/70">Launch Console</h2>
        </div>
      </div>
      
      {/* Top Action Ribbon - Redesigned to be extremely premium and soft on the eyes */}
      <div className="bg-card/30 dark:bg-card/15 border border-border/35 dark:border-border/20 rounded-2xl p-1.5 mb-8 grid grid-cols-3 w-full divide-x divide-border/30 dark:divide-border/15 backdrop-blur-md shadow-sm">
        
        {/* Create Strategy */}
        <button 
          onClick={handleDeployNewStrategy}
          title="Build a new trading algorithm from scratch."
          className="flex flex-col items-center justify-center py-3.5 px-1 md:py-5 md:px-5 hover:bg-muted/40 dark:hover:bg-secondary/25 transition-all rounded-xl group relative cursor-pointer outline-none border-none"
        >
          {/* Top glow dot */}
          <span className="absolute top-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary opacity-30 group-hover:opacity-100 group-hover:scale-125 transition-all shadow-[0_0_8px_var(--primary)]"></span>
          
          <div className="flex flex-col md:flex-row items-center gap-2.5 md:gap-3.5 w-full md:w-auto">
            <div className="shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/35 transition-colors">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-[11px] md:text-[14px] font-semibold text-foreground leading-tight">
                <span className="block md:hidden">Create</span>
                <span className="hidden md:block">Create Strategy</span>
              </h3>
              <p className="hidden md:block text-[11px] md:text-[12px] text-muted-foreground/80 mt-1 leading-snug">Build a new trading algorithm from scratch.</p>
            </div>
          </div>
        </button>

        {/* Generate with AI */}
        <button 
          onClick={handleDeployNewStrategy}
          title="Describe your strategy and let AI build it."
          className="flex flex-col items-center justify-center py-3.5 px-1 md:py-5 md:px-5 hover:bg-muted/40 dark:hover:bg-secondary/25 transition-all rounded-xl group relative cursor-pointer outline-none border-none"
        >
          {/* Top glow dot */}
          <span className="absolute top-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-500 opacity-30 group-hover:opacity-100 group-hover:scale-125 transition-all shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
          
          <div className="flex flex-col md:flex-row items-center gap-2.5 md:gap-3.5 w-full md:w-auto">
            <div className="shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 group-hover:border-purple-500/35 transition-colors">
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-[11px] md:text-[14px] font-semibold text-foreground leading-tight">
                <span className="block md:hidden">AI Gen</span>
                <span className="hidden md:block">Generate with AI</span>
              </h3>
              <p className="hidden md:block text-[11px] md:text-[12px] text-muted-foreground/80 mt-1 leading-snug">Describe your strategy and let AI build it.</p>
            </div>
          </div>
        </button>

        {/* Browse Templates (Linked with Shadcn Dialog) */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button 
              title="Start with pre-built strategies like MA Cross."
              className="flex flex-col items-center justify-center py-3.5 px-1 md:py-5 md:px-5 hover:bg-muted/40 dark:hover:bg-secondary/25 transition-all rounded-xl group relative cursor-pointer outline-none border-none"
            >
              {/* Top glow dot */}
              <span className="absolute top-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-500 opacity-30 group-hover:opacity-100 group-hover:scale-125 transition-all shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span>
              
              <div className="flex flex-col md:flex-row items-center gap-2.5 md:gap-3.5 w-full md:w-auto">
                <div className="shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 group-hover:bg-sky-500/20 group-hover:border-sky-500/35 transition-colors">
                  <FileText className="w-4 h-4 text-sky-500" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-[11px] md:text-[14px] font-semibold text-foreground leading-tight">
                    <span className="block md:hidden">Templates</span>
                    <span className="hidden md:block">Browse Templates</span>
                  </h3>
                  <p className="hidden md:block text-[11px] md:text-[12px] text-muted-foreground/80 mt-1 leading-snug">Start with pre-built strategies like MA Cross.</p>
                </div>
              </div>
            </button>
          </DialogTrigger>

          <DialogContent 
            style={{ maxWidth: "1200px", width: "95%" }}
            className="bg-background/98 border border-border/60 rounded-xl p-6 md:p-10 shadow-2xl backdrop-blur-md"
          >
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
                <Cpu className="w-6.5 h-6.5 text-primary" /> Pre-built Trading Templates
              </DialogTitle>
              <DialogDescription className="text-xs md:text-sm text-muted-foreground mt-1">
                Instantly deploy premium quantitative frameworks to your live systematic workspace with a single click.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {TEMPLATE_STRATEGIES.map((temp) => (
                <Card 
                  key={temp.name}
                  size="sm"
                  className="border border-border/40 hover:border-primary/30 transition-all group min-h-[260px] justify-between"
                >
                  <CardHeader className="pb-0 gap-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 bg-primary/10 text-primary rounded">
                        {temp.type}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold",
                        temp.performance >= 0 ? "text-emerald-500" : "text-red-500"
                      )}>
                        {temp.performance >= 0 ? "+" : ""}{temp.performance}%
                      </span>
                    </div>
                    <CardTitle className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {temp.name}
                    </CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground leading-relaxed">
                      {temp.description}
                    </CardDescription>
                  </CardHeader>

                  <CardFooter className="pb-4">
                    <Button 
                      size="sm"
                      onClick={() => handleDeployTemplate(temp)}
                      className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-semibold h-8 rounded-lg cursor-pointer"
                    >
                      Deploy Template
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

      </div>

      {/* Structured Workspace Section */}
      <div className="flex flex-col gap-6">
        
        {/* Workspace Top Actions Control Bar (Eye-friendly cleaner buttons) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border border-border/30 dark:border-border/20 rounded-xl bg-card/45 dark:bg-card/25 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Active workspace</span>
          </div>
          
          {/* Quick Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/70" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search strategies..." 
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-background border border-border/40 dark:border-border/30 focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/50 transition-colors" 
              />
            </div>

            {/* Desktop View Switcher Controls */}
            <div className="hidden md:flex items-center border border-border/40 dark:border-border/30 rounded-md p-0.5 bg-background shrink-0">
              <button 
                onClick={() => setViewMode("card")}
                className={cn(
                  "p-1 rounded transition-colors cursor-pointer",
                  viewMode === "card" 
                    ? "bg-muted text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1 rounded transition-colors cursor-pointer",
                  viewMode === "table" 
                    ? "bg-muted text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Table View"
              >
                <TableProperties className="w-3.5 h-3.5" />
              </button>
            </div>

            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 px-2.5 bg-background border-border/40 dark:border-border/30 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer">
              <SlidersHorizontal className="w-3 h-3" /> Filters
            </Button>
          </div>
        </div>

        {/* Data Grid / Table Section */}
        <div className="w-full">
          {filteredStrategies.length === 0 ? (
            /* Standalone elegant Empty State */
            <div className="flex flex-col items-center justify-center text-center py-20 px-4 group border border-border/40 dark:border-border/30 rounded-xl bg-card/45 dark:bg-card/25 backdrop-blur-md shadow-sm">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl scale-150 animate-pulse"></div>
                <div className="w-14 h-14 rounded-full border border-dashed border-border/60 dark:border-border/50 flex items-center justify-center relative bg-background/80 dark:bg-background/50 group-hover:border-primary/40 transition-colors duration-300">
                  <Activity className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
                </div>
              </div>
              
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {searchQuery ? "No Strategies Match Search" : "No Active Trading Strategies"}
              </h3>
              <p className="text-[12px] md:text-[13px] text-muted-foreground/75 max-w-[340px] mx-auto mb-6 leading-relaxed">
                {searchQuery 
                  ? "Try searching for a different keyword or deploying a new strategy from templates."
                  : "Connect an exchange account, backtest a codebase, or deploy a live systematic module to start monitoring logs."
                }
              </p>
              
              {!searchQuery && (
                <Button 
                  onClick={handleDeployNewStrategy}
                  size="sm" 
                  className="bg-primary hover:bg-primary/90 text-white gap-2 font-medium px-4 h-8.5 shadow-md shadow-primary/10 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Deploy Strategy
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Grid View (Desktop) / Always Card (Mobile) */}
              <div className={cn(
                "grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full",
                viewMode === "table" && "md:hidden"
              )}>
                {filteredStrategies.map((strat) => (
                  <Card 
                    key={strat.id}
                    size="sm"
                    className="border border-border/40 hover:border-primary/20 dark:hover:border-primary/30 transition-all hover:shadow-lg relative group justify-between rounded-2xl overflow-hidden bg-card/60 dark:bg-card/45"
                  >
                    <CardHeader className="pb-0 gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/5">
                          {strat.type}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border",
                            strat.status === "active" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/10",
                            strat.status === "paused" && "bg-amber-500/10 text-amber-500 border-amber-500/10",
                            strat.status === "error" && "bg-red-500/10 text-red-500 border-red-500/10"
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              strat.status === "active" && "bg-emerald-500 animate-pulse",
                              strat.status === "paused" && "bg-amber-500",
                              strat.status === "error" && "bg-red-500"
                            )}></span>
                            {strat.status}
                          </span>

                          {/* Three Dots Menu for Actions (Rename, Delete) */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="w-7 h-7 p-0 rounded-full hover:bg-muted cursor-pointer shrink-0 text-muted-foreground/80 hover:text-foreground"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 bg-popover/95 border border-border/50 backdrop-blur-md">
                              <DropdownMenuItem onClick={() => handleEditStrategy(strat.id)} className="cursor-pointer">
                                <Edit3 className="w-3.5 h-3.5 mr-2" /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteStrategy(strat.id)} 
                                variant="destructive"
                                className="text-red-500 hover:text-red-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div>
                        <CardTitle className="text-[14px] font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                          {strat.name}
                        </CardTitle>
                        <CardDescription className="text-[12px] text-muted-foreground/80 line-clamp-2 leading-relaxed mt-1">
                          {strat.description}
                        </CardDescription>
                      </div>
                    </CardHeader>

                    {/* Redesigned Metrics block to look extremely eye-friendly & professional */}
                    <CardContent className="pt-4">
                      <div className="bg-muted/40 dark:bg-secondary/15 border border-border/20 dark:border-border/10 rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-0.5">Perf</span>
                          <span className={cn(
                            "font-extrabold text-[13px] tracking-tight",
                            strat.performance >= 0 ? "text-emerald-500" : "text-red-500"
                          )}>
                            {strat.performance >= 0 ? "+" : ""}{strat.performance}%
                          </span>
                        </div>
                        <div className="flex flex-col items-center border-x border-border/20 dark:border-border/10">
                          <span className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-0.5">Trades</span>
                          <span className="font-extrabold text-[13px] text-foreground tracking-tight">{strat.trades}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-0.5">Created</span>
                          <span className="text-[10px] font-bold text-muted-foreground/90 mt-0.5 tracking-tight">{strat.created}</span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="flex-col pb-4.5 pt-0">
                      {/* Operational Toolbar (Comfortable sizes, perfect active contrasts) */}
                      <div className="w-full grid grid-cols-2 gap-2.5">
                        <Button 
                          onClick={() => handleBacktestStrategy(strat.id)}
                          variant="default" 
                          size="sm" 
                          title="Run Simulated Backtest"
                          className="h-9 text-[11px] gap-2 px-3 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-bold justify-center rounded-xl shadow-sm border border-transparent shadow-blue-500/10 active:scale-98 transition-all"
                        >
                          <Activity className="w-3.5 h-3.5" /> <span>Backtest</span>
                        </Button>
                        <Button 
                          onClick={() => handleDeployLiveStrategy(strat.id)}
                          variant="default" 
                          size="sm" 
                          title={strat.status === "active" ? "Pause Execution" : "Resume Execution"}
                          className={cn(
                            "h-9 text-[11px] gap-2 px-3 cursor-pointer font-bold justify-center rounded-xl shadow-sm border border-transparent active:scale-98 transition-all",
                            strat.status === "active" 
                              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10"
                              : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/10"
                          )}
                        >
                          {strat.status === "active" ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-white text-white" /> <span>Pause Bot</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-white text-white" /> <span>Go Live</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Table View (Desktop Only) */}
              <div className={cn(
                "overflow-x-auto no-scrollbar border border-border/40 dark:border-border/30 rounded-xl bg-card/45 dark:bg-card/25 backdrop-blur-md shadow-sm",
                viewMode === "table" ? "hidden md:block" : "hidden"
              )}>
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-border/20 bg-muted/5 text-[10px] font-bold text-muted-foreground/75 tracking-widest uppercase">
                      <th className="px-4 py-3">Strategy Name</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Created</th>
                      <th className="px-4 py-3 text-center">Performance</th>
                      <th className="px-4 py-3 text-center">Trades</th>
                      <th className="px-4 py-3 text-center">Author</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {filteredStrategies.map((strat) => (
                      <tr key={strat.id} className="hover:bg-muted/15 transition-colors group">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded bg-primary/5 border border-primary/10 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-primary">{strat.type[0]}</span>
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block">
                                {strat.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground/85 block mt-0.5">{strat.description}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                            strat.status === "active" && "bg-emerald-500/10 text-emerald-500",
                            strat.status === "paused" && "bg-amber-500/10 text-amber-500",
                            strat.status === "error" && "bg-red-500/10 text-red-500"
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              strat.status === "active" && "bg-emerald-500 animate-pulse",
                              strat.status === "paused" && "bg-amber-500",
                              strat.status === "error" && "bg-red-500"
                            )}></span>
                            {strat.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center text-xs text-muted-foreground">
                          {strat.created}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-xs">
                          <span className={strat.performance >= 0 ? "text-emerald-500" : "text-red-500"}>
                            {strat.performance >= 0 ? "+" : ""}{strat.performance}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center text-xs text-foreground font-semibold">
                          {strat.trades}
                        </td>
                        <td className="px-4 py-3.5 text-center text-xs text-muted-foreground">
                          {strat.author}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              onClick={() => handleBacktestStrategy(strat.id)}
                              variant="default" 
                              size="sm" 
                              className="h-7 text-[10px] gap-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-bold px-2 rounded.5 border border-transparent shadow-sm shadow-blue-500/10" 
                              title="Run Simulated Backtest"
                            >
                              <Activity className="w-3 h-3" /> <span>Backtest</span>
                            </Button>
                            <Button 
                              onClick={() => handleDeployLiveStrategy(strat.id)}
                              variant="ghost" 
                              size="sm" 
                              className={cn(
                                "h-7 text-[10px] gap-1 cursor-pointer",
                                strat.status === "active" 
                                  ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/5"
                                  : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/5"
                              )}
                              title={strat.status === "active" ? "Pause Execution" : "Resume Execution"}
                            >
                              {strat.status === "active" ? (
                                <>
                                  <Square className="w-3 h-3" /> <span>Pause</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3" /> <span>Live</span>
                                </>
                              )}
                            </Button>

                            {/* Dropdown Menu for Edit/Delete */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="w-7 h-7 rounded-full hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 bg-popover border border-border/50">
                                <DropdownMenuItem onClick={() => handleEditStrategy(strat.id)} className="cursor-pointer">
                                  <Edit3 className="w-3.5 h-3.5 mr-2" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteStrategy(strat.id)} 
                                  variant="destructive"
                                  className="text-red-500 hover:text-red-600 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Help Button */}
      <div className="fixed bottom-6 right-6 z-50">
         <Button variant="outline" size="icon" className="rounded-full shadow-sm w-9 h-9 bg-background/80 hover:bg-secondary/95 border-border/50 text-muted-foreground hover:text-foreground transition-all duration-200">
           <HelpCircle className="w-4.5 h-4.5" />
         </Button>
      </div>

    </div>
  );
}
