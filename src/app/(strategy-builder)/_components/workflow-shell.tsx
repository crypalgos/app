"use client";

import { useEffect, useRef } from "react";
import SubNav from "./sub-nav/sub-nav";
import { useNodesStore } from "../store/nodes-store";
import { useStrategy } from "@/api-actions/hooks/strategy-hooks";
import { QuantumOrbitLoader } from "@/components/orbit-loader/QuantumOrbitLoader";

interface WorkflowShellProps {
  strategyId: string;
  children: React.ReactNode;
}

// Hydrates the shared canvas store once per strategy and renders the
// persistent SubNav — shared across Build/Analyse/Live so switching tabs
// (now real routes) doesn't lose sync status, node count, or strategy name.
export default function WorkflowShell({ strategyId, children }: WorkflowShellProps) {
  const { initializeFromStrategy, setCodeContent } = useNodesStore();
  const { data: strategy, isLoading: isLoadingStrategy } = useStrategy(strategyId);

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (strategy && !hasInitialized.current) {
      initializeFromStrategy(strategy);
      hasInitialized.current = true;
    }
  }, [strategy, initializeFromStrategy]);

  // When compiled_code refreshes (e.g. after a canvas save on the Build
  // page), sync into Monaco regardless of which tab is currently active.
  useEffect(() => {
    if (strategy && hasInitialized.current) {
      setCodeContent(strategy.compiled_code);
    }
  }, [strategy?.compiled_code, setCodeContent]);

  if (isLoadingStrategy) {
    return (
      <>
        <SubNav strategyId={strategyId} />
        <div className="fixed inset-0 top-[68px] flex items-center justify-center bg-background">
          <QuantumOrbitLoader
            variant="default"
            size="lg"
            text="Loading strategy workspace..."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <SubNav strategyId={strategyId} />
      {children}
    </>
  );
}
