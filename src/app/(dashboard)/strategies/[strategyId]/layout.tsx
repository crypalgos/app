"use client";

import { ReactNode, useState, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconStar,
  IconStarFilled,
  IconEdit,
  IconChevronRight,
  IconCpu,
  IconClock,
  IconScale,
  IconGitBranch,
  IconRocket,
  IconSettings,
  IconCalendar,
  IconExchange
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStrategy, useSetGoldenVersion } from "@/api-actions/hooks/strategy-hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StrategyLayoutProps {
  children: ReactNode;
}

export default function StrategyDetailLayout({ children }: StrategyLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const strategyId = params?.strategyId as string;

  const { data: strategy, isLoading } = useStrategy(strategyId);
  const [isFavorite, setIsFavorite] = useState(strategy?.is_golden || false);
  const { mutateAsync: setGolden } = useSetGoldenVersion();

  useEffect(() => {
    if (strategy) {
      setIsFavorite(strategy.is_golden || false);
    }
  }, [strategy]);

  // Define tabs with paths, labels and icons
  const tabs = [
    { label: "Overview", path: `/strategies/${strategyId}`, icon: IconCpu },
    { label: "Backtests", path: `/strategies/${strategyId}/backtests`, icon: IconClock },
    { label: "Optimization", path: `/strategies/${strategyId}/optimizations`, icon: IconSettings },
    { label: "Walkforward", path: `/strategies/[strategyId]/walkforwards`.replace("[strategyId]", strategyId), icon: IconScale },
    { label: "Versions", path: `/strategies/${strategyId}/versions`, icon: IconGitBranch },
    { label: "Deployments", path: `/strategies/${strategyId}/deployments`, icon: IconRocket },
  ];

  const handleRun = () => {
    // Navigate to workflow editor to run / edit
    router.push(`/workflow/${strategyId}`);
  };

  const isDetailPage = /^\/strategies\/[^/]+\/(backtests|optimizations|walkforwards|montecarlos)\/[^/]+$/.test(pathname);

  if (isDetailPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col gap-5 w-full px-6 lg:px-8 xl:px-12 pb-20 pt-6 transition-all duration-300 animate-in fade-in">
      {/* Premium Strategy Detail Header */}
      <div className="flex flex-col">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-3/4 max-w-2xl" />
                <Skeleton className="h-4 w-1/2 max-w-md mt-2" />
              </div>
            ) : (
              <>
                {/* Top Status Bar (Badges separated from Title) */}
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="secondary" className="px-2.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground font-medium border-border/40 shadow-sm">
                    Version {strategy?.current_version ?? 1}
                  </Badge>
                  {isFavorite && (
                    <Badge className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium flex items-center gap-1.5 shadow-sm">
                      <IconStarFilled className="w-3 h-3" />
                      Golden Strategy
                    </Badge>
                  )}
                  <button 
                    onClick={async () => {
                      const targetState = !isFavorite;
                      setIsFavorite(targetState);
                      try {
                        await setGolden({ strategyId: strategyId, version: strategy?.current_version || 0 });
                        toast.success(targetState ? "Golden version set." : "Golden version removed.");
                      } catch {
                        setIsFavorite(!targetState);
                        toast.error("Failed to update golden version.");
                      }
                    }}
                    className="p-1 rounded-md border border-border/50 bg-background hover:bg-muted/50 transition-colors text-muted-foreground hover:text-amber-500 cursor-pointer shadow-sm flex items-center justify-center"
                    title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    {isFavorite ? <IconStarFilled className="w-3.5 h-3.5 text-amber-500" /> : <IconStar className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Massive Clean Title & Description */}
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground truncate pb-1">
                  {strategy?.name}
                </h1>
                <p className="text-[15px] md:text-base text-muted-foreground mt-2 max-w-[800px] leading-relaxed">
                  {strategy?.description || "No description provided. Add a description in the editor to help your team understand this strategy's logic."}
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 pt-2 shrink-0">
            <Button
              onClick={handleRun}
              className="relative group h-11 px-7 rounded-full gap-2 cursor-pointer shrink-0 text-white font-semibold text-[14px] transition-all duration-300 bg-gradient-to-b from-[#FD428E] to-[#0E46FF] border border-white/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_6px_15px_-4px_rgba(14,70,255,0.4)] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_10px_25px_-5px_rgba(14,70,255,0.6)] hover:-translate-y-0.5 hover:scale-[1.02] overflow-hidden w-full md:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <IconEdit className="w-4 h-4 relative z-10 drop-shadow-sm" />
              <span className="relative z-10 drop-shadow-sm">View / Edit</span>
            </Button>
          </div>
        </div>

        {/* Structured Metadata Stats Bar */}
        {!isLoading && (
          <div className="flex items-center gap-6 md:gap-10 mt-5 pt-4 border-t border-border/40 overflow-x-auto no-scrollbar">
            <div className="flex flex-col gap-1.5 min-w-fit">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase">Created</span>
              <span className="text-[14px] font-medium text-foreground">{strategy?.created_at ? new Date(strategy.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A"}</span>
            </div>
            
            <div className="w-px h-8 bg-border/50 shrink-0" />
            
            <div className="flex flex-col gap-1.5 min-w-fit">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase">Last Updated</span>
              <span className="text-[14px] font-medium text-foreground">{strategy?.updated_at ? new Date(strategy.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A"}</span>
            </div>
            
            <div className="w-px h-8 bg-border/50 shrink-0" />
            
            <div className="flex flex-col gap-1.5 min-w-fit">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase">Exchange Target</span>
              <div className="flex items-center gap-1.5">
                <IconExchange className="w-3.5 h-3.5 text-primary" />
                <span className="text-[14px] font-medium text-foreground uppercase tracking-wide">{(() => {
                  const dataNode = strategy?.canvas_json?.nodes?.find((n: any) => n.type === "dataNode");
                  return (dataNode?.data as any)?.source || "DELTA";
                })()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Premium Animated Pill Tabs */}
      <div className="w-full overflow-x-auto no-scrollbar pb-2">
        <div className="flex items-center p-1.5 bg-muted/40 border border-border/40 rounded-full w-fit relative">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;
            
            return (
              <Link 
                key={tab.label}
                href={tab.path}
                className={cn(
                  "relative flex items-center justify-center gap-1.5 px-4 h-9 text-[13.5px] font-medium transition-colors duration-200 whitespace-nowrap outline-none rounded-full cursor-pointer",
                  isActive 
                    ? "text-primary-foreground font-semibold" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
                
                {/* Active Sliding Background */}
                {isActive && (
                  <motion.div 
                    layoutId="pillActiveTab"
                    className="absolute inset-0 bg-primary shadow-[0_2px_10px_rgba(14,70,255,0.3)] rounded-full z-0" 
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Sub-page Content */}
      <div className="flex-1 mt-2">
        {children}
      </div>
    </div>
  );
}
