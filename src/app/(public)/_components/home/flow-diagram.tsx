"use client";

import { Zap, Split, Play } from "lucide-react";
import {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  Edge,
  Node,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
  EdgeProps,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// --- Shared React Flow nodes/edges for the "strategy flow" demo used in the
// hero and the "Design Without Complexity" scroll-stack panel. Colors route
// through the theme's --success/--muted-foreground tokens (not raw hex) so
// the diagram stays correct in light/dark and matches the app's brand.

export const FlowCustomEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = (data as { active?: boolean; label?: string } | undefined)?.active !== false;
  const label = (data as { label?: string } | undefined)?.label;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={`nodrag nopan font-mono font-medium text-[11px] px-2.5 py-0.5 rounded-md border shadow-sm ${
              isActive
                ? "bg-background text-success border-success/50"
                : "bg-background text-muted-foreground border-border/50"
            }`}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

interface FlowNodeData extends Record<string, unknown> {
  title: string;
  tag: string;
  description: string;
  active?: boolean;
}

export const FlowTriggerNode = ({ data }: NodeProps<Node<FlowNodeData>>) => {
  return (
    <div className="relative bg-card border-[1.5px] border-success shadow-sm rounded-xl w-[250px]">
      <div className="absolute -top-3.5 left-0 flex justify-between w-full px-3">
        <div className="bg-background text-muted-foreground text-[10px] px-2.5 py-0.5 rounded-full border border-border flex items-center gap-1.5 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full border border-current flex items-center justify-center">
            <div className="w-0.5 h-0.5 bg-current rounded-full" />
          </div>
          Trigger
        </div>
        <div className="bg-background text-success text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-success/30 flex items-center gap-1 shadow-sm">
          ✓ Triggered
        </div>
      </div>
      <div className="p-3 pt-5 border-b border-border/40 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 text-primary p-1.5 rounded-md">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm text-foreground tracking-tight">{data.title}</span>
        </div>
        <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded text-muted-foreground border border-border/50">{data.tag}</span>
      </div>
      <div className="p-3 text-[11px] text-muted-foreground leading-relaxed">{data.description}</div>
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-background border-[1.5px] border-success translate-y-1" />
    </div>
  );
};

export const FlowSwitchNode = ({ data }: NodeProps<Node<FlowNodeData>>) => {
  return (
    <div className="relative bg-card border-[1.5px] border-success shadow-sm rounded-xl w-[250px]">
      <div className="absolute -top-3.5 right-3">
        <div className="bg-background text-success text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-success/30 flex items-center gap-1 shadow-sm">
          ✓ Completed
        </div>
      </div>
      <div className="p-3 pt-5 border-b border-border/40 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="bg-accent text-accent-foreground p-1.5 rounded-md">
            <Split className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm text-foreground tracking-tight">{data.title}</span>
        </div>
        <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded text-muted-foreground border border-border/50">{data.tag}</span>
      </div>
      <div className="p-3 pb-1.5 text-[11px] text-muted-foreground leading-relaxed">{data.description}</div>
      <div className="flex justify-between px-6 pb-2 text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
        <span>True</span>
        <span>False</span>
      </div>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-background border-[1.5px] border-success -translate-y-1" />
      <Handle type="source" id="true" position={Position.Bottom} className="w-2.5 h-2.5 bg-background border-[1.5px] border-success translate-y-1" style={{ left: "25%" }} />
      <Handle type="source" id="false" position={Position.Bottom} className="w-2.5 h-2.5 bg-background border-[1.5px] border-border/50 translate-y-1" style={{ left: "75%" }} />
    </div>
  );
};

export const FlowActionNode = ({ data }: NodeProps<Node<FlowNodeData>>) => {
  const isActive = data.active !== false;
  return (
    <div className={`relative bg-card border-[1.5px] shadow-sm rounded-xl w-[250px] transition-colors ${isActive ? "border-success" : "border-border/50"}`}>
      {isActive && (
        <div className="absolute -top-3.5 right-3">
          <div className="bg-background text-success text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-success/30 flex items-center gap-1 shadow-sm">
            ✓ Completed
          </div>
        </div>
      )}
      <div className="p-3 pt-5 border-b border-border/40 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-md ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            <Play className="w-3.5 h-3.5" />
          </div>
          <span className={`font-semibold text-sm tracking-tight ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{data.title}</span>
        </div>
        <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded text-muted-foreground border border-border/50">{data.tag}</span>
      </div>
      <div className="p-3 text-[11px] text-muted-foreground leading-relaxed">{data.description}</div>
      <Handle type="target" position={Position.Top} className={`w-2.5 h-2.5 bg-background border-[1.5px] -translate-y-1 ${isActive ? "border-success" : "border-border/50"}`} />
      <Handle type="source" position={Position.Bottom} className={`w-2.5 h-2.5 bg-background border-[1.5px] translate-y-1 ${isActive ? "border-success" : "border-border/50"}`} />
    </div>
  );
};

export const flowNodeTypes = {
  triggerNode: FlowTriggerNode,
  switchNode: FlowSwitchNode,
  actionNode: FlowActionNode,
};

export const flowEdgeTypes = {
  custom: FlowCustomEdge,
};

export const STRATEGY_FLOW_NODES: Node[] = [
  { id: "1", type: "triggerNode", position: { x: 125, y: 50 }, data: { title: "When Volume Spikes", tag: "Market Data", description: "Trigger when BTC/USDT 5m volume > 1000" } },
  { id: "2", type: "switchNode", position: { x: 125, y: 220 }, data: { title: "Switch", tag: "Condition", description: "Route based on RSI indicator" } },
  { id: "3", type: "actionNode", position: { x: -30, y: 430 }, data: { title: "Execute Buy", tag: "Order", description: "Buy 0.1 BTC at Market", active: true } },
  { id: "4", type: "actionNode", position: { x: 280, y: 430 }, data: { title: "Execute Sell", tag: "Order", description: "Sell 0.1 BTC at Market", active: false } },
];

export const STRATEGY_FLOW_EDGES: Edge[] = [
  { id: "e1-2", source: "1", target: "2", type: "custom", animated: true, style: { stroke: "var(--success)", strokeWidth: 1.5 } },
  { id: "e2-3", source: "2", sourceHandle: "true", target: "3", type: "custom", animated: true, data: { label: "RSI < 30", active: true }, style: { stroke: "var(--success)", strokeWidth: 1.5 } },
  { id: "e2-4", source: "2", sourceHandle: "false", target: "4", type: "custom", animated: false, data: { label: "RSI > 70", active: false }, style: { stroke: "var(--muted-foreground)", strokeWidth: 1.5, strokeDasharray: "4 4" } },
];

export { Background, BackgroundVariant };
