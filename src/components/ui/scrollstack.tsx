"use client";

import React, { useRef } from "react";
import type { ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

export interface ScrollStackItemProps {
  itemClassName?: string;
  wrapperClassName?: string;
  children: ReactNode;
  index?: number;
  total?: number;
  progress?: import("framer-motion").MotionValue<number>; // Received from parent useScroll
}

export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({
  children,
  itemClassName = "",
  wrapperClassName = "",
  index = 0,
  total = 0,
  progress,
}) => {
  // New Milestone-based logic:
  // Each card 'i' enters between milestone i-1 and i.
  // Each card 'i' scales down between milestone i and i+1.
  const milestone = (i: number) =>
    Math.min(1, Math.max(0, i / (total - 1 || 1)));

  const entryStart = milestone(index - 1);
  const entryEnd = milestone(index);
  const exitEnd = milestone(index + 1);

  // Guard against undefined progress (though it should be provided by parent)
  const defaultProgress = useTransform(() => 0);
  const activeProgress = progress || defaultProgress;

  // y animation: Entry only (except for first card which is already there)
  const y = useTransform(
    activeProgress,
    [entryStart, entryEnd],
    ["100%", "0%"],
  );

  // scale: When this card is being covered by the NEXT one
  const scale = useTransform(
    activeProgress,
    [entryEnd, exitEnd],
    [1, 0.94 - index * 0.01],
  );

  return (
    <motion.div
      className={wrapperClassName}
      style={{
        y: index === 0 ? "0%" : y, // First card starts at top
        scale: scale as any,
        zIndex: index,
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className={cn(
          "w-full h-[90%] md:h-[85%] min-h-[400px] md:min-h-[460px] rounded-[2rem] md:rounded-[2.5rem] border border-border bg-card backdrop-blur-2xl shadow-lg p-6 md:p-8 lg:p-10 flex flex-col justify-center overflow-hidden transition-colors duration-500 hover:border-primary/20",
          itemClassName,
        )}
      >
        <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-primary/10 rounded-full blur-[60px] md:blur-[100px] pointer-events-none opacity-50" />
        <div className="relative z-10 w-full h-full">{children}</div>
      </div>
    </motion.div>
  );
};

interface ScrollStackProps {
  className?: string;
  viewportClassName?: string;
  title?: ReactNode;
  children: ReactNode;
}

const ScrollStack: React.FC<ScrollStackProps> = ({
  children,
  className = "",
  viewportClassName = "",
  title,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const childrenArray = React.Children.toArray(children);
  const total = childrenArray.length;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      style={{ height: `${total * 65}vh` }}
    >
      {/* Title rendered above sticky container so it scrolls out of view */}
      {title && <div className="w-full relative z-20 mb-8">{title}</div>}

      <div
        className={cn(
          "sticky top-20 md:top-24 h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] w-full overflow-hidden px-4 md:px-8 flex flex-col justify-center",
          viewportClassName,
        )}
      >
        <div className="max-w-6xl mx-auto w-full relative flex items-center justify-center h-full">
          {childrenArray.map((child, index) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(
                child as React.ReactElement<ScrollStackItemProps>,
                {
                  index,
                  total,
                  progress: scrollYProgress,
                },
              );
            }
            return child;
          })}
        </div>
      </div>
    </div>
  );
};

export default ScrollStack;
