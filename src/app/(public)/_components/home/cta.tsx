import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Clock from "@/components/ui/clock";
import { IconArrowRight } from "@tabler/icons-react";

interface StartBuildingProps {
  className?: string;
}

const StartBuilding: React.FC<StartBuildingProps> = ({ className = "" }) => {
  return (
    <section
      id="cta"
      className={`w-full py-8 md:py-14 relative z-20 ${className}`}
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <Card className="group relative w-full rounded-3xl border-border/50 bg-card shadow-xl overflow-hidden transition-all duration-500 hover:border-primary/25 hover:shadow-2xl">
          {/* Top gradient shine line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {/* Dot grid texture for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(var(--color-border)_0.5px,transparent_0.5px)] [background-size:12px_12px] opacity-20 pointer-events-none" />

          {/* Background ambient glow */}
          <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] pointer-events-none group-hover:bg-primary/12 transition-all duration-700" />
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[400px] h-[400px] bg-chart-3/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-chart-3/10 transition-all duration-700" />

          <CardContent className="relative z-10 flex flex-col-reverse lg:flex-row items-center justify-between py-10 px-6 sm:py-16 sm:px-14 lg:py-20 lg:px-20 gap-8 lg:gap-16">
            {/* Clock — Visual focal point */}
            <div className="relative w-32 sm:w-56 lg:w-[280px] shrink-0 transition-all duration-500 group-hover:scale-[1.02]">
              <div className="absolute inset-0 bg-primary/15 rounded-full blur-[60px] animate-pulse opacity-30" />
              <div className="relative">
                <Clock className="w-full h-full" />
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6 flex-1">
              <div className="flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary w-fit mx-auto lg:mx-0">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  Always On
                </div>
                <h2 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-medium tracking-tighter leading-[1.1]">
                  Crypto Markets
                  <br />
                  <span className="text-primary">Never Sleep.</span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground font-light max-w-md leading-relaxed">
                  Automate your trading strategies to capitalize on opportunities
                  24/7. Precision at every tick, speed at every move.
                </p>
              </div>

              <Button asChild size="lg" className="cursor-pointer">
                <Link href="/register">
                  Start Automating
                  <IconArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default StartBuilding;
