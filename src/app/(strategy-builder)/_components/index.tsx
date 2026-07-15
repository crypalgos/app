"use client";

import {
  Background,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
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
import PlaceholderNode from "./builder/custom-node/placeholder-node";
import PolicyGroupNode from "./builder/custom-node/policy-group-node";
import StartNodeDialog from "./builder/selectors/start-node-dialog";
import DataNodeDialog from "./builder/selectors/data-node-dialog";
import IndicatorNodeDialog from "./builder/selectors/indicator-node-dialog";
import ConditionNodeDrawer from "./builder/selectors/condition-node-drawer";
import ActionNodeDrawer from "./builder/selectors/action-node-drawer";
import PolicyGroupDrawer from "./builder/selectors/policy-group-drawer";
import NodeCreationDialog from "./builder/selectors/node-creation-dialog";
import CustomEdge from "./builder/custom-edge/custom-edge";
import CustomConnectionLine from "./builder/custom-connection-line/custom-connection-line";
import { useTheme } from "next-themes";
import { useNodesStore } from "../store/nodes-store";
import { useSaveCode, useStrategy, useUpdateCanvas } from "@/api-actions/hooks/strategy-hooks";
import { QuantumOrbitLoader } from "@/components/orbit-loader/QuantumOrbitLoader";
import Editor from "@monaco-editor/react";
import { IconCode, IconX, IconLayout, IconColumns, IconAlertTriangle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AnalyseTab from "./analyse/analyse-tab";
import LiveTab from "./live/live-tab";

// Define custom node types
const nodeTypes = {
  startNode: StartNode,
  conditionNode: ConditionNode,
  actionNode: ActionNode,
  dataNode: DataNode,
  indicatorNode: IndicatorNode,
  placeholderNode: PlaceholderNode,
  policyGroupNode: PolicyGroupNode,
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
    builderTab,
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
    setCompileError,
    compileDiagnostics,
    setCompileDiagnostics,
    isProblemsOpen,
    setIsProblemsOpen,
    setDiagnosticsPanelHeight,
  } = useNodesStore();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Canvas/Both/Code view-switch confirmation (relocated from the old
  // toolbar's segmented control — unchanged logic, just moved with it).
  const [viewConfirmOpen, setViewConfirmOpen] = useState(false);
  const [pendingView, setPendingView] = useState<string | null>(null);

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

  const nodesStateStr = JSON.stringify(
    nodes.map((n) => ({ id: n.id, type: n.type, position: n.position, data: n.data }))
  );
  const edgesStateStr = JSON.stringify(
    edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, data: e.data }))
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
          const canvasPayload: any = {
            canvas_version: "4.1",
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
          setCompileError(updated.compile_error ?? null);
          setCompileDiagnostics(updated.compile_diagnostics ?? null);
        } else {
          await saveCode(codeContent);
          setCompileError(null);
          setCompileDiagnostics(null);
        }
        setIsSynced(true);
      } catch (err: any) {
        // Silenced compilation toasts per spec
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
    (instance: any) => {
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

      {builderTab === "analyse" ? (
        <AnalyseTab strategyId={strategyId} />
      ) : builderTab === "live" ? (
        <LiveTab />
      ) : (
      <>
      {/* Main workspace: canvas + optional code panel side-by-side */}
      <div ref={containerRef} className="fixed inset-0 top-[68px] overflow-hidden flex">

        {/* ─── Canvas / Both / Code view-mode control — floats above both
             panes so it stays reachable even when the canvas is fully
             collapsed in "code" view (relocated from the old toolbar). ─── */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
          <div className="flex p-0.5 bg-card/95 backdrop-blur-sm border border-border/80 rounded-full shadow-lg">
            <button
              onClick={() => {
                if (isCodeModified && activeView === "code") {
                  setPendingView("canvas");
                  setViewConfirmOpen(true);
                } else {
                  setActiveView("canvas");
                }
              }}
              className={cn(
                "flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none border border-transparent",
                activeView === "canvas"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <IconLayout className="size-3.5" />
              <span>Canvas</span>
            </button>

            <button
              onClick={() => {
                if (isCodeModified && activeView === "code") {
                  setPendingView("both");
                  setViewConfirmOpen(true);
                } else {
                  setActiveView("both");
                }
              }}
              className={cn(
                "flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none border border-transparent",
                activeView === "both"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <IconColumns className="size-3.5" />
              <span>Both</span>
            </button>

            <button
              onClick={() => setActiveView("code")}
              className={cn(
                "flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none border border-transparent",
                activeView === "code"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <IconCode className="size-3.5" />
              <span>Code</span>
            </button>
          </div>
        </div>

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
            nodes={nodes}
            edges={edges}
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

      <AlertDialog open={viewConfirmOpen} onOpenChange={setViewConfirmOpen}>
        <AlertDialogContent className="sm:max-w-[440px] border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl rounded-2xl p-6">
          <AlertDialogHeader className="gap-2.5 select-none flex flex-col items-start">
            <div className="flex size-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-xs">
              <IconAlertTriangle className="size-5" />
            </div>
            <AlertDialogTitle className="text-[17px] font-extrabold tracking-tight text-foreground leading-snug">
              Confirm Visual Switch
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground/80 font-medium leading-relaxed mt-1 text-left">
              {pendingView === "both"
                ? "Warning: Exposing the canvas in split-screen mode will allow block-editing. Any block action will overwrite your custom Python code. You will lose all manual changes. Do you want to proceed?"
                : "Warning: Leaving the code-only editor will allow block-editing. Any block action will overwrite your custom Python code. You will lose all manual changes. Do you want to proceed?"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6 flex flex-row items-center justify-end gap-2.5">
            <AlertDialogCancel
              onClick={() => setViewConfirmOpen(false)}
              className="h-9.5 px-5 rounded-full border border-border text-xs font-bold hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all duration-200 shadow-xs"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingView) {
                  setActiveView(pendingView);
                }
                setViewConfirmOpen(false);
              }}
              className="h-9.5 px-5 rounded-full text-xs font-bold bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-md shadow-red-950/20 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200 border-0"
            >
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Node Configuration — Dialog & Drawer architecture ── */}
      <StartNodeDialog />
      <DataNodeDialog />
      <IndicatorNodeDialog />
      <ConditionNodeDrawer />
      <ActionNodeDrawer />
      <PolicyGroupDrawer />

      <NodeCreationDialog />
      </>
      )}
    </>
  );
}

