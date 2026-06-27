"use client";

import React, { useState } from "react";
import { QuantumOrbitLoader } from "@/components/orbit-loader/QuantumOrbitLoader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Coins, Play, RotateCcw, AlertTriangle } from "lucide-react";

export default function PaperTradingPage() {
  const [testProgress, setTestProgress] = useState([
    { label: "Binance Live Stream", value: 92 },
    { label: "Order Routing Engine", value: 68 },
    { label: "Slippage Calculator", value: 45 },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const randomizeProgress = () => {
    setTestProgress([
      { label: "Binance Live Stream", value: Math.floor(Math.random() * 40) + 60 },
      { label: "Order Routing Engine", value: Math.floor(Math.random() * 50) + 40 },
      { label: "Slippage Calculator", value: Math.floor(Math.random() * 80) + 20 },
    ]);
  };

  const triggerFullscreen = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 4000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto px-4 py-8 select-none animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Paper Trading Sandbox</h1>
            <span className="bg-primary/5 text-primary border border-primary/20 flex gap-1 py-0.5 px-2.5 text-[10px] font-bold items-center rounded-md uppercase">
              <Coins className="size-3" /> Live Simulator
            </span>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Verify real-time simulation speeds and test the motion design system of the Quantum loader.
          </p>
        </div>
      </div>

      <Separator className="bg-border/60" />

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controls Card */}
        <Card className="border border-border/80 bg-card rounded-2xl shadow-sm md:col-span-3">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">Simulator Controls</CardTitle>
            <CardDescription className="text-xs">Manipulate loader states and trigger full-screen blockades.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button onClick={randomizeProgress} variant="outline" className="text-xs font-semibold rounded-xl gap-2 cursor-pointer">
              <RotateCcw className="size-3.5" /> Randomize Progress
            </Button>
            <Button onClick={triggerFullscreen} className="text-xs font-semibold rounded-xl gap-2 cursor-pointer bg-foreground text-background hover:bg-foreground/90">
              <Play className="size-3.5" /> Trigger Fullscreen Loader (4s)
            </Button>
          </CardContent>
        </Card>

        {/* Default Loader Card */}
        <Card className="border border-border/80 bg-card rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Standard Orbit</CardTitle>
            <CardDescription className="text-xs">Default cycling asset loaders.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-8 min-h-[300px]">
            <QuantumOrbitLoader size="md" />
          </CardContent>
        </Card>

        {/* Inline Loader Card */}
        <Card className="border border-border/80 bg-card rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Inline Status</CardTitle>
            <CardDescription className="text-xs">Badges for strategy lists or cards.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-8 min-h-[300px]">
            <QuantumOrbitLoader variant="inline" text="Syncing order book..." />
          </CardContent>
        </Card>

        {/* Research loader Card */}
        <Card className="border border-border/80 bg-card rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Research Metrics</CardTitle>
            <CardDescription className="text-xs">Detailed backtesting & optimization logs.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-8 min-h-[300px]">
            <QuantumOrbitLoader
              variant="research"
              text="Compiling mathematical matrices..."
              progress={testProgress}
              className="border-0 bg-transparent shadow-none p-0 backdrop-blur-none max-w-none"
            />
          </CardContent>
        </Card>
      </div>

      {/* Fullscreen loader test portal overlay */}
      {isLoading && (
        <QuantumOrbitLoader
          variant="fullscreen"
          text="Initializing quantitative simulator..."
        />
      )}
    </div>
  );
}
