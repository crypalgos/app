"use client";

import ScrollStack, { ScrollStackItem } from "@/components/ui/scrollstack";

export default function ScrollStackDemo() {
  return (
    <section className="w-full relative py-8 pb-0">
      <div className="container mx-auto px-4 mb-6 text-center">
        <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">
          Our <span className="text-primary">Ecosystem</span>
        </h2>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-medium opacity-70">
          Everything you need to build, test, and deploy industrial-grade
          trading bots.
        </p>
      </div>

      <ScrollStack>
        <ScrollStackItem>
          <div className="space-y-6">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-black uppercase tracking-widest text-primary">
              Visual Builder
            </div>
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
              Design Without <br />
              <span className="text-primary">Complexity</span>
            </h2>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-xl">
              Build sophisticated trading logic using our intuitive no-code
              canvas. Connect triggers, conditions, and actions with zero
              friction.
            </p>
          </div>
        </ScrollStackItem>

        <ScrollStackItem>
          <div className="space-y-6">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-black uppercase tracking-widest text-blue-500">
              Backtesting
            </div>
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
              Validate With <br />
              <span className="text-blue-500">Certainty</span>
            </h2>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-xl">
              Run high-fidelity simulations against tick-by-tick historical
              data. Understand your drawdown, Sharpe ratio, and alpha before
              risking a single cent.
            </p>
          </div>
        </ScrollStackItem>

        <ScrollStackItem>
          <div className="space-y-6">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-black uppercase tracking-widest text-emerald-500">
              Live Execution
            </div>
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
              Execute With <br />
              <span className="text-emerald-500">Precision</span>
            </h2>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-xl">
              Deploy your bots to our low-latency infrastructure. Connect to
              Top-Tier exchanges with institutional-grade speed and reliability.
            </p>
          </div>
        </ScrollStackItem>
      </ScrollStack>
    </section>
  );
}
