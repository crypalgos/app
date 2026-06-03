'use client'
import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useNodesStore } from '@/app/(strategy-builder)/store/nodes-store';


const controlItems = [
  {
    id: 'zoom-in',
    icon: ZoomIn,
    tooltip: 'Zoom In',
    shortcut: '+',
    action: 'zoomIn'
  },
  {
    id: 'zoom-out',
    icon: ZoomOut,
    tooltip: 'Zoom Out',
    shortcut: '-',
    action: 'zoomOut'
  },
  {
    id: 'fit-view',
    icon: Maximize,
    tooltip: 'Fit View',
    shortcut: 'F',
    action: 'fitView'
  },
  {
    id: 'reset',
    icon: RotateCcw,
    tooltip: 'Reset View',
    shortcut: 'R',
    action: 'resetView'
  }
];

interface ControlItemProps {
  item: typeof controlItems[0];
  onAction: (action: string) => void;
}

function ControlItem({ item, onAction }: ControlItemProps) {
  const IconComponent = item.icon;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onAction(item.action)}
          className="h-9 w-9"
        >
          <IconComponent className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="font-medium">
          <p>
          {item.tooltip}
          &nbsp;
          <span className="text-xs text-primary-foreground">{item.shortcut}</span>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function CanvasControls() {
  const { zoomIn, zoomOut, fitView, resetView } = useNodesStore();

  const handleAction = (action: string) => {
    switch (action) {
      case 'zoomIn':
        zoomIn();
        break;
      case 'zoomOut':
        zoomOut();
        break;
      case 'fitView':
        fitView();
        break;
      case 'resetView':
        resetView();
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
      <TooltipProvider>
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-2xl p-1 flex items-center gap-1">
          {controlItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <ControlItem
                item={item}
                onAction={handleAction}
              />
              {index === 1 && <Separator orientation="vertical" className="h-6 mx-1" />}
            </React.Fragment>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
