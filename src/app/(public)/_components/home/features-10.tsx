import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  IconTopologyStarRing3,
  IconChartLine,
  IconActivity,
  IconArrowRight,
  IconDatabase,
  IconShieldLock,
  IconCpu,
  IconCircleCheck,
} from "@tabler/icons-react";
import { ReactNode } from "react";

export default function FeaturesSection() {
  return (
    <section className="bg-background py-10 md:py-16 relative">
      {/* Subtle grid background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.15]" />
        <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,transparent_30%,black_100%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-10 md:mb-14 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs font-medium text-muted-foreground mb-5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Infrastructure
          </div>
          <h2 className="text-3xl md:text-5xl font-medium tracking-tighter leading-[1.1] mb-4">
            The complete toolkit for
            <br />
            <span className="text-primary">quantitative execution.</span>
          </h2>
          <p className="text-muted-foreground text-lg font-light leading-relaxed max-w-xl mx-auto">
            From strategy ideation to sub-millisecond production deployment.
            Everything you need to scale your algorithmic operations.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
          {/* Hero Card: Visual Strategy Builder */}
          <FeatureCard className="md:col-span-7">
            <div className="flex flex-col h-full min-h-[340px] overflow-hidden">
              <div className="p-6 pb-0">
                <IconTopologyStarRing3 className="size-5 text-primary mb-3" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold tracking-tight mb-1.5">
                  Visual Strategy Builder
                </h3>
                <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
                  Construct complex trading logic through our intuitive
                  node-based architecture. No coding required.
                </p>
              </div>

              <div className="mt-5 flex-1 relative flex items-start justify-center p-6 border-t border-border/30 bg-muted/20 overflow-hidden">
                {/* Dot grid */}
                <div className="absolute inset-0 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />

                {/* Mock UI: Strategy Node Flow */}
                <div className="relative z-10 w-full max-w-md flex flex-col gap-4">
                  {/* Condition Node */}
                  <div className="self-center bg-card border border-border shadow-sm rounded-lg w-56 overflow-hidden">
                    <div className="px-3 py-1.5 bg-muted/30 border-b border-border flex items-center gap-1.5">
                      <IconActivity className="size-3 text-primary" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Condition
                      </span>
                    </div>
                    <div className="px-3 py-2.5 flex items-center justify-between">
                      <span className="text-xs font-medium">RSI Oversold</span>
                      <div className="size-1.5 rounded-full bg-success" />
                    </div>
                  </div>

                  {/* Edge connector */}
                  <div className="w-px h-4 bg-border self-center relative">
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 size-1.5 border-r border-b border-border rotate-45" />
                  </div>

                  {/* Action Nodes Row */}
                  <div className="flex justify-between w-full relative">
                    <div className="absolute top-0 left-1/4 right-1/4 h-px bg-border" />
                    <div className="absolute top-0 left-1/4 w-px h-4 bg-border" />
                    <div className="absolute top-0 right-1/4 w-px h-4 bg-border" />

                    <div className="mt-4 bg-card border border-border shadow-sm rounded-lg w-[46%] overflow-hidden">
                      <div className="px-3 py-1.5 bg-muted/30 border-b border-border flex items-center gap-1.5">
                        <IconArrowRight className="size-3 text-primary" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Action
                        </span>
                      </div>
                      <div className="px-3 py-2.5">
                        <span className="text-xs font-medium">Market Buy</span>
                      </div>
                    </div>

                    <div className="mt-4 bg-card border border-border shadow-sm rounded-lg w-[46%] overflow-hidden opacity-40 grayscale">
                      <div className="px-3 py-1.5 bg-muted/30 border-b border-border flex items-center gap-1.5">
                        <IconChartLine className="size-3 text-muted-foreground" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Action
                        </span>
                      </div>
                      <div className="px-3 py-2.5">
                        <span className="text-xs font-medium">Log Metric</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FeatureCard>

          {/* Card: Backtesting Engine */}
          <FeatureCard className="md:col-span-5">
            <div className="flex flex-col h-full min-h-[340px] overflow-hidden">
              <div className="p-6 pb-0">
                <IconChartLine className="size-5 text-primary mb-3" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold tracking-tight mb-1.5">
                  Backtesting Engine
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Run millions of historical ticks in seconds to validate your
                  hypotheses.
                </p>
              </div>

              <div className="mt-5 flex-1 relative flex flex-col justify-end p-5 border-t border-border/30 bg-muted/20">
                {/* Metrics Card */}
                <div className="w-full bg-card border border-border shadow-sm rounded-lg overflow-hidden font-mono text-xs">
                  <div className="px-3 py-2 border-b border-border bg-muted/20 flex justify-between items-center">
                    <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
                      Report.json
                    </span>
                    <IconCircleCheck className="size-3.5 text-success" />
                  </div>
                  <div className="p-4 flex flex-col gap-2.5">
                    {/* SVG Sparkline */}
                    <div className="w-full h-8 mb-1">
                      <svg
                        viewBox="0 0 100 30"
                        className="w-full h-full overflow-visible"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M0,30 L10,25 L20,28 L30,15 L40,18 L50,5 L60,8 L70,2 L80,10 L90,0 L100,2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-primary opacity-50"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">CAGR</span>
                      <span className="text-success font-medium">+34.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Sharpe Ratio</span>
                      <span className="text-foreground font-medium">1.84</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Max Drawdown</span>
                      <span className="text-destructive font-medium">-12.4%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FeatureCard>

          {/* Bottom row: 3 feature cards with inline stats */}
          <FeatureCard className="md:col-span-4">
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconDatabase className="size-4 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold tracking-tight">
                  Unified Market Data
                </h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                Direct access to clean, normalized historical and real-time tick
                data across all major exchanges.
              </p>
              {/* Inline stat */}
              <div className="mt-auto pt-4 border-t border-border/30 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight tabular-nums">50+</span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Exchanges</span>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard className="md:col-span-4">
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconCpu className="size-4 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold tracking-tight">
                  Low Latency Execution
                </h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                Strategically collocated servers ensure your orders reach the
                matching engine instantly.
              </p>
              {/* Inline stat */}
              <div className="mt-auto pt-4 border-t border-border/30 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight tabular-nums">&lt; 5ms</span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Latency</span>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard className="md:col-span-4">
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconShieldLock className="size-4 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold tracking-tight">
                  Institutional Security
                </h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                API keys are encrypted at rest using AES-256 and never leave our
                secure hardware enclaves.
              </p>
              {/* Inline stat */}
              <div className="mt-auto pt-4 border-t border-border/30 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight tabular-nums">99.99%</span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Uptime</span>
              </div>
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  children: ReactNode;
  className?: string;
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
  <Card
    className={cn(
      "group relative rounded-2xl border-border/50 bg-card shadow-sm transition-all duration-300 ease-out overflow-hidden",
      "hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5",
      className
    )}
  >
    {/* Top gradient line — subtle shine */}
    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    {children}
  </Card>
);
