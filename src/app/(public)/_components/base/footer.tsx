"use client";

import React from "react";
import { IconBrandX, IconBrandGithub, IconBrandLinkedin, IconBrandDiscord, IconBrandTelegram } from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion, useScroll, useTransform } from "motion/react";

const Footer: React.FC = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);
  const translateY = useTransform(scrollYProgress, [0, 1], [80, 0]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 0.95]);

  const lineWidth = useTransform(scrollYProgress, [0, 0.75], ["0%", "100%"]);
  const lineOpacity = useTransform(scrollYProgress, [0, 0.75], [0, 0.6]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const footerSections = [
    {
      title: "PLATFORM",
      links: [
        { href: "/about", label: "About CrypAlgos" },
        { href: "/pricing", label: "Pricing Plans" },
        { href: "/docs", label: "Documentation" },
        { href: "/contact", label: "Contact Us" },
      ],
    },
    {
      title: "TRADING",
      links: [
        { href: "#", label: "Algorithm Library" },
        { href: "#", label: "Backtesting Tools" },
        { href: "#", label: "Strategy Builder" },
        { href: "#", label: "Portfolio Analytics" },
      ],
    },
    {
      title: "RESOURCES",
      links: [
        { href: "/docs", label: "API Documentation" },
        { href: "#", label: "Trading Guides" },
        { href: "#", label: "Community Forum" },
        { href: "#", label: "Video Tutorials" },
      ],
    },
    {
      title: "LEGAL",
      links: [
        { href: "/privacy-policy", label: "Privacy Policy" },
        { href: "/terms-and-condition", label: "Terms of Service" },
        { href: "/risk-disclosure", label: "Risk Disclosure" },
        { href: "/return-policy", label: "Return Policy" },
      ],
    },
  ];

  const socialLinks = [
    { href: "#", label: "Twitter", icon: IconBrandX },
    { href: "#", label: "Discord", icon: IconBrandDiscord },
    { href: "#", label: "Telegram", icon: IconBrandTelegram },
    { href: "#", label: "GitHub", icon: IconBrandGithub },
    { href: "#", label: "LinkedIn", icon: IconBrandLinkedin },
  ];

  return (
    <footer className="relative bg-background border-t border-border/40 overflow-hidden pt-12 sm:pt-16 md:pt-24">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col lg:flex-row justify-between gap-8 sm:gap-10 lg:gap-20 mb-10 sm:mb-14 md:mb-20">
          {/* Brand Column */}
          <div className="lg:w-1/3 space-y-4 sm:space-y-6 md:space-y-8">
            <div className="flex items-center space-x-3">
              {mounted && (
                <Image
                  src={theme === "light" ? "/horizontal_light.svg" : "/horizontal_dark.svg"}
                  alt="CrypAlgos Logo"
                  width={150}
                  height={40}
                  className="h-10 w-auto"
                  style={{ width: "auto" }}
                />
              )}
            </div>
            <p className="text-muted-foreground/80 text-sm leading-relaxed max-w-sm">
              Professional algorithmic trading platform for cryptocurrency
              markets. Execute strategies with institutional-grade
              infrastructure and real-time analytics.
            </p>
          </div>

          {/* Links Grid */}
          <div className="lg:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {footerSections.map((section) => (
              <div key={section.title} className="space-y-3 sm:space-y-4 md:space-y-6">
                <h3 className="font-semibold text-xs tracking-widest text-foreground uppercase">
                  {section.title}
                </h3>
                <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                  {section.links.map(({ href, label }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-muted-foreground/70 hover:text-foreground text-sm transition-colors duration-200 block"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-center gap-2 py-6 sm:py-8 border-t border-border/40 text-xs text-muted-foreground/60">
          <p>© {new Date().getFullYear()} CrypAlgos.</p>
          <span className="hidden md:inline">•</span>
          <p>All rights reserved.</p>
        </div>
      </motion.div>

      <div 
        ref={containerRef}
        className="w-full relative flex flex-col items-center overflow-hidden select-none pointer-events-none pb-4 px-6 md:px-16"
      >
        {/* Horizontal Border Line */}
        {mounted && (
          <motion.div 
            style={{ width: lineWidth, opacity: lineOpacity }}
            className="h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent origin-center mb-10"
          />
        )}

        {/* Cinematic Parallax Reveal Logo */}
        {mounted && (
          <motion.div
            style={{
              scale,
              y: translateY,
              opacity,
              transformOrigin: "bottom center"
            }}
            className="w-full max-w-[1200px] flex justify-center"
          >
            <Image
              src={theme === "light" ? "/text_light.svg" : "/text_dark.svg"}
              alt="CrypAlgos Text"
              width={1200}
              height={200}
              className="w-full h-auto object-contain"
            />
          </motion.div>
        )}
      </div>
    </footer>
  );
};

export default Footer;
