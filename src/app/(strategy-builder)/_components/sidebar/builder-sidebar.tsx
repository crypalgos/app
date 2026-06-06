"use client";
import { useState } from "react";

import {
  TrendingUp,
  Zap,
  BarChart3,
  Shield,
  Settings,
  GitBranch,
  MousePointer,
  Hand,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useNodesStore } from "../../store/nodes-store";

// Algorithmic Trading Strategy Builder Tools
const toolbarItems = [
  {
    id: "select",
    icon: MousePointer,
    tooltip: "Select Tool",
    shortcut: "V",
    category: "basic",
  },
  {
    id: "hand",
    icon: Hand,
    tooltip: "Pan Canvas",
    shortcut: "H",
    category: "basic",
  },
  {
    id: "indicators",
    icon: TrendingUp,
    tooltip: "Technical Indicators",
    shortcut: "I",
    category: "analysis",
  },
  {
    id: "conditions",
    icon: GitBranch,
    tooltip: "Logic Conditions",
    shortcut: "C",
    category: "logic",
  },
  {
    id: "actions",
    icon: Zap,
    tooltip: "Trading Actions",
    shortcut: "A",
    category: "trading",
  },
  {
    id: "risk",
    icon: Shield,
    tooltip: "Risk Management",
    shortcut: "R",
    category: "risk",
  },
  {
    id: "data",
    icon: BarChart3,
    tooltip: "Data Sources",
    shortcut: "D",
    category: "data",
  },
  {
    id: "utilities",
    icon: Settings,
    tooltip: "Utilities & Tools",
    shortcut: "U",
    category: "utility",
  },
];

const bottomTools = [
  {
    id: "fit",
    icon: Maximize2,
    tooltip: "Fit Strategy to View",
    shortcut: "F",
    category: "view",
  },
];

interface ToolbarItemProps {
  item: (typeof toolbarItems)[0];
  isActive: boolean;
  onSelect: (id: string) => void;
}

function ToolbarItem({ item, isActive, onSelect }: ToolbarItemProps) {
  const IconComponent = item.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isActive ? "default" : "ghost"}
          size="icon"
          onClick={() => onSelect(item.id)}
          className={`w-10 h-10 ${isActive ? "shadow-md" : ""}`}
        >
          <IconComponent className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium flex items-center">
        <p>
          {item.tooltip}
          &nbsp;
          <span className="text-xs text-muted-foreground">{item.shortcut}</span>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function BuilderSidebar() {
  const [activeTool, setActiveTool] = useState("select");

  const setActiveCreationType = useNodesStore((state) => state.setActiveCreationType);
  const setSelectedNodeId = useNodesStore((state) => state.setSelectedNodeId);

  const handleToolSelect = (toolId: string) => {
    if (toolId === "select" || toolId === "hand") {
      setActiveTool(toolId);
      console.log("Selected canvas tool:", toolId);
      return;
    }

    console.log("Selected action tool:", toolId);
    const nodes = useNodesStore.getState().nodes;

    if (toolId === "risk") {
      const startNode = nodes.find((n) => n.type === "startNode");
      if (startNode) {
        setSelectedNodeId(startNode.id);
      }
      return;
    }

    const toolToNodeMap: Record<string, string> = {
      data: "dataNode",
      indicators: "indicatorNode",
      conditions: "conditionNode",
      actions: "actionNode",
      utilities: "utilityNode",
    };

    const nodeType = toolToNodeMap[toolId];
    if (nodeType) {
      const existingNode = nodes.find((n) => n.type === nodeType);
      if (existingNode) {
        setSelectedNodeId(existingNode.id);
        return;
      }
    }

    // Map sidebar tools to node creation types
    const creationMap: Record<string, string> = {
      data: "data",
      indicators: "indicator",
      conditions: "condition",
      actions: "action",
      utilities: "action",
    };
    
    const creationType = creationMap[toolId];
    if (creationType) {
      setActiveCreationType(creationType);
    }
  };

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
      <TooltipProvider>
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-2xl p-2 flex flex-col gap-1">
          {/* Trading Strategy Tools */}
          <div className="flex flex-col gap-1">
            {toolbarItems.map((item) => (
              <ToolbarItem
                key={item.id}
                item={item}
                isActive={activeTool === item.id}
                onSelect={handleToolSelect}
              />
            ))}
          </div>

          {/* Separator */}
          <Separator className="my-2" />

          {/* View Tools */}
          <div className="flex flex-col gap-1">
            {bottomTools.map((item) => (
              <ToolbarItem
                key={item.id}
                item={item}
                isActive={activeTool === item.id}
                onSelect={handleToolSelect}
              />
            ))}
          </div>

        </div>
      </TooltipProvider>
    </div>
  );
}
