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
  IconGitBranch,
  IconSettings,
  IconCopy,
  IconTrash,
  IconBolt,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Hero Card: Visual Strategy Builder */}
          <FeatureCard className="md:col-span-7">
            <div className="flex flex-col h-full min-h-[360px] overflow-hidden">
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

              <div className="mt-5 flex-1 relative flex flex-col items-center justify-center p-6 border-t border-border/30 bg-muted/10 overflow-hidden min-h-[250px]">
                {/* Dot grid */}
                <div className="absolute inset-0 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                {/* Mock UI: Strategy Node Flow */}
                <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
                  {/* Condition Node Mockup */}
                  <div className="relative bg-white dark:bg-[#1B1D21] border border-primary shadow-[0_0_12px_rgba(59,130,246,0.15)] rounded-tl-xl rounded-bl-xl rounded-br-xl p-4 w-[280px] h-24 transition-all duration-300 hover:shadow-md cursor-pointer select-none">
                    
                    {/* Floating Toolbar (n8n style, connected) */}
                    <div className="absolute right-[-1px] top-[-25px] h-[26px] bg-white dark:bg-[#1B1D21] border border-primary border-b-0 rounded-t-lg px-1.5 flex items-center gap-1.5 z-40">
                      <IconSettings className="size-3 text-muted-foreground hover:text-foreground cursor-pointer" />
                      <IconCopy className="size-3 text-muted-foreground hover:text-foreground cursor-pointer" />
                      <div className="w-[1px] h-3 bg-border/60" />
                      <IconTrash className="size-3 text-red-500 hover:text-red-600 cursor-pointer" />
                    </div>

                    {/* Header with icon, title and badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="size-8 bg-blue-600 text-white rounded-md flex items-center justify-center">
                          <IconGitBranch className="size-4" />
                        </div>
                        <div className="flex flex-col">
                          <h3 className="text-foreground font-semibold text-xs leading-tight">
                            RSI Oversold
                          </h3>
                          <p className="text-[9px] text-muted-foreground font-mono leading-none mt-0.5">
                            RSI(14) &lt; 30
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[8px] px-1.5 py-0">
                        Logic
                      </Badge>
                    </div>

                    {/* React Flow Handles */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-2 border-primary rounded-full z-10" />
                    
                    {/* True Path source handle */}
                    <div className="absolute -bottom-2.5 left-[35%] -translate-x-1/2 w-5 h-5 bg-white dark:bg-zinc-800 border border-emerald-500 rounded-full flex items-center justify-center text-emerald-500 font-bold text-[11px] shadow-sm z-30">
                      +
                    </div>
                    
                    {/* False Path source handle */}
                    <div className="absolute -bottom-2.5 left-[65%] -translate-x-1/2 w-5 h-5 bg-white dark:bg-zinc-800 border border-red-500 rounded-full flex items-center justify-center text-red-500 font-bold text-[11px] shadow-sm z-30">
                      +
                    </div>
                  </div>

                  {/* Custom Branching Connector SVG */}
                  <div className="w-[280px] h-8 relative my-1">
                    <svg viewBox="0 0 280 32" className="w-full h-full overflow-visible">
                      {/* True path line */}
                      <path d="M 98,0 L 98,16 L 40,16 L 40,32" fill="none" stroke="#10b981" strokeWidth="1.5" />
                      {/* False path line */}
                      <path d="M 182,0 L 182,16 L 240,16 L 240,32" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
                    </svg>
                  </div>

                  {/* Action Nodes Row */}
                  <div className="flex justify-between w-[320px] relative">
                    
                    {/* Action Node: Buy (True Path) */}
                    <div className="relative bg-white dark:bg-[#1B1D21] border border-border rounded-xl p-3 w-[145px] h-20 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer select-none">
                      <div className="flex items-start gap-2.5">
                        <div className="size-7 bg-emerald-600 text-white rounded-md flex items-center justify-center shrink-0">
                          <IconBolt className="size-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="text-foreground font-semibold text-[11px] truncate leading-tight">
                            Market Buy
                          </h3>
                          <p className="text-[8px] text-muted-foreground font-mono truncate mt-0.5">
                            BUY | Market Size
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <Badge variant="secondary" className="text-[7px] px-1 py-0 scale-95 origin-left">
                          Actions
                        </Badge>
                        <span className="text-[8px] text-emerald-500 font-semibold uppercase scale-90">True</span>
                      </div>
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border border-primary rounded-full z-10" />
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border border-primary rounded-full z-10" />
                    </div>

                    {/* Action Node: Telegram Alert (False Path - Grayscale/Inactive) */}
                    <div className="relative bg-white dark:bg-[#1B1D21] border border-border rounded-xl p-3 w-[145px] h-20 shadow-sm opacity-50 grayscale transition-all duration-300 hover:opacity-70 cursor-pointer select-none">
                      <div className="flex items-start gap-2.5">
                        <div className="size-7 bg-indigo-600 text-white rounded-md flex items-center justify-center shrink-0">
                          <IconBolt className="size-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="text-foreground font-semibold text-[11px] truncate leading-tight">
                            Telegram Alert
                          </h3>
                          <p className="text-[8px] text-muted-foreground font-mono truncate mt-0.5">
                            Notify: Discord
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <Badge variant="secondary" className="text-[7px] px-1 py-0 scale-95 origin-left">
                          Utility
                        </Badge>
                        <span className="text-[8px] text-red-500 font-semibold uppercase scale-90">False</span>
                      </div>
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border border-primary rounded-full z-10" />
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border border-primary rounded-full z-10" />
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </FeatureCard>

          {/* Card: Backtesting Engine */}
          <FeatureCard className="md:col-span-5">
            <div className="flex flex-col h-full min-h-[360px] overflow-hidden">
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

              <div className="mt-5 flex-1 relative flex flex-col justify-end p-5 border-t border-border/30 bg-muted/10 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
                
                {/* Metrics Card */}
                <div className="w-full bg-card/90 backdrop-blur-md border border-border/60 shadow-md rounded-xl overflow-hidden font-mono text-xs relative z-10">
                  <div className="px-3 py-2 border-b border-border bg-muted/30 flex justify-between items-center">
                    <span className="text-muted-foreground uppercase tracking-wider text-[9px] font-bold">
                      backtest_report_v2.json
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] text-emerald-500 font-semibold uppercase">Passed</span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-2.5">
                    {/* SVG Sparkline with Area Fill and Gradient */}
                    <div className="w-full h-16 relative">
                      <svg
                        viewBox="0 0 100 30"
                        className="w-full h-full overflow-visible"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Area */}
                        <path
                          d="M0,30 L10,24 L20,27 L30,14 L40,18 L50,6 L60,9 L70,3 L80,11 L90,1 L100,3 L100,30 Z"
                          fill="url(#chartGradient)"
                        />
                        {/* Line */}
                        <path
                          d="M0,30 L10,24 L20,27 L30,14 L40,18 L50,6 L60,9 L70,3 L80,11 L90,1 L100,3"
                          fill="none"
                          stroke="var(--color-primary)"
                          strokeWidth="1.5"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                      <div className="absolute top-1 right-2 bg-primary/10 border border-primary/20 text-primary text-[8px] px-1 rounded font-semibold font-mono">
                        Sharpe 1.84
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-[8px] uppercase tracking-wider">CAGR</span>
                        <span className="text-emerald-500 font-semibold text-xs mt-0.5">+34.2%</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-[8px] uppercase tracking-wider">Drawdown</span>
                        <span className="text-destructive font-semibold text-xs mt-0.5">-12.4%</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-[8px] uppercase tracking-wider">Win Rate</span>
                        <span className="text-foreground font-semibold text-xs mt-0.5">68.3%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FeatureCard>

          {/* Bottom row: 3 feature cards with inline stats */}
          <FeatureCard className="md:col-span-4">
            <div className="p-6 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/10">
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

                {/* Micro Ticker Panel */}
                <div className="bg-muted/10 border border-border/40 rounded-xl p-3 flex flex-col gap-2 font-mono text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">BTC/USDT</span>
                    <span className="text-emerald-500 font-medium">+4.82%</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/10 pt-1.5">
                    <span className="font-semibold text-foreground">ETH/USDT</span>
                    <span className="text-emerald-500 font-medium">+3.14%</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/10 pt-1.5">
                    <span className="font-semibold text-foreground">SOL/USDT</span>
                    <span className="text-destructive font-medium">-1.45%</span>
                  </div>
                </div>
              </div>

              {/* Inline stat */}
              <div className="pt-4 mt-5 border-t border-border/30 flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Data Coverage</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">50+</span>
                  <span className="text-xs text-muted-foreground">Exchanges</span>
                </div>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard className="md:col-span-4">
            <div className="p-6 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/10">
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

                {/* Execution Timeline Meter */}
                <div className="bg-muted/10 border border-border/40 rounded-xl p-3 flex flex-col gap-2 font-mono text-[9px]">
                  <div className="flex justify-between items-center text-muted-foreground mb-0.5">
                    <span>Execution Path</span>
                    <span className="text-primary font-bold">1.2ms</span>
                  </div>
                  <div className="w-full bg-border/40 h-2.5 rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary/40 border-r border-background w-[30%]" title="Parsing: 0.3ms" />
                    <div className="h-full bg-primary/70 border-r border-background w-[45%]" title="Strategy: 0.5ms" />
                    <div className="h-full bg-primary w-[25%]" title="Routing: 0.4ms" />
                  </div>
                  <div className="flex justify-between text-[8px] text-muted-foreground/80 mt-0.5">
                    <span>Parse (30%)</span>
                    <span>Eval (45%)</span>
                    <span>Route (25%)</span>
                  </div>
                </div>
              </div>

              {/* Inline stat */}
              <div className="pt-4 mt-5 border-t border-border/30 flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ultra Latency</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">&lt; 5ms</span>
                  <span className="text-xs text-muted-foreground">Target</span>
                </div>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard className="md:col-span-4">
            <div className="p-6 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/10">
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

                {/* Security Credentials Verification */}
                <div className="bg-muted/10 border border-border/40 rounded-xl p-3 flex flex-col gap-2 text-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="size-3.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">✓</div>
                    <span className="text-muted-foreground font-medium">AES-256 Key Encryption</span>
                  </div>
                  <div className="flex items-center gap-2 border-t border-border/10 pt-1.5">
                    <div className="size-3.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">✓</div>
                    <span className="text-muted-foreground font-medium">Hardware-level Enclaves</span>
                  </div>
                  <div className="flex items-center gap-2 border-t border-border/10 pt-1.5">
                    <div className="size-3.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">✓</div>
                    <span className="text-muted-foreground font-medium">MPC Wallet Architectures</span>
                  </div>
                </div>
              </div>

              {/* Inline stat */}
              <div className="pt-4 mt-5 border-t border-border/30 flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">SLA Guarantee</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">99.99%</span>
                  <span className="text-xs text-muted-foreground">Uptime</span>
                </div>
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
      "group relative rounded-2xl border-border/50 bg-card shadow-sm transition-all duration-300 ease-out overflow-hidden flex flex-col justify-between",
      "hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5",
      className
    )}
  >
    {/* Top gradient line — subtle shine */}
    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    {children}
  </Card>
);
