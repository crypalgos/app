"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#fcfcfc] dark:bg-black overflow-hidden selection:bg-primary/20 text-foreground transition-colors duration-300">
      
      {/* Background Dots - Base Layer (Adapts to light/dark) */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.04] dark:opacity-[0.15] text-black dark:text-white"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Interactive Mouse Spotlight on Dots (Stronger in dark mode) */}
      {isMounted && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-[0.15] dark:opacity-100 text-black dark:text-white"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '32px 32px',
            maskImage: `radial-gradient(350px circle at ${mousePosition.x}px ${mousePosition.y}px, black, transparent 100%)`,
            WebkitMaskImage: `radial-gradient(350px circle at ${mousePosition.x}px ${mousePosition.y}px, black, transparent 100%)`
          }}
        />
      )}

      {/* Interactive Mouse Ambient Glow (Subtle in both modes) */}
      {isMounted && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 hidden dark:block"
          style={{
            background: `radial-gradient(500px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.03), transparent 60%)`
          }}
        />
      )}
      {isMounted && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 block dark:hidden"
          style={{
            background: `radial-gradient(500px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0,0,0,0.02), transparent 60%)`
          }}
        />
      )}

      {/* Header Logo */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-50">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <img
            src="/horizontal_light.svg"
            alt="CrypAlgos Logo"
            className="block dark:hidden h-6 w-auto"
          />
          <img
            src="/horizontal_dark.svg"
            alt="CrypAlgos Logo"
            className="hidden dark:block h-6 w-auto"
          />
        </Link>
      </div>

      {/* Main Content Area - Ultra Minimal Card (Adapts to light/dark) */}
      <div className="relative z-30 w-full max-w-[420px] mx-4 my-16">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col p-8 sm:p-10 bg-card border border-border shadow-[0_0_80px_-20px_rgba(0,0,0,0.06)] dark:shadow-[0_0_100px_-20px_rgba(255,255,255,0.03)] rounded-2xl"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
