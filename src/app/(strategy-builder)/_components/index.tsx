"use client";

import {
  Background,
  ReactFlow,
  ConnectionLineType,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import BuilderSidebar from "./sidebar/builder-sidebar";
import SubNav from "./sub-nav/sub-nav";
import React, { useCallback, useEffect, useState } from "react";
import type { ReactFlowInstance } from "@xyflow/react";
import CanvasControls from "./builder/controls/canvas-controls";
import StartNode from "./builder/custom-node/start-node";
import ConditionNode from "./builder/custom-node/condition-node";
import ActionNode from "./builder/custom-node/action-node";
import DataNode from "./builder/custom-node/data-node";
import IndicatorNode from "./builder/custom-node/indicator-node";
import CustomEdge from "./builder/custom-edge/custom-edge";
import CustomConnectionLine from "./builder/custom-connection-line/custom-connection-line";
import { useTheme } from "next-themes";
import { useNodesStore } from "../store/nodes-store";
import { useStrategy } from "@/api-actions/hooks/strategy-hooks";
import Editor from "@monaco-editor/react";
import { IconCode, IconFileCode, IconFileText, IconSettings, IconLoader2 } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Define custom node types
const nodeTypes = {
  startNode: StartNode,
  conditionNode: ConditionNode,
  actionNode: ActionNode,
  dataNode: DataNode,
  indicatorNode: IndicatorNode,
};

// Define custom edge types
const edgeTypes = {
  custom: CustomEdge,
};

interface CanvasProps {
  strategyId: string;
}

export default function Canvas({ strategyId }: CanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setReactFlowInstance,
    activeView,
    codeContent,
    setCodeContent,
    initializeFromStrategy,
  } = useNodesStore();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Fetch strategy from backend
  const { data: strategy, isLoading: isLoadingStrategy } = useStrategy(strategyId);

  // Hydrate the store on first load only — subsequent refetches (after save) 
  // update the cache but don't re-init so user edits aren't wiped.
  const hasInitialized = React.useRef(false);
  useEffect(() => {
    if (strategy && !hasInitialized.current) {
      initializeFromStrategy(strategy);
      hasInitialized.current = true;
    }
  }, [strategy, initializeFromStrategy]);

  // When compiled_code refreshes (e.g. after canvas save), sync into Monaco
  useEffect(() => {
    if (strategy && hasInitialized.current) {
      setCodeContent(strategy.compiled_code);
    }
  }, [strategy?.compiled_code, setCodeContent]);

  const onInit = useCallback(
    (instance: ReactFlowInstance) => {
      setReactFlowInstance(instance);
    },
    [setReactFlowInstance],
  );

  const bgColor = resolvedTheme === "dark" ? "#151617" : "#ffffff";
  const dotsColor = resolvedTheme === "dark" ? "#46474A" : "#CCCFD1";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Full-screen loading while fetching strategy from API
  if (isLoadingStrategy) {
    return (
      <>
        <SubNav strategyId={strategyId} />
        <div className="fixed inset-0 top-[68px] flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <IconLoader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading strategy workspace...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SubNav strategyId={strategyId} />

      {activeView === "canvas" ? (
        <div className="fixed inset-0 top-[68px] overflow-hidden">
          {/* Full canvas area */}
          <div className="w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={onInit}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              connectionLineComponent={CustomConnectionLine}
              defaultEdgeOptions={{
                type: "custom",
                data: { type: "default", animated: false },
              }}
              fitView
            >
              <Background
                bgColor={bgColor}
                color={dotsColor}
                size={1.5}
                gap={12}
              />
            </ReactFlow>
          </div>
          {/* Custom Canvas Controls */}
          <CanvasControls />
          {/* Sleek builder sidebar */}
          <BuilderSidebar />
        </div>
      ) : (
        /* Highly immersive Monaco strategy editor */
        <div className="fixed inset-0 top-[68px] bg-background overflow-hidden flex flex-col md:flex-row">

          {/* Left panel: File Explorer simulation */}
          <div className="w-full md:w-[260px] shrink-0 bg-card/60 dark:bg-card/45 backdrop-blur-md border-r border-border/80 p-4 flex flex-col gap-4 select-none">
            <div>
              <h3 className="font-extrabold text-[10px] tracking-widest uppercase text-muted-foreground">Workspace Strategy Files</h3>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5 font-medium">Direct source code override</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between p-2 rounded-xl bg-sidebar-primary/10 text-sidebar-primary text-xs font-bold border border-sidebar-primary/20 cursor-pointer">
                <div className="flex items-center gap-2">
                  <IconFileCode className="size-4 text-sidebar-primary" />
                  <span>strategy.py</span>
                </div>
                <Badge className="text-[8px] py-0 px-1 bg-sidebar-primary text-sidebar-primary-foreground font-mono">ACTIVE</Badge>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 text-muted-foreground/80 text-xs font-medium cursor-not-allowed opacity-60">
                <IconFileText className="size-4" />
                <span>README.md</span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 text-muted-foreground/80 text-xs font-medium cursor-not-allowed opacity-60">
                <IconSettings className="size-4" />
                <span>config.json</span>
              </div>
            </div>

            <Separator className="bg-border/60 my-2" />

            <div className="p-3 bg-muted/20 border border-border/60 rounded-xl">
              <h4 className="text-[10px] font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <IconCode className="size-3.5 text-sidebar-primary" /> Strategy Engine
              </h4>
              <p className="text-[10px] text-muted-foreground/80 leading-relaxed mt-1 font-medium">
                Edits made in Monaco Editor instantly compile to the strategy engine. Use standard python triggers to build mathematical overlays.
              </p>
            </div>
          </div>

          {/* Monaco Editor Wrapper */}
          <div className="flex-grow h-full bg-[#f1f1f1] dark:bg-[#1e1e1e] relative">
            <Editor
              height="100%"
              defaultLanguage="python"
              theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
              value={codeContent}
              onChange={(value) => {
                setCodeContent(value || "");
              }}
              loading={
                <div className="absolute inset-0 flex items-center justify-center bg-[#ffffff] dark:bg-[#1e1e1e] text-muted-foreground text-xs font-bold font-mono">
                  Loading institutional Monaco editor compiler...
                </div>
              }
              options={{
                fontSize: 14,
                fontFamily: "var(--font-mono)",
                minimap: { enabled: true },
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                smoothScrolling: true,
                scrollbar: {
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                },
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

// Separator helper component
function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("h-[1px] w-full bg-border", className)} {...props} />;
}
