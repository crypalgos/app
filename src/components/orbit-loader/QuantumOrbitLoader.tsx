"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoaderSize = "sm" | "md" | "lg" | "xl";
export type LoaderVariant = "default" | "inline" | "research" | "fullscreen";

export interface ResearchProgress {
  label: string;
  value: number; // 0–100
}

export interface QuantumOrbitLoaderProps {
  size?: LoaderSize;
  variant?: LoaderVariant;
  text?: string;
  progress?: ResearchProgress[];
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUANT_QUOTES = [
  "\"In trading, what is comfortable is rarely profitable.\" — Robert Arnott",
  "\"Mathematics reveals its secrets only to those who approach it with pure love.\" — Georg Cantor",
  "\"The four most dangerous words in investing are: 'this time it's different'.\" — Sir John Templeton",
  "\"In God we trust. All others must bring data.\" — W. Edwards Deming",
  "\"An investment in knowledge pays the best interest.\" — Benjamin Franklin",
  "\"Without data, you're just another person with an opinion.\" — W. Edwards Deming",
  "\"Markets are constantly in a state of uncertainty and flux and money is made by discounting the obvious.\" — George Soros",
];

const SIZE_CLASSES: Record<LoaderSize, string> = {
  sm: "size-10",
  md: "size-28",
  lg: "size-40",
  xl: "size-56",
};

const STATUS_MESSAGES = [
  "COLLECTING DATA FEED",
  "HYDRATING POSTGRES DB",
  "RESOLVING S3 BACKTEST PREVIEWS",
  "OPTIMIZING MONTE CARLO MATRICES",
  "EVALUATING WALKFORWARD ARRAYS",
  "PREPARING QUANT REPORT",
];

const SCAN_DECORATIONS = [
  { label: "SYS.INIT", val: "OK" },
  { label: "LATENCY", val: "1.2ms" },
  { label: "FEED.STREAM", val: "LIVE" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface OrbitCoreProps {
  size: LoaderSize;
}

function OrbitCore({ size }: OrbitCoreProps) {
  return (
    <div className={cn("relative flex items-center justify-center select-none shrink-0", SIZE_CLASSES[size])}>
      
      {/* Outer concentric grid ring */}
      <div
        className="absolute inset-0 rounded-full border border-primary/15 border-dashed animate-spin-outer"
      />
      
      {/* Mid concentric grid ring */}
      <div className="absolute inset-[15%] rounded-full border border-primary/20" />
      
      {/* Inner concentric grid ring */}
      <div className="absolute inset-[35%] rounded-full border border-primary/30 opacity-60" />
      
      {/* Radar Coordinate Crosshair Guides */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="absolute w-full h-[0.5px] bg-primary/80" />
        <div className="absolute h-full w-[0.5px] bg-primary/80" />
      </div>

      {/* Sweeping Radar Line with Glowing Gradient */}
      <div
        className="absolute inset-0 rounded-full origin-center animate-spin-radar"
        style={{
          background: "conic-gradient(from 0deg, hsl(var(--primary)) 0deg, transparent 180deg, transparent 360deg)",
          maskImage: "radial-gradient(circle, transparent 35%, black 36%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 35%, black 36%)",
          opacity: 0.2,
        }}
      />

      {/* Orbiting Satellite 01 (Clockwise Sweep) */}
      <div
        className="absolute inset-0 rounded-full animate-spin-clockwise"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
          <span className="absolute size-3 rounded-full border border-primary/40 animate-ping opacity-60" />
        </div>
      </div>

      {/* Orbiting Satellite 02 (Counter-Clockwise Inner Sweep) */}
      <div
        className="absolute inset-[15%] rounded-full animate-spin-counter"
      >
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center justify-center">
          <span className="size-1 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
        </div>
      </div>

      {/* Digital Core Matrix Stats (Only on larger sizes) */}
      {size !== "sm" && (
        <div className="absolute inset-0 flex flex-col justify-between p-2 text-[6.5px] font-mono font-bold text-primary/40 tracking-wider">
          <div className="flex justify-between w-full">
            <span>RA: 10.4h</span>
            <span>DEC: -12.5°</span>
          </div>
          <div className="flex justify-between w-full">
            <span>LOCK: OK</span>
            <span>SPD: 1.0X</span>
          </div>
        </div>
      )}

      {/* Center Core Dot */}
      <div
        className="size-2.5 rounded-full bg-primary/10 border border-primary/80 flex items-center justify-center shadow-[0_0_10px_hsl(var(--primary))] animate-pulse-core"
      >
        <div className="size-0.5 rounded-full bg-primary" />
      </div>
    </div>
  );
}

interface StatusTextProps {
  text?: string;
}

function StatusText({ text }: StatusTextProps) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (text) return;
    const timer = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [text]);

  const label = text ?? STATUS_MESSAGES[msgIdx];

  return (
    <div className="h-5 flex items-center justify-center overflow-hidden font-mono text-[10px] font-extrabold tracking-widest text-primary">
      <p
        key={label}
        className="text-center flex items-center gap-1.5 uppercase animate-fade-in-up"
      >
        <span className="inline-block size-1.5 rounded-full bg-primary animate-pulse" />
        {label}
      </p>
    </div>
  );
}

interface ProgressBarProps {
  label: string;
  value: number;
}

function ProgressBar({ label, value }: ProgressBarProps) {
  return (
    <div className="w-full flex flex-col gap-1.5 select-none font-mono">
      <div className="flex justify-between text-[9px] font-extrabold tracking-widest text-muted-foreground uppercase">
        <span>{label}</span>
        <span className="text-primary font-bold">{Math.round(value)}%</span>
      </div>
      <div className="relative w-full h-3 bg-muted border border-border/40 overflow-hidden flex items-center p-0.5 rounded-sm">
        {/* Hatch pattern track */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(45deg,var(--foreground)_25%,transparent_25%,transparent_50%,var(--foreground)_50%,var(--foreground)_75%,transparent_75%,transparent)] bg-[length:6px_6px]" />
        
        {/* Glowing Progress bar fill */}
        <div
          className="h-full bg-primary/20 border-r-2 border-primary shadow-[0_0_8px_hsl(var(--primary))] rounded-xs transition-all duration-500 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function QuantumOrbitLoader({
  size = "md",
  variant = "default",
  text,
  progress = [],
  className,
}: QuantumOrbitLoaderProps) {
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % QUANT_QUOTES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Inline CSS keyframes and utility classes to ensure robust animation without framer-motion dependency
  const stylesBlock = (
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes spin-clockwise {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes spin-counterclockwise {
        from { transform: rotate(0deg); }
        to { transform: rotate(-360deg); }
      }
      @keyframes pulse-scale {
        0%, 100% { transform: scale(0.95); }
        50% { transform: scale(1.05); }
      }
      @keyframes fade-in-up {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-spin-clockwise {
        animation: spin-clockwise 8s linear infinite;
      }
      .animate-spin-counter {
        animation: spin-counterclockwise 6s linear infinite;
      }
      .animate-spin-radar {
        animation: spin-clockwise 4s linear infinite;
      }
      .animate-spin-outer {
        animation: spin-clockwise 40s linear infinite;
      }
      .animate-pulse-core {
        animation: pulse-scale 2.5s ease-in-out infinite;
      }
      .animate-fade-in-up {
        animation: fade-in-up 0.3s ease-out forwards;
      }
    `}} />
  );

  // ── Inline Variant ──
  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-3 px-3 py-1.5 border border-border bg-card/60 backdrop-blur-xs select-none rounded-xl", className)}>
        {stylesBlock}
        <OrbitCore size="sm" />
        {text && <span className="text-[10px] font-mono font-extrabold tracking-widest text-primary uppercase whitespace-nowrap">{text}</span>}
      </span>
    );
  }

  // ── Research Variant ──
  if (variant === "research") {
    return (
      <div className={cn("flex flex-col items-center gap-6 p-6 border border-border bg-card/30 backdrop-blur-md rounded-2xl min-w-[300px] w-full max-w-sm shadow-xl shadow-black/10 select-none", className)}>
        {stylesBlock}
        <OrbitCore size="md" />
        <StatusText text={text} />
        
        {/* Terminal decorative status panel */}
        <div className="w-full grid grid-cols-3 gap-2 py-1.5 px-3 border border-border bg-muted/30 rounded-lg text-[8px] font-mono font-bold text-muted-foreground/80">
          {SCAN_DECORATIONS.map((d) => (
            <div key={d.label} className="flex flex-col items-center">
              <span>{d.label}</span>
              <span className="text-primary mt-0.5">{d.val}</span>
            </div>
          ))}
        </div>

        <div className="w-full flex flex-col gap-4">
          {progress.map((p) => (
            <ProgressBar key={p.label} label={p.label} value={p.value} />
          ))}
        </div>
      </div>
    );
  }

  // ── Fullscreen Variant ──
  if (variant === "fullscreen") {
    return (
      <div className={cn("fixed inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl z-9999 select-none p-6 text-center", className)}>
        {stylesBlock}
        {/* Background Grid Mesh */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Loader Radial */}
        <div className="relative z-10 flex flex-col items-center gap-8 max-w-md">
          <OrbitCore size="xl" />
          
          <div className="space-y-4">
            <StatusText text={text} />
            
            <Separator className="bg-border/60 w-24 mx-auto" />
            
            {/* Quantitative Inspiring Quote Slider */}
            <div className="h-16 flex items-center justify-center">
              <p
                key={quoteIdx}
                className="text-xs font-sans tracking-wide text-foreground/80 leading-relaxed max-w-xs font-semibold italic animate-fade-in-up"
              >
                {QUANT_QUOTES[quoteIdx]}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Default Variant ──
  return (
    <div className={cn("flex flex-col items-center gap-5 select-none text-center max-w-sm", className)}>
      {stylesBlock}
      <OrbitCore size={size} />
      <div className="space-y-3">
        <StatusText text={text} />
        <Separator className="bg-border/60 w-16 mx-auto" />
        <div className="h-12 flex items-center justify-center">
          <p
            key={quoteIdx}
            className="text-[10px] font-sans tracking-wide text-foreground/80 leading-relaxed max-w-xs font-semibold italic animate-fade-in-up"
          >
            {QUANT_QUOTES[quoteIdx]}
          </p>
        </div>
      </div>
    </div>
  );
}