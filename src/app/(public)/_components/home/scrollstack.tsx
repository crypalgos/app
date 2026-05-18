"use client";

import ScrollStack, { ScrollStackItem } from "@/components/ui/scrollstack";
import { Zap, Split, Play, Code2, Cpu } from "lucide-react";
import { ReactFlow, Background, BackgroundVariant, Handle, Position, Edge, Node, getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// --- Custom React Flow Nodes & Edges ---
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data }: any) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
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
      <div className="absolute -top-3.5 left-0 flex justify-between w-full px-3">
        <div className="bg-background text-muted-foreground text-[10px] px-2.5 py-0.5 rounded-full border border-border flex items-center gap-1.5 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full border border-current flex items-center justify-center"><div className="w-0.5 h-0.5 bg-current rounded-full" /></div>
          Trigger
        </div>
        <div className="bg-background text-[#54D18F] text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-[#54D18F]/30 flex items-center gap-1 shadow-sm">
          ✓ Triggered
        </div>
      </div>
      <div className="p-3 pt-5 border-b border-border/40 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-500/10 text-blue-500 p-1.5 rounded-md"><Zap className="w-3.5 h-3.5" /></div>
          <span className="font-semibold text-sm text-foreground tracking-tight">{data.title}</span>
        </div>
        <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded text-muted-foreground border border-border/50">{data.tag}</span>
      </div>
      <div className="p-3 text-[11px] text-muted-foreground leading-relaxed">{data.description}</div>
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
          <div className="bg-indigo-500/10 text-indigo-500 p-1.5 rounded-md"><Split className="w-3.5 h-3.5" /></div>
          <span className="font-semibold text-sm text-foreground tracking-tight">{data.title}</span>
        </div>
        <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded text-muted-foreground border border-border/50">{data.tag}</span>
      </div>
      <div className="p-3 pb-1.5 text-[11px] text-muted-foreground leading-relaxed">{data.description}</div>
      <div className="flex justify-between px-6 pb-2 text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
        <span>True</span><span>False</span>
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
          <div className={`p-1.5 rounded-md ${isActive ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'}`}><Play className="w-3.5 h-3.5" /></div>
          <span className={`font-semibold text-sm tracking-tight ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{data.title}</span>
        </div>
        <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded text-muted-foreground border border-border/50">{data.tag}</span>
      </div>
      <div className="p-3 text-[11px] text-muted-foreground leading-relaxed">{data.description}</div>
      <Handle type="target" position={Position.Top} className={`w-2.5 h-2.5 bg-background border-[1.5px] -translate-y-1 ${isActive ? 'border-[#54D18F]' : 'border-border/50'}`} />
      <Handle type="source" position={Position.Bottom} className={`w-2.5 h-2.5 bg-background border-[1.5px] translate-y-1 ${isActive ? 'border-[#54D18F]' : 'border-border/50'}`} />
    </div>
  );
};

const nodeTypes = { triggerNode: TriggerNode, switchNode: SwitchNode, actionNode: ActionNode };
const edgeTypes = { custom: CustomEdge };

const initialNodes: Node[] = [
  { id: '1', type: 'triggerNode', position: { x: 125, y: 50 }, data: { title: 'When Volume Spikes', tag: 'Market Data', description: 'Trigger when BTC/USDT 5m volume > 1000' } },
  { id: '2', type: 'switchNode', position: { x: 125, y: 220 }, data: { title: 'Switch', tag: 'Condition', description: 'Route based on RSI indicator' } },
  { id: '3', type: 'actionNode', position: { x: -30, y: 430 }, data: { title: 'Execute Buy', tag: 'Order', description: 'Buy 0.1 BTC at Market', active: true } },
  { id: '4', type: 'actionNode', position: { x: 280, y: 430 }, data: { title: 'Execute Sell', tag: 'Order', description: 'Sell 0.1 BTC at Market', active: false } }
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'custom', animated: true, style: { stroke: '#54D18F', strokeWidth: 1.5 } },
  { id: 'e2-3', source: '2', sourceHandle: 'true', target: '3', type: 'custom', animated: true, data: { label: 'RSI < 30', active: true }, style: { stroke: '#54D18F', strokeWidth: 1.5 } },
  { id: 'e2-4', source: '2', sourceHandle: 'false', target: '4', type: 'custom', animated: false, data: { label: 'RSI > 70', active: false }, style: { stroke: '#71717a', strokeWidth: 1.5, strokeDasharray: '4 4' } }
];

export default function ScrollStackDemo() {
  return (
    <section className="w-full relative py-8 pb-0">
      <ScrollStack
        viewportClassName="top-20 md:top-24 h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)]"
        title={
          <div className="container mx-auto px-4 mb-4 py-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs font-medium text-muted-foreground mb-5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Ecosystem
            </div>
            <h2 className="text-3xl md:text-5xl font-medium tracking-tighter leading-[1.1] mb-3">
              Build. Test. <span className="text-primary">Deploy.</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg font-light leading-relaxed max-w-lg mx-auto">
              Everything you need to build, test, and deploy industrial-grade
              trading bots.
            </p>
          </div>
        }
      >
        {/* Slide 1: Visual Builder */}
        <ScrollStackItem wrapperClassName="pt-4 md:pt-8" itemClassName="p-0">
          <div className="flex flex-col md:flex-row h-full w-full">
            <div className="flex-1 p-8 md:p-12 flex flex-col justify-center space-y-4 md:space-y-6">
              <div className="inline-flex items-center px-3 py-1 md:px-4 md:py-1.5 w-max rounded-full bg-primary/10 border border-primary/20 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-primary">
                Visual Builder
              </div>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Design Without <br />
                <span className="text-primary">Complexity</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed max-w-xl">
                Build sophisticated trading logic using our intuitive no-code
                canvas. Connect triggers, conditions, and actions with zero
                friction.
              </p>
            </div>
            {/* Visual Side: Interactive React Flow */}
            <div className="hidden md:flex flex-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-primary)_0,transparent_50%)] opacity-[0.03] z-0" />
              <div className="absolute inset-0 z-10">
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
                  fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
                  className="cursor-default"
                />
              </div>
            </div>
          </div>
        </ScrollStackItem>

        {/* Slide 2: Backtesting */}
        <ScrollStackItem wrapperClassName="pt-4 md:pt-8" itemClassName="p-0 border-blue-500/20 hover:border-blue-500/40">
          <div className="flex flex-col md:flex-row h-full w-full">
            <div className="flex-1 p-8 md:p-12 flex flex-col justify-center space-y-4 md:space-y-6">
              <div className="inline-flex items-center px-3 py-1 md:px-4 md:py-1.5 w-max rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-blue-500">
                Code Base Strategy
              </div>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Programmatic <br />
                <span className="text-blue-500">Precision</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed max-w-xl">
                Prefer to write code? Use our python-native SDK to define complex 
                alpha models, statistical arbitrages, and machine learning inferences.
              </p>
            </div>
            {/* Visual Side */}
            <div className="hidden md:flex flex-1 items-center justify-center p-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-blue-500)_0,transparent_50%)] opacity-[0.03]" />
               <div className="w-full max-w-lg rounded-xl border border-zinc-800 dark:border-border bg-[#0d0d0d] dark:bg-card shadow-2xl overflow-hidden font-mono text-[11px] md:text-xs relative z-10 transform hover:scale-[1.02] transition-transform duration-500">
                 <div className="flex items-center px-4 py-2 bg-zinc-900 dark:bg-muted/30 border-b border-zinc-800 dark:border-border">
                   <div className="flex gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                     <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                   </div>
                   <div className="mx-auto text-zinc-500 dark:text-muted-foreground flex items-center gap-2">
                     <Code2 className="w-3.5 h-3.5" />
                     <span>strategy.py</span>
                   </div>
                 </div>
                 <div className="p-4 md:p-6 text-zinc-300 dark:text-foreground overflow-hidden leading-relaxed">
                   <div className="flex"><span className="text-zinc-600 dark:text-muted-foreground select-none mr-4">1</span><span className="text-purple-400">class</span>&nbsp;<span className="text-blue-400">MeanReversion</span><span className="text-zinc-400">(</span><span className="text-emerald-400">Strategy</span><span className="text-zinc-400">):</span></div>
                   <div className="flex"><span className="text-zinc-600 dark:text-muted-foreground select-none mr-4">2</span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">def</span>&nbsp;<span className="text-blue-400">initialize</span><span className="text-zinc-400">(</span><span className="text-orange-400">self</span><span className="text-zinc-400">):</span></div>
                   <div className="flex"><span className="text-zinc-600 dark:text-muted-foreground select-none mr-4">3</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-orange-400">self</span>.set_benchmark(<span className="text-green-300">"BTC-USDT"</span>)</div>
                   <div className="flex"><span className="text-zinc-600 dark:text-muted-foreground select-none mr-4">4</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-orange-400">self</span>.sma1 = <span className="text-orange-400">self</span>.I(SMA, <span className="text-orange-400">self</span>.data.Close, <span className="text-orange-300">10</span>)</div>
                   <div className="flex"><span className="text-zinc-600 dark:text-muted-foreground select-none mr-4">5</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-orange-400">self</span>.sma2 = <span className="text-orange-400">self</span>.I(SMA, <span className="text-orange-400">self</span>.data.Close, <span className="text-orange-300">20</span>)</div>
                   <div className="flex"><span className="text-zinc-600 dark:text-muted-foreground select-none mr-4">6</span></div>
                   <div className="flex"><span className="text-zinc-600 dark:text-muted-foreground select-none mr-4">7</span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">def</span>&nbsp;<span className="text-blue-400">next</span><span className="text-zinc-400">(</span><span className="text-orange-400">self</span><span className="text-zinc-400">):</span></div>
                   <div className="flex"><span className="text-zinc-600 dark:text-muted-foreground select-none mr-4">8</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">if</span> crossover(<span className="text-orange-400">self</span>.sma1, <span className="text-orange-400">self</span>.sma2):</div>
                   <div className="flex"><span className="text-zinc-600 dark:text-muted-foreground select-none mr-4">9</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-orange-400">self</span>.buy()</div>
                   <div className="flex"><span className="text-zinc-600 dark:text-muted-foreground select-none mr-4">10</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">elif</span> crossover(<span className="text-orange-400">self</span>.sma2, <span className="text-orange-400">self</span>.sma1):</div>
                   <div className="flex"><span className="text-zinc-600 dark:text-muted-foreground select-none mr-4">11</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-orange-400">self</span>.sell()</div>
                 </div>
               </div>
            </div>
          </div>
        </ScrollStackItem>

        {/* Slide 3: Live Execution */}
        <ScrollStackItem wrapperClassName="pt-4 md:pt-8" itemClassName="p-0 border-emerald-500/20 hover:border-emerald-500/40">
          <div className="flex flex-col md:flex-row h-full w-full">
            <div className="flex-1 p-8 md:p-12 flex flex-col justify-center space-y-4 md:space-y-6">
              <div className="inline-flex items-center px-3 py-1 md:px-4 md:py-1.5 w-max rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-emerald-500">
                Live Execution
              </div>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Execute With <br />
                <span className="text-emerald-500">Precision</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed max-w-xl">
                Deploy your bots to our low-latency infrastructure. Connect to
                Top-Tier exchanges with institutional-grade speed and reliability.
              </p>
            </div>
            {/* Visual Side */}
            <div className="hidden md:flex flex-1 items-center justify-center p-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-emerald-500)_0,transparent_50%)] opacity-[0.03]" />
               
               <div className="w-full max-w-lg rounded-xl border border-border/50 bg-card shadow-2xl p-6 relative z-10 transform hover:scale-[1.02] transition-transform duration-500">
                 <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-3">
                     <div className="relative">
                       <Cpu className="w-8 h-8 text-emerald-500" />
                       <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                     </div>
                     <div>
                       <h3 className="font-semibold text-lg leading-none">Trading Engine</h3>
                       <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1 font-medium">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Connected
                       </p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Latency</p>
                     <p className="font-mono font-bold text-foreground">12ms</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                     <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Open Positions</p>
                     <p className="text-2xl font-bold">4</p>
                   </div>
                   <div className="bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                     <p className="text-xs opacity-80 mb-1 uppercase tracking-wider">Total PnL</p>
                     <p className="text-2xl font-bold">+$1,402.50</p>
                   </div>
                 </div>

                 <div className="space-y-3">
                   <div className="flex justify-between items-center text-sm p-3 bg-card rounded-md border border-border/50 shadow-sm">
                     <div className="flex items-center gap-3">
                       <span className="font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">BUY</span>
                       <span className="font-medium">BTC/USDT</span>
                     </div>
                     <span className="font-mono text-muted-foreground text-xs">Filled @ 64,230</span>
                   </div>
                   <div className="flex justify-between items-center text-sm p-3 bg-card rounded-md border border-border/50 shadow-sm">
                     <div className="flex items-center gap-3">
                       <span className="font-mono text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded font-bold">SELL</span>
                       <span className="font-medium">ETH/USDT</span>
                     </div>
                     <span className="font-mono text-muted-foreground text-xs">Filled @ 3,450</span>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </ScrollStackItem>
      </ScrollStack>
    </section>
  );
}
