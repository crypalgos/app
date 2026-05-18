import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Network, 
  LineChart, 
  Activity, 
  ArrowRight,
  Database,
  Lock,
  Cpu,
  CheckCircle2
} from "lucide-react";
import { ReactNode } from "react";

export default function FeaturesSection() {
  return (
    <section className="bg-background py-16 md:py-32 relative border-y border-border/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-16 md:mb-24 max-w-3xl">
           <h2 className="text-sm font-semibold tracking-wide text-primary uppercase mb-3">
             Infrastructure
           </h2>
           <h3 className="text-3xl md:text-5xl font-medium tracking-tight mb-6">
             The complete toolkit for quantitative execution.
           </h3>
           <p className="text-muted-foreground text-lg md:text-xl font-light">
             From strategy ideation to sub-millisecond production deployment. Everything you need to scale your algorithmic trading operations.
           </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Main Hero Card: Strategy Builder */}
          <FeatureCard className="md:col-span-8 bg-[#FAFAFA] dark:bg-[#0A0A0A] border-border/50">
            <div className="flex flex-col h-full min-h-[400px] overflow-hidden">
              <div className="p-8 pb-0">
                <Network className="w-6 h-6 text-foreground mb-4" />
                <h4 className="text-xl font-medium tracking-tight mb-2">Visual Strategy Builder</h4>
                <p className="text-muted-foreground text-sm max-w-md">
                  Construct complex trading logic through our intuitive node-based architecture. No coding required.
                </p>
              </div>
              
              <div className="mt-8 flex-1 relative flex items-start justify-center p-8 border-t border-border/30 bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden">
                 {/* Dot pattern background */}
                 <div className="absolute inset-0 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
                 
                 {/* Mock UI: React Flow Node Group */}
                 <div className="relative z-10 w-full max-w-lg flex flex-col gap-6">
                    {/* Node 1 */}
                    <div className="self-center bg-card border border-border shadow-sm rounded-xl w-64 overflow-hidden">
                       <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center gap-2">
                         <Activity className="w-3.5 h-3.5 text-primary" />
                         <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Condition</span>
                       </div>
                       <div className="p-4 flex items-center justify-between">
                         <span className="text-sm font-medium">RSI Oversold</span>
                         <div className="w-2 h-2 rounded-full bg-emerald-500" />
                       </div>
                    </div>
                    
                    {/* Edge */}
                    <div className="w-px h-6 bg-border self-center relative">
                       <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 border-r border-b border-border rotate-45" />
                    </div>

                    {/* Nodes row */}
                    <div className="flex justify-between w-full relative">
                       <div className="absolute top-0 left-1/4 right-1/4 h-px bg-border" />
                       <div className="absolute top-0 left-1/4 w-px h-6 bg-border" />
                       <div className="absolute top-0 right-1/4 w-px h-6 bg-border" />
                       
                       <div className="mt-6 bg-card border border-border shadow-sm rounded-xl w-[45%] overflow-hidden">
                         <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center gap-2">
                           <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                           <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Action</span>
                         </div>
                         <div className="p-4">
                           <span className="text-sm font-medium">Market Buy</span>
                         </div>
                       </div>
                       
                       <div className="mt-6 bg-card border border-border shadow-sm rounded-xl w-[45%] overflow-hidden opacity-50 grayscale">
                         <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center gap-2">
                           <LineChart className="w-3.5 h-3.5 text-muted-foreground" />
                           <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Action</span>
                         </div>
                         <div className="p-4">
                           <span className="text-sm font-medium">Log Metric</span>
                         </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </FeatureCard>

          {/* Secondary Card: Backtesting */}
          <FeatureCard className="md:col-span-4 bg-[#FAFAFA] dark:bg-[#0A0A0A] border-border/50">
            <div className="flex flex-col h-full min-h-[400px] overflow-hidden">
              <div className="p-8 pb-0">
                <LineChart className="w-6 h-6 text-foreground mb-4" />
                <h4 className="text-xl font-medium tracking-tight mb-2">Backtesting Engine</h4>
                <p className="text-muted-foreground text-sm">
                  Run millions of historical ticks in seconds to validate your hypotheses.
                </p>
              </div>
              
              <div className="mt-8 flex-1 relative flex flex-col justify-end p-6 border-t border-border/30 bg-black/[0.02] dark:bg-white/[0.02]">
                 {/* Mock UI: Metrics */}
                 <div className="w-full bg-card border border-border shadow-sm rounded-xl overflow-hidden font-mono text-xs">
                    <div className="p-3 border-b border-border bg-muted/20 flex justify-between items-center">
                       <span className="text-muted-foreground uppercase tracking-wider">Report.json</span>
                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="p-5 flex flex-col gap-3">
                       {/* SVG Sparkline Mock */}
                       <div className="w-full h-10 mb-2">
                         <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
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
                         <span className="text-foreground font-medium">+34.2%</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-muted-foreground">Sharpe Ratio</span>
                         <span className="text-foreground font-medium">1.84</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-muted-foreground">Max Drawdown</span>
                         <span className="text-rose-500 font-medium">-12.4%</span>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </FeatureCard>

          {/* Bottom Card: Col 1 */}
          <FeatureCard className="md:col-span-4 bg-[#FAFAFA] dark:bg-[#0A0A0A] border-border/50 p-8">
             <Database className="w-6 h-6 text-foreground mb-4" />
             <h4 className="text-xl font-medium tracking-tight mb-2">Unified Market Data</h4>
             <p className="text-muted-foreground text-sm">
               Direct access to clean, normalized historical and real-time tick data across all major centralized exchanges.
             </p>
          </FeatureCard>

          {/* Bottom Card: Col 2 */}
          <FeatureCard className="md:col-span-4 bg-[#FAFAFA] dark:bg-[#0A0A0A] border-border/50 p-8">
             <Cpu className="w-6 h-6 text-foreground mb-4" />
             <h4 className="text-xl font-medium tracking-tight mb-2">Low Latency Execution</h4>
             <p className="text-muted-foreground text-sm">
               Strategically collocated servers ensure your orders reach the matching engine with sub-millisecond latency.
             </p>
          </FeatureCard>

          {/* Bottom Card: Col 3 */}
          <FeatureCard className="md:col-span-4 bg-[#FAFAFA] dark:bg-[#0A0A0A] border-border/50 p-8">
             <Lock className="w-6 h-6 text-foreground mb-4" />
             <h4 className="text-xl font-medium tracking-tight mb-2">Institutional Security</h4>
             <p className="text-muted-foreground text-sm">
               API keys are encrypted at rest using AES-256 and never leave our secure hardware enclaves.
             </p>
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
      "group relative rounded-3xl border-border/50 shadow-sm transition-all duration-300 ease-out overflow-hidden",
      "hover:border-border/80 hover:shadow-md",
      className,
    )}
  >
    {children}
  </Card>
);
