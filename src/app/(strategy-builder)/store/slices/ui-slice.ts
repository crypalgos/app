import { StateCreator } from "zustand";
import type { ReactFlowInstance } from "@xyflow/react";
import type { CompilerDiagnostic } from "@/types/strategy-builder";

export interface UISlice {
  reactFlowInstance: ReactFlowInstance | null;
  isSynced: boolean;
  activeView: string;
  isRunning: boolean;
  isBacktesting: boolean;
  isSaving: boolean;
  codeContent: string;
  selectedNodeId: string | null;
  activeCreationType: string | null;
  activeCreationSource: {
    nodeId: string;
    handleId: string | null;
    placeholderId?: string | null;
    originalTargetId?: string | null;
  } | null;

  // Strategy Meta
  strategyId: string | null;
  strategyName: string;
  strategyDescription: string;
  isCodeModified: boolean;
  backtestTaskId: string | null;
  compileError: string | null;
  compileDiagnostics: CompilerDiagnostic[] | null;
  isProblemsOpen: boolean;

  setReactFlowInstance: (instance: ReactFlowInstance) => void;
  setIsSynced: (synced: boolean) => void;
  setActiveView: (view: string) => void;
  setIsRunning: (running: boolean) => void;
  setIsBacktesting: (backtesting: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setCodeContent: (code: string) => void;
  setIsCodeModified: (modified: boolean) => void;
  setStrategyMeta: (id: string, name: string, description: string, isCodeModified: boolean) => void;
  setBacktestTaskId: (taskId: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  setActiveCreationType: (type: string | null) => void;
  setActiveCreationSource: (
    source: {
      nodeId: string;
      handleId: string | null;
      placeholderId?: string | null;
      originalTargetId?: string | null;
    } | null
  ) => void;
  setCompileError: (error: string | null) => void;
  setCompileDiagnostics: (diagnostics: CompilerDiagnostic[] | null) => void;
  setIsProblemsOpen: (open: boolean) => void;
  diagnosticsPanelHeight: number;
  setDiagnosticsPanelHeight: (height: number) => void;

  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
  resetView: () => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set, get) => ({
  reactFlowInstance: null,
  isSynced: true,
  activeView: "canvas",
  isRunning: false,
  isBacktesting: false,
  isSaving: false,
  codeContent: ``,
  selectedNodeId: null,
  activeCreationType: null,
  activeCreationSource: null,
  strategyId: null,
  strategyName: "New Strategy",
  strategyDescription: "",
  isCodeModified: false,
  backtestTaskId: null,
  compileError: null,
  compileDiagnostics: null,
  isProblemsOpen: true,
  diagnosticsPanelHeight: 0,

  setReactFlowInstance: (instance) => set({ reactFlowInstance: instance }),
  setIsSynced: (synced) => set({ isSynced: synced }),
  setActiveView: (activeView) => set({ activeView }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setIsBacktesting: (isBacktesting) => set({ isBacktesting }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setCodeContent: (codeContent) => set({ codeContent, isSynced: false }),
  setIsCodeModified: (isCodeModified) => set({ isCodeModified, isSynced: false }),
  setStrategyMeta: (id, name, description, isCodeModified) =>
    set({ strategyId: id, strategyName: name, strategyDescription: description, isCodeModified, isSynced: false }),
  setBacktestTaskId: (backtestTaskId) => set({ backtestTaskId }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setActiveCreationType: (activeCreationType) => set({ activeCreationType }),
  setActiveCreationSource: (activeCreationSource) => set({ activeCreationSource }),
  setCompileError: (compileError) => set({ compileError }),
  setCompileDiagnostics: (compileDiagnostics) => set({ compileDiagnostics }),
  setIsProblemsOpen: (isProblemsOpen) => set({ isProblemsOpen }),
  setDiagnosticsPanelHeight: (diagnosticsPanelHeight) => set({ diagnosticsPanelHeight }),

  zoomIn: () => {
    const { reactFlowInstance } = get();
    if (reactFlowInstance) reactFlowInstance.zoomIn();
  },
  zoomOut: () => {
    const { reactFlowInstance } = get();
    if (reactFlowInstance) reactFlowInstance.zoomOut();
  },
  fitView: () => {
    const { reactFlowInstance } = get();
    if (reactFlowInstance) reactFlowInstance.fitView({ padding: 0.1, maxZoom: 0.95 });
  },
  resetView: () => {
    const { reactFlowInstance } = get();
    if (reactFlowInstance) reactFlowInstance.setCenter(0, 0, { zoom: 1 });
  },
});
