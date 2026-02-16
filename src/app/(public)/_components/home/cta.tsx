import React from "react";
import Link from "next/link";
import Clock from "@/components/ui/clock";
import { Card, CardContent } from "@/components/ui/card";

interface StartBuildingProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  linkTo?: string;
  className?: string;
}

const StartBuilding: React.FC<StartBuildingProps> = ({ className = "" }) => {
  return (
    <section
      id="cta"
      className={`w-full py-6 md:py-16 relative z-20 ${className}`}
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <Card className="group relative w-full rounded-[2.5rem] border-border bg-card/50 backdrop-blur-xl shadow-xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-primary/30">
          {/* Enhanced Background Decorative Elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-primary/20 transition-all duration-1000" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/15 transition-all duration-1000" />

          <CardContent className="relative z-10 flex flex-col-reverse lg:flex-row items-center justify-between py-8 px-6 sm:py-14 sm:px-14 lg:py-16 lg:px-20 gap-6 lg:gap-16 min-h-0 sm:min-h-[320px]">
            {/* Clock Container - Visual Focal Point */}
            <div className="relative w-32 sm:w-56 lg:w-[300px] shrink-0 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03] group-hover:rotate-1">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-[60px] animate-pulse opacity-40" />
              <div className="relative drop-shadow-xl">
                <Clock className="w-full h-full" />
              </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 sm:space-y-6 flex-1">
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary animate-in fade-in slide-in-from-bottom-1 duration-700">
                  Join the Future
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter leading-[0.9] text-foreground">
                  <span className="block opacity-95">Crypto Markets</span>
                  <span className="block bg-linear-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent drop-shadow-sm">
                    Never Sleep
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground font-medium max-w-md leading-relaxed opacity-70">
                  Automate your trading strategies to capitalize on
                  opportunities 24/7. Precision at every tick, speed at every
                  move.
                </p>
              </div>

              <Link
                href="#features"
                className="inline-flex items-center justify-center h-11 px-8 animate-shimmer bg-[linear-gradient(110deg,var(--color-primary),45%,color-mix(in_srgb,var(--color-primary),white_25%),55%,var(--color-primary))] bg-size-[200%_100%] text-primary-foreground font-bold rounded-lg transition-all hover:scale-105 active:scale-95 focus:outline-none"
              >
                Start Automating
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default StartBuilding;
