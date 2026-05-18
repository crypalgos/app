"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Terminal, BarChart2, Activity, Cpu, Zap, Split, Play } from "lucide-react";
import { ReactFlow, Background, BackgroundVariant, Handle, Position, Edge, Node, getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// --- Custom React Flow Nodes & Edges ---

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: any) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = data?.active !== false;

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={`nodrag nopan font-mono font-medium text-[11px] px-2.5 py-0.5 rounded-md border shadow-sm ${
              isActive 
                ? 'bg-background text-[#54D18F] border-[#54D18F]/50' 
                : 'bg-background text-muted-foreground border-border/50'
            }`}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const TriggerNode = ({ data }: any) => {
  return (
    <div className="relative bg-card border-[1.5px] border-[#54D18F] shadow-sm rounded-xl w-[250px]">
      {/* Top pills */}
      <div className="absolute -top-3.5 left-0 flex justify-between w-full px-3">
        <div className="bg-background text-muted-foreground text-[10px] px-2.5 py-0.5 rounded-full border border-border flex items-center gap-1.5 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full border border-current flex items-center justify-center">
             <div className="w-0.5 h-0.5 bg-current rounded-full" />
          </div>
          Trigger
        </div>
        <div className="bg-background text-[#54D18F] text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-[#54D18F]/30 flex items-center gap-1 shadow-sm">
          ✓ Triggered
        </div>
      </div>
      <div className="p-3 pt-5 border-b border-border/40 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-500/10 text-blue-500 p-1.5 rounded-md">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm text-foreground tracking-tight">{data.title}</span>
        </div>
        <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded text-muted-foreground border border-border/50">{data.tag}</span>
      </div>
      <div className="p-3 text-[11px] text-muted-foreground leading-relaxed">
        {data.description}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-background border-[1.5px] border-[#54D18F] translate-y-1" />
    </div>
  );
};

const SwitchNode = ({ data }: any) => {
  return (
    <div className="relative bg-card border-[1.5px] border-[#54D18F] shadow-sm rounded-xl w-[250px]">
      <div className="absolute -top-3.5 right-3">
        <div className="bg-background text-[#54D18F] text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-[#54D18F]/30 flex items-center gap-1 shadow-sm">
          ✓ Completed
        </div>
      </div>
      <div className="p-3 pt-5 border-b border-border/40 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-500/10 text-indigo-500 p-1.5 rounded-md">
            <Split className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm text-foreground tracking-tight">{data.title}</span>
        </div>
        <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded text-muted-foreground border border-border/50">{data.tag}</span>
      </div>
      <div className="p-3 pb-1.5 text-[11px] text-muted-foreground leading-relaxed">
        {data.description}
      </div>
      {/* Boolean Handle Indicators */}
      <div className="flex justify-between px-6 pb-2 text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
        <span>True</span>
        <span>False</span>
      </div>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-background border-[1.5px] border-[#54D18F] -translate-y-1" />
      <Handle type="source" id="true" position={Position.Bottom} className="w-2.5 h-2.5 bg-background border-[1.5px] border-[#54D18F] translate-y-1" style={{ left: '25%' }} />
      <Handle type="source" id="false" position={Position.Bottom} className="w-2.5 h-2.5 bg-background border-[1.5px] border-border/50 translate-y-1" style={{ left: '75%' }} />
    </div>
  );
};

const ActionNode = ({ data }: any) => {
  const isActive = data.active !== false;
  return (
    <div className={`relative bg-card border-[1.5px] shadow-sm rounded-xl w-[250px] transition-colors ${isActive ? 'border-[#54D18F]' : 'border-border/50'}`}>
      {isActive && (
        <div className="absolute -top-3.5 right-3">
          <div className="bg-background text-[#54D18F] text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-[#54D18F]/30 flex items-center gap-1 shadow-sm">
            ✓ Completed
          </div>
        </div>
      )}
      <div className="p-3 pt-5 border-b border-border/40 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-md ${isActive ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'}`}>
            <Play className="w-3.5 h-3.5" />
          </div>
          <span className={`font-semibold text-sm tracking-tight ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{data.title}</span>
        </div>
        <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded text-muted-foreground border border-border/50">{data.tag}</span>
      </div>
      <div className="p-3 text-[11px] text-muted-foreground leading-relaxed">
        {data.description}
      </div>
      <Handle type="target" position={Position.Top} className={`w-2.5 h-2.5 bg-background border-[1.5px] -translate-y-1 ${isActive ? 'border-[#54D18F]' : 'border-border/50'}`} />
      <Handle type="source" position={Position.Bottom} className={`w-2.5 h-2.5 bg-background border-[1.5px] translate-y-1 ${isActive ? 'border-[#54D18F]' : 'border-border/50'}`} />
    </div>
  );
};

const nodeTypes = {
  triggerNode: TriggerNode,
  switchNode: SwitchNode,
  actionNode: ActionNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'triggerNode',
    position: { x: 125, y: 50 },
    data: { title: 'When Volume Spikes', tag: 'Market Data', description: 'Trigger when BTC/USDT 5m volume > 1000' }
  },
  {
    id: '2',
    type: 'switchNode',
    position: { x: 125, y: 220 },
    data: { title: 'Switch', tag: 'Condition', description: 'Route based on RSI indicator' }
  },
  {
    id: '3',
    type: 'actionNode',
    position: { x: -30, y: 430 },
    data: { title: 'Execute Buy', tag: 'Order', description: 'Buy 0.1 BTC at Market', active: true }
  },
  {
    id: '4',
    type: 'actionNode',
    position: { x: 280, y: 430 },
    data: { title: 'Execute Sell', tag: 'Order', description: 'Sell 0.1 BTC at Market', active: false }
  }
];

const initialEdges: Edge[] = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2', 
    type: 'custom', 
    animated: true, 
    style: { stroke: '#54D18F', strokeWidth: 1.5 } 
  },
  { 
    id: 'e2-3', 
    source: '2', 
    sourceHandle: 'true',
    target: '3', 
    type: 'custom', 
    animated: true, 
    data: { label: 'RSI < 30', active: true },
    style: { stroke: '#54D18F', strokeWidth: 1.5 } 
  },
  { 
    id: 'e2-4', 
    source: '2', 
    sourceHandle: 'false',
    target: '4', 
    type: 'custom', 
    animated: false, 
    data: { label: 'RSI > 70', active: false },
    style: { stroke: '#71717a', strokeWidth: 1.5, strokeDasharray: '4 4' } 
  }
];

// --- Hero Component ---

export default function HeroSection() {
  return (
    <div className="relative min-h-[90vh] flex items-center bg-background overflow-hidden pt-10 border-b border-border/40">
      
      {/* Architectural Grid Background (Theme Aware) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:16rem_16rem] opacity-60" />
        
        {/* Subtle fade out at the edges */}
        <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,transparent_20%,black_100%)]" />
      </div>

      <div className="container relative z-10 mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-8 items-center">
          
          {/* Left Column: Typography & CTA */}
          <div className="lg:col-span-6 flex flex-col items-start text-left relative z-20">
            
            {/* Version Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs font-medium text-muted-foreground mb-6 backdrop-blur-sm transition-colors hover:bg-muted/80"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              v2.4.0 Engine Release
            </motion.div>

            {/* Massive Institutional Typography */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-7xl lg:text-[5rem] font-medium tracking-tighter leading-[1.05] text-foreground mb-6"
            >
              Quantitative<br />
              Infrastructure.<br />
              <span className="text-primary">
                Built for Alpha.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-10 font-light"
            >
              Professional-grade execution architecture. Backtest strategies visually with tick-level precision and deploy to live markets without managing servers.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
            >
              <Link href="/pricing" className="group">
                <div className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-sm transition-all hover:bg-primary/90 hover:scale-[1.02] shadow-lg shadow-primary/20">
                  <Terminal className="w-4 h-4" />
                  Initialize Workspace
                </div>
              </Link>
              <Link href="/docs" className="group">
                <div className="flex items-center justify-center gap-2 px-8 py-4 bg-background border border-border/80 text-foreground rounded-xl font-medium text-sm transition-all hover:bg-muted shadow-sm">
                  Read Docs
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>

            {/* Institutional Metrics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="mt-16 pt-8 border-t border-border/40 grid grid-cols-2 sm:flex sm:items-center gap-x-12 gap-y-8 w-full"
            >
              <div className="flex flex-col gap-1.5">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-primary"/> Latency
                </div>
                <div className="text-2xl font-semibold text-foreground tracking-tight">&lt; 5ms</div>
              </div>
              
              {/* Divider for desktop */}
              <div className="hidden sm:block w-px h-10 bg-border/40" />

              <div className="flex flex-col gap-1.5">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-primary"/> Backtest Speed
                </div>
                <div className="text-2xl font-semibold text-foreground tracking-tight">10M+ <span className="text-muted-foreground text-sm font-normal">ticks/sec</span></div>
              </div>

              {/* Divider for desktop */}
              <div className="hidden sm:block w-px h-10 bg-border/40" />

              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-primary"/> Uptime
                </div>
                <div className="text-2xl font-semibold text-foreground tracking-tight">99.99%</div>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Interactive React Flow Canvas */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 relative h-[500px] sm:h-[700px] w-full mt-12 lg:mt-0"
          >
            {/* Ambient background glow */}
            <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Boundless React Flow Canvas Container */}
            <div className="absolute inset-0 z-10 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_50%,transparent_100%)]">
              <ReactFlow 
                nodes={initialNodes} 
                edges={initialEdges} 
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                panOnDrag={false}
                zoomOnScroll={false}
                nodesDraggable={true}
                proOptions={{ hideAttribution: true }}
                fitView
                fitViewOptions={{ padding: 0.1, maxZoom: 1.1 }}
                className="cursor-default"
              >
                <Background 
                  color="hsl(var(--foreground))" 
                  style={{ opacity: 0.15 }} 
                  variant={BackgroundVariant.Dots} 
                  gap={20} 
                  size={2} 
                />
              </ReactFlow>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
