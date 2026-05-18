"use client";

import Clock from "@/components/ui/clock";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@tabler/icons-react";

export default function ClockDemo() {
  return (
    <section className="relative w-full bg-background overflow-hidden py-16 md:py-24 border-y border-border/30">
      {/* Subtle grid background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.12]" />
        <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,transparent_20%,black_100%)]" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 px-6 max-w-7xl mx-auto">
        {/* Clock visual */}
        <div className="w-48 sm:w-64 md:w-80 shrink-0">
          <Clock />
        </div>

        {/* Content */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs font-medium text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            24/7 Uptime
          </div>

          <h2 className="text-3xl md:text-5xl font-medium tracking-tighter leading-[1.1]">
            <span className="block text-foreground">
              Crypto Markets Never Sleep.
            </span>
            <span className="block text-muted-foreground">
              Neither Should You.
            </span>
          </h2>

          <p className="text-sm md:text-base text-muted-foreground max-w-sm leading-relaxed font-light">
            Automate your trading strategies to capitalize on opportunities 24/7.
            Execute trades with precision while you rest.
          </p>

          <Button asChild className="cursor-pointer mt-1">
            <Link href="/register">
              Start Automating
              <IconArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
