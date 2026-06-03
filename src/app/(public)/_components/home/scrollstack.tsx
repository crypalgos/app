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
        viewportClassName="top-24 md:top-28"
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
        <ScrollStackItem wrapperClassName="pt-2 md:pt-4" itemClassName="p-0">
          <div className="flex flex-col md:flex-row h-full w-full">
            <div className="flex-1 p-6 sm:p-8 md:p-10 flex flex-col justify-center space-y-3 md:space-y-4">
              <div className="inline-flex items-center px-3 py-1 w-max rounded-full bg-primary/10 border border-primary/20 text-[9px] md:text-xs font-semibold uppercase tracking-wider text-primary">
                Visual Builder
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                Design Without <br />
                <span className="text-primary">Complexity</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium leading-relaxed max-w-xl">
                Build sophisticated trading logic using our intuitive no-code
                canvas. Connect triggers, conditions, and actions with zero
                friction.
              </p>
            </div>
            <div className="hidden md:flex flex-1 relative overflow-hidden h-full">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-primary)_0,transparent_50%)] opacity-[0.03] z-0" />
              <div className="absolute inset-0 z-10 p-4">
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
                  fitViewOptions={{ padding: 0.15, maxZoom: 0.95 }}
                  className="cursor-default"
                />
              </div>
            </div>
          </div>
        </ScrollStackItem>

        <ScrollStackItem wrapperClassName="pt-2 md:pt-4" itemClassName="p-0 border-blue-500/20 hover:border-blue-500/40">
          <div className="flex flex-col md:flex-row h-full w-full">
            <div className="flex-1 p-6 sm:p-8 md:p-10 flex flex-col justify-center space-y-3 md:space-y-4">
              <div className="inline-flex items-center px-3 py-1 w-max rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] md:text-xs font-semibold uppercase tracking-wider text-blue-500">
                Code Base Strategy
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                Programmatic <br />
                <span className="text-blue-500">Precision</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium leading-relaxed max-w-xl">
                Prefer to write code? Use our python-native SDK to define complex 
                alpha models, statistical arbitrages, and machine learning inferences.
              </p>
            </div>
            <div className="hidden md:flex flex-1 items-center justify-center p-6 relative overflow-hidden h-full">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-blue-500)_0,transparent_50%)] opacity-[0.03]" />
               <div className="w-full max-w-md rounded-xl border border-zinc-800 dark:border-border bg-[#0d0d0d] dark:bg-card shadow-2xl overflow-hidden font-mono text-[10px] md:text-xs relative z-10 transform hover:scale-[1.01] transition-transform duration-500 max-h-[380px]">
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
                 <div className="p-4 text-zinc-300 dark:text-foreground overflow-hidden leading-relaxed">
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

        <ScrollStackItem wrapperClassName="pt-2 md:pt-4" itemClassName="p-0 border-emerald-500/20 hover:border-emerald-500/40">
          <div className="flex flex-col md:flex-row h-full w-full">
            <div className="flex-1 p-6 sm:p-8 md:p-10 flex flex-col justify-center space-y-3 md:space-y-4">
              <div className="inline-flex items-center px-3 py-1 w-max rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] md:text-xs font-semibold uppercase tracking-wider text-emerald-500">
                Live Execution
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                Execute With <br />
                <span className="text-emerald-500">Precision</span>
              </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium leading-relaxed max-w-xl">
                Deploy your bots to our low-latency infrastructure. Connect to
                Top-Tier exchanges with institutional-grade speed and reliability.
              </p>
            </div>
            <div className="hidden md:flex flex-1 items-center justify-center p-6 relative overflow-hidden h-full">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-emerald-500)_0,transparent_50%)] opacity-[0.03]" />
                
                {/* Institutional Trading Console */}
                <div className="w-full max-w-md rounded-xl border border-border bg-card/90 shadow-2xl p-5 relative z-10 font-mono text-[10px] max-h-[380px] overflow-hidden flex flex-col justify-between gap-4">
                  
                  {/* Console Header */}
                  <div className="flex justify-between items-center border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="relative flex size-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                      </div>
                      <span className="font-bold text-foreground">EXECUTION_ENGINE_v1.0.4</span>
                    </div>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-semibold">
                      Collocated TY3
                    </span>
                  </div>

                  {/* Top Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted/30 border border-border/45 rounded-lg p-2.5 flex flex-col">
                      <span className="text-[8px] text-muted-foreground uppercase">Latency</span>
                      <span className="text-foreground font-bold mt-0.5">0.86ms</span>
                    </div>
                    <div className="bg-muted/30 border border-border/45 rounded-lg p-2.5 flex flex-col">
                      <span className="text-[8px] text-muted-foreground uppercase">Active Bots</span>
                      <span className="text-foreground font-bold mt-0.5">3 Running</span>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5 flex flex-col">
                      <span className="text-[8px] text-emerald-500/80 uppercase">Daily PnL</span>
                      <span className="text-emerald-500 font-bold mt-0.5">+$4,291.50</span>
                    </div>
                  </div>

                  {/* Realtime PnL Tracking Chart */}
                  <div className="relative bg-muted/20 border border-border/40 rounded-xl p-3 h-28 flex flex-col justify-between">
                    <div className="flex justify-between text-[8px] text-muted-foreground">
                      <span>PnL Chart (Daily Strategy Run)</span>
                      <span className="text-emerald-500 font-semibold">+1.84% CAGR</span>
                    </div>

                    <div className="relative w-full h-14 my-1">
                      <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M0,25 L15,22 L30,28 L45,15 L60,18 L75,8 L90,14 L100,5 L100,30 L0,30 Z" fill="url(#pnlGrad)" />
                        <path d="M0,25 L15,22 L30,28 L45,15 L60,18 L75,8 L90,14 L100,5" fill="none" stroke="#10b981" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                        
                        {/* Order Markers */}
                        <circle cx="45" cy="15" r="2.5" fill="#ef4444" stroke="#ffffff" strokeWidth="0.75" />
                        <circle cx="75" cy="8" r="2.5" fill="#10b981" stroke="#ffffff" strokeWidth="0.75" />
                      </svg>
                      {/* Badge labels matching order markers */}
                      <span className="absolute top-[4px] left-[42%] text-[7px] bg-red-500/10 text-red-500 border border-red-500/20 px-1 rounded transform scale-90">SELL</span>
                      <span className="absolute top-[18px] left-[70%] text-[7px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1 rounded transform scale-90">BUY</span>
                    </div>

                    <div className="flex justify-between text-[7px] text-muted-foreground/60 border-t border-border/10 pt-1">
                      <span>09:00 AM UTC</span>
                      <span>17:00 PM UTC (Active)</span>
                    </div>
                  </div>

                  {/* Execution Log Table */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[8px] text-muted-foreground font-semibold uppercase tracking-wider px-1">
                      <span>Recent Executions</span>
                      <span>Status</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center bg-muted/10 border border-border/30 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500 bg-emerald-500/10 px-1 rounded font-bold scale-90">BUY</span>
                          <span className="text-foreground font-semibold">BTC/USDT</span>
                          <span className="text-muted-foreground">0.42 BTC</span>
                        </div>
                        <span className="text-muted-foreground">FILLED</span>
                      </div>
                      <div className="flex justify-between items-center bg-muted/10 border border-border/30 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-red-500 bg-red-500/10 px-1 rounded font-bold scale-90">SELL</span>
                          <span className="text-foreground font-semibold">SOL/USDT</span>
                          <span className="text-muted-foreground">24.5 SOL</span>
                        </div>
                        <span className="text-muted-foreground">FILLED</span>
                      </div>
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
