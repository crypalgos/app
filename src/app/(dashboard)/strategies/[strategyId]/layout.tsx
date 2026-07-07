"use client";

import { ReactNode, useState, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  IconStar, 
  IconStarFilled, 
  IconPlayerPlay, 
  IconChevronRight,
  IconCpu,
  IconClock,
  IconChartBar,
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
    { label: "Monte Carlo", path: `/strategies/${strategyId}/montecarlos`, icon: IconChartBar },
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
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full px-4 md:px-6 pb-20 pt-2 animate-in fade-in duration-300">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
        <Link href="/strategies" className="hover:text-foreground transition-colors">
          Strategies
        </Link>
        <IconChevronRight className="w-3 h-3" />
        <span className="text-foreground truncate max-w-[200px]">
          {isLoading ? <Skeleton className="h-3.5 w-24 inline-block" /> : strategy?.name}
        </span>
      </div>

      {/* Strategy Detail Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              {isLoading ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
                  {strategy?.name}
                </h1>
              )}
              
              {!isLoading && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-semibold text-xs py-0.5 bg-secondary/80 border-secondary-border">
                    v1.0
                  </Badge>
                  {isFavorite && (
                    <Badge className="font-semibold text-xs py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/15">
                      Golden
                    </Badge>
                  )}
                </div>
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
                className="p-1.5 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-amber-500 cursor-pointer"
                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                {isFavorite ? (
                  <IconStarFilled className="w-4 h-4 text-amber-500" />
                ) : (
                  <IconStar className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col gap-2 mt-2">
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-3 w-48" />
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-[600px] line-clamp-1">
                  {strategy?.description || "No description provided."}
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground font-mono flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <IconCalendar className="w-3.5 h-3.5 text-muted-foreground/80" />
                    Created: <span className="text-foreground font-semibold">{strategy?.created_at ? new Date(strategy.created_at).toLocaleString() : "N/A"}</span>
                  </span>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="flex items-center gap-1.5">
                    <IconClock className="w-3.5 h-3.5 text-muted-foreground/80" />
                    Updated: <span className="text-foreground font-semibold">{strategy?.updated_at ? new Date(strategy.updated_at).toLocaleString() : "N/A"}</span>
                  </span>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="flex items-center gap-1.5">
                    <IconExchange className="w-3.5 h-3.5 text-muted-foreground/80" />
                    Exchange: <span className="text-foreground font-semibold uppercase">{(() => {
                      const dataNode = strategy?.canvas_json?.nodes?.find((n: any) => n.type === "dataNode");
                      return (dataNode?.data as any)?.source || "Delta";
                    })()}</span>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleRun}
            className="w-full md:w-auto font-semibold shadow-sm cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2"
          >
            <IconPlayerPlay className="w-4 h-4 fill-current" />
            Run / Build
          </Button>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="border-b border-border/40 -mt-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth pb-px">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;
            
            return (
              <Link 
                key={tab.label}
                href={tab.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap -mb-px outline-none",
                  isActive 
                    ? "border-primary text-foreground font-semibold" 
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                )}
              >
                <tab.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground/70")} />
                {tab.label}
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
