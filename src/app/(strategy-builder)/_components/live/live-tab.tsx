"use client";

import { Button } from "@/components/ui/button";
import { IconPlayerPause, IconRocket } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useNodesStore } from "../../store/nodes-store";
import { toast } from "sonner";

export default function LiveTab() {
  const { isRunning, setIsRunning } = useNodesStore();

  const handleLiveToggle = () => {
    const nextState = !isRunning;
    setIsRunning(nextState);
    if (nextState) {
      toast.success("Strategy deployed to live trading nodes!", {
        description: "Executing live triggers on exchange: Binance Perpetual USDT",
        duration: 4000,
      });
    } else {
      toast.warning("Live strategy deployment halted.", {
        description: "All active orders cancelled and safe shields engaged.",
        duration: 3500,
      });
    }
  };

  return (
    <div className="fixed inset-0 top-[68px] flex flex-col items-center justify-center gap-6 bg-background">
      <div className="flex flex-col items-center gap-2 text-center max-w-md px-6">
        <h2 className="text-lg font-bold text-foreground">Live Trading</h2>
        <p className="text-sm text-muted-foreground">
          Deploy this strategy to live trading nodes. Real execution infrastructure is
          still in development — this is currently a preview of the deployment flow.
        </p>
      </div>
      <Button
        size="lg"
        onClick={handleLiveToggle}
        className={cn(
          "h-11 gap-2 rounded-full px-8 text-sm font-bold shadow-sm transition-all cursor-pointer",
          isRunning
            ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-destructive/20"
            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20"
        )}
      >
        {isRunning ? (
          <>
            <span className="flex size-1.5 rounded-full bg-white animate-pulse" />
            <IconPlayerPause className="size-4" />
            <span>Stop Live</span>
          </>
        ) : (
          <>
            <IconRocket className="size-4" />
            <span>Go Live</span>
          </>
        )}
      </Button>
    </div>
  );
}
