"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Terminal } from "lucide-react";
import { ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Background,
  BackgroundVariant,
  flowNodeTypes,
  flowEdgeTypes,
  STRATEGY_FLOW_NODES,
  STRATEGY_FLOW_EDGES,
} from "./flow-diagram";

// --- Hero Component ---

export default function HeroSection() {
  return (
    <div className="relative min-h-[90vh] flex items-center bg-background overflow-hidden pt-10 border-b border-border/40">
      
      {/* Architectural Grid Background (Theme Aware) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:16rem_16rem] opacity-60" />
        
        {/* Subtle fade out at the edges */}
        <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,transparent_20%,black_100%)]" />
      </div>

      <div className="container relative z-10 mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-8 items-center">
          
          {/* Left Column: Typography & CTA */}
          <div className="lg:col-span-6 flex flex-col items-start text-left relative z-20">
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
                nodes={STRATEGY_FLOW_NODES}
                edges={STRATEGY_FLOW_EDGES}
                nodeTypes={flowNodeTypes}
                edgeTypes={flowEdgeTypes}
                panOnDrag={false}
                zoomOnScroll={false}
                nodesDraggable={true}
                proOptions={{ hideAttribution: true }}
                fitView
                fitViewOptions={{ padding: 0.1, maxZoom: 1.1 }}
                className="cursor-default"
              >
                <Background
                  color="var(--foreground)"
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
