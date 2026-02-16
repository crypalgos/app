"use client";

import React, { useRef } from "react";
import type { ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

export interface ScrollStackItemProps {
  itemClassName?: string;
  children: ReactNode;
  index?: number;
  total?: number;
  progress?: import("framer-motion").MotionValue<number>; // Received from parent useScroll
}

export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({
  children,
  itemClassName = "",
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
        alignItems: "flex-start",
        paddingTop: "2vh", // Move slightly up to fill more viewport
        justifyContent: "center",
      }}
    >
      <div
        className={cn(
          "w-full h-[90vh] rounded-[2.5rem] border border-border bg-card backdrop-blur-2xl shadow-2xl p-8 md:p-16 flex flex-col justify-center overflow-hidden transition-colors duration-500 hover:border-primary/20",
          itemClassName,
        )}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none opacity-50" />
        <div className="relative z-10 max-w-2xl">{children}</div>
        <div className="absolute bottom-8 right-12 text-6xl md:text-8xl font-black italic opacity-[0.03] select-none pointer-events-none uppercase tracking-tighter">
          0{index + 1}
        </div>
      </div>
    </motion.div>
  );
};

interface ScrollStackProps {
  className?: string;
  children: ReactNode;
}

const ScrollStack: React.FC<ScrollStackProps> = ({
  children,
  className = "",
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
      style={{ height: `${total * 100}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden px-4 md:px-8">
        <div className="max-w-6xl mx-auto h-full relative">
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
