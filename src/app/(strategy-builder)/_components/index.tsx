"use client";

import {
  Background,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import BuilderSidebar from "./sidebar/builder-sidebar";
import SubNav from "./sub-nav/sub-nav";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { ReactFlowInstance } from "@xyflow/react";
import CanvasControls from "./builder/controls/canvas-controls";
import StartNode from "./builder/custom-node/start-node";
import ConditionNode from "./builder/custom-node/condition-node";
import ActionNode from "./builder/custom-node/action-node";
import DataNode from "./builder/custom-node/data-node";
import IndicatorNode from "./builder/custom-node/indicator-node";
import RiskNode from "./builder/custom-node/risk-node";
import PlaceholderNode from "./builder/custom-node/placeholder-node";
import NodeConfigPanel from "./builder/selectors/node-config-panel";
import NodeCreationDialog from "./builder/selectors/node-creation-dialog";
import CustomEdge from "./builder/custom-edge/custom-edge";
import CustomConnectionLine from "./builder/custom-connection-line/custom-connection-line";
import { useTheme } from "next-themes";
import { useNodesStore } from "../store/nodes-store";
import { useSaveCode, useStrategy, useUpdateCanvas } from "@/api-actions/hooks/strategy-hooks";
import Editor from "@monaco-editor/react";
import { IconCode, IconLoader2, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// Define custom node types
const nodeTypes = {
  startNode: StartNode,
  conditionNode: ConditionNode,
  actionNode: ActionNode,
  utilityNode: ActionNode,
  dataNode: DataNode,
  indicatorNode: IndicatorNode,
  riskManagementNode: RiskNode,
  placeholderNode: PlaceholderNode,
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
    reactFlowInstance,
    activeView,
    setActiveView,
    codeContent,
    setCodeContent,
    isCodeModified,
    setIsCodeModified,
    initializeFromStrategy,
    isSynced,
    setIsSynced,
    isSaving,
    setIsSaving,
    strategyName,
    strategyDescription,
    selectedNodeId,
    setSelectedNodeId,
  } = useNodesStore();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Split-screen drag resizing state & handlers
  const [editorWidth, setEditorWidth] = useState(600);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Liquid-smooth Framer Motion spring layouts with 0-lag drag override
  const layoutTransition = isDragging
    ? ({ type: "tween", duration: 0 } as const)
    : ({ type: "spring", stiffness: 350, damping: 35, mass: 1 } as const);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setEditorWidth(Math.floor(window.innerWidth / 2));
    }
  }, []);

  const prevActiveView = useRef(activeView);

  // Smoothly pan the React Flow viewport horizontally during activeView switches to preserve exact vertical scroll positioning
  useEffect(() => {
    if (!reactFlowInstance) return;

    if (activeView === "canvas" || activeView === "both") {
      const viewport = reactFlowInstance.getViewport();
      const shiftX = (editorWidth / 2) * viewport.zoom;

      if (prevActiveView.current === "canvas" && activeView === "both") {
        // Shift left as the code editor slides in
        reactFlowInstance.setViewport(
          { x: viewport.x - shiftX, y: viewport.y, zoom: viewport.zoom },
          { duration: 400 }
        );
      } else if (prevActiveView.current === "both" && activeView === "canvas") {
        // Shift right as the code editor slides out
        reactFlowInstance.setViewport(
          { x: viewport.x + shiftX, y: viewport.y, zoom: viewport.zoom },
          { duration: 400 }
        );
      }
    }

    prevActiveView.current = activeView;
  }, [activeView, reactFlowInstance, editorWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;
      
      // Enforce boundaries: minimum 300px, maximum 85% of screen
      const minWidth = 300;
      const maxWidth = containerRect.width * 0.85;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setEditorWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // API mutations for auto-save
  const { mutateAsync: updateCanvas } = useUpdateCanvas(strategyId);
  const { mutateAsync: saveCode } = useSaveCode(strategyId);

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

  // ─── Debounced auto-save (1200ms idle window) ────────────────────────────
  // Serialize only the semantically meaningful attributes to avoid spurious triggers
  const nodesStateStr = JSON.stringify(
    nodes
      .filter((n) => n.type !== "riskManagementNode")
      .map((n) => ({ id: n.id, type: n.type, position: n.position, data: n.data }))
  );
  const edgesStateStr = JSON.stringify(
    edges
      .filter((e) => !e.source.startsWith("rm") && !e.target.startsWith("rm"))
      .map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, data: e.data }))
  );

  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(isSaving);
  isSavingRef.current = isSaving;

  useEffect(() => {
    // Only trigger if there are actual unsaved changes and the strategy is loaded
    if (isSynced || !strategyId || !hasInitialized.current) return;

    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);

    autoSaveRef.current = setTimeout(async () => {
      if (isSavingRef.current) return; // another save already in flight
      setIsSaving(true);

      try {
        if (activeView === "canvas" || activeView === "both") {
          const canvasPayload = {
            nodes: nodes.map((n) => ({
              id: n.id,
              type: n.type,
              position: n.position,
              data: n.data,
            })),
            edges: edges.map((e) => ({
              id: e.id,
              source: e.source,
              target: e.target,
              sourceHandle: e.sourceHandle,
              targetHandle: e.targetHandle,
              type: e.type,
              data: e.data,
            })),
          };
          const updated = await updateCanvas({
            canvas_json: canvasPayload,
            name: strategyName,
            description: strategyDescription,
          });
          setCodeContent(updated.compiled_code);
        } else {
          await saveCode(codeContent);
        }
        setIsSynced(true);
      } catch {
        // Silently fail — user can retry by making another change
      } finally {
        setIsSaving(false);
      }
    }, 1200);

    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesStateStr, edgesStateStr, codeContent, isSynced, activeView, strategyName, strategyDescription]);

  const onInit = useCallback(
    (instance: ReactFlowInstance) => {
      setReactFlowInstance(instance);
      // Delayed fitView ensures visual builder centers perfectly on initial load after container sizing is painted
      setTimeout(() => {
        instance.fitView({ padding: 0.15, maxZoom: 0.95 });
      }, 100);
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

      {/* Main workspace: canvas + optional code panel side-by-side */}
      <div ref={containerRef} className="fixed inset-0 top-[68px] overflow-hidden flex">

        {/* ─── Canvas area ─── */}
        <motion.div
          initial={false}
          animate={{
            width: activeView === "canvas"
              ? "100%"
              : activeView === "both"
              ? `calc(100% - ${editorWidth}px - 6px)`
              : "0%",
            opacity: activeView === "code" ? 0 : 1,
          }}
          transition={layoutTransition}
          className="relative h-full overflow-hidden shrink-0"
        >
          <ReactFlow
            nodes={nodes.filter((n) => n.type !== "riskManagementNode")}
            edges={edges.filter((e) => e.source !== "rm-1" && e.target !== "rm-1" && !e.source.startsWith("rm") && !e.target.startsWith("rm") && !e.source.startsWith("risk-safeguard") && !e.target.startsWith("risk-safeguard"))}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onInit}
            onNodeClick={(event, node) => {
              // Select the node in our store when clicked
              if (node) {
                setSelectedNodeId(node.id);
              }
            }}
            onPaneClick={() => {
              // Deselect all nodes when clicking on empty canvas
              setSelectedNodeId(null);
            }}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionLineComponent={CustomConnectionLine}
            defaultEdgeOptions={{ type: "custom", data: { type: "default", animated: false } }}
            fitView
            fitViewOptions={{ maxZoom: 0.95 }}
          >
            <Background bgColor={bgColor} color={dotsColor} size={1.5} gap={12} />
          </ReactFlow>
          <CanvasControls />
          <BuilderSidebar />
        </motion.div>

        {/* ─── Drag Resizer Handle ─── */}
        <motion.div
          initial={false}
          onMouseDown={handleMouseDown}
          animate={{
            width: activeView === "both" ? 6 : 0,
            opacity: activeView === "both" ? 1 : 0,
          }}
          transition={layoutTransition}
          className="bg-border hover:bg-primary/50 cursor-col-resize shrink-0 h-full relative z-30 flex items-center justify-center group"
        >
          <div className="w-[1.5px] h-10 rounded bg-muted-foreground/30 group-hover:bg-primary/60 transition-colors" />
        </motion.div>

        {/* ─── Code panel ─── */}
        <motion.div
          initial={false}
          animate={{
            width: activeView === "canvas"
              ? 0
              : activeView === "both"
              ? editorWidth
              : "100%",
            opacity: activeView === "canvas" ? 0 : 1,
          }}
          transition={layoutTransition}
          className={cn(
            "shrink-0 flex flex-col bg-[#f1f1f1] dark:bg-[#1e1e1e] relative overflow-hidden",
            activeView !== "canvas" && "border-l border-border/80"
          )}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-card/60 dark:bg-card/30 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <IconCode className="size-3.5 text-primary" />
              <span className="text-xs font-bold text-foreground">Compiled Python</span>
              <span className="text-[10px] text-muted-foreground font-mono mr-1">strategy.py</span>
              {activeView === "both" && (
                <span className="text-[9px] py-0 px-1.5 bg-muted text-muted-foreground border border-border rounded font-semibold tracking-wide shrink-0">
                  Read-only
                </span>
              )}
            </div>
            <button
              onClick={() => setActiveView("canvas")}
              className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              title="Close code panel"
            >
              <IconX className="size-3.5" />
            </button>
          </div>

          {/* Monaco editor — read-only view of compiled output */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="python"
              theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
              value={codeContent}
              onChange={(value) => {
                if (activeView === "code") {
                  setCodeContent(value || "");
                  setIsCodeModified(true);
                }
              }}
              loading={
                <div className="absolute inset-0 flex items-center justify-center bg-[#ffffff] dark:bg-[#1e1e1e] text-muted-foreground text-xs font-mono">
                  Loading editor...
                </div>
              }
              options={{
                fontSize: 13,
                fontFamily: "var(--font-mono)",
                minimap: { enabled: false },
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                smoothScrolling: true,
                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                lineNumbers: "on",
                renderLineHighlight: "gutter",
                readOnly: activeView === "both",
              }}
            />
          </div>
        </motion.div>

      </div>

      {/* Node Configuration Panel - positioned on the right side */}
      <div className="fixed right-0 top-[68px] bottom-0 z-40">
        <NodeConfigPanel />
      </div>
      
      <NodeCreationDialog />
    </>
  );
}

