"use client";

import React from "react";
import { Twitter, Github, MessageCircle, Send, Linkedin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";

const Footer: React.FC = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

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
    { href: "#", label: "Twitter", icon: Twitter },
    { href: "#", label: "Discord", icon: MessageCircle },
    { href: "#", label: "Telegram", icon: Send },
    { href: "#", label: "GitHub", icon: Github },
    { href: "#", label: "LinkedIn", icon: Linkedin },
  ];

  return (
    <footer className="relative bg-background border-t border-border/40 overflow-hidden pt-24">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-20 mb-20">
          {/* Brand Column */}
          <div className="lg:w-1/3 space-y-8">
            <div className="flex items-center space-x-3">
              {mounted && (
                <Image
                  src={theme === "light" ? "/logo_light.svg" : "/logo_dark.svg"}
                  alt="CrypAlgos Logo"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
              )}
            </div>
            <p className="text-muted-foreground/80 text-sm leading-relaxed max-w-sm">
              Professional algorithmic trading platform for cryptocurrency
              markets. Execute strategies with institutional-grade
              infrastructure and real-time analytics.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map(({ href, label, icon: IconComponent }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="group relative w-10 h-10 rounded-full border border-border/50 bg-background/50 hover:bg-primary hover:border-primary flex items-center justify-center text-muted-foreground hover:text-primary-foreground transition-all duration-300"
                >
                  <IconComponent className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-8">
            {footerSections.map((section) => (
              <div key={section.title} className="space-y-6">
                <h3 className="font-semibold text-xs tracking-widest text-foreground uppercase">
                  {section.title}
                </h3>
                <ul className="space-y-4">
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
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-8 border-t border-border/40 text-xs text-muted-foreground/60">
          <div className="flex items-center gap-2">
            <p>© {new Date().getFullYear()} CrypAlgos.</p>
            <span className="hidden md:inline">•</span>
            <p>All rights reserved.</p>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>

      {/* Large Bottom Text */}
      <div className="w-full flex justify-center overflow-hidden select-none pointer-events-none pb-4">
        <p
          className={`text-center text-5xl md:text-8xl lg:text-[12rem] xl:text-[14rem] 2xl:text-[16rem] font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-neutral-300 dark:to-neutral-900/80 leading-none tracking-tight`}
        >
          CRYPALOGS
        </p>
      </div>
    </footer>
  );
};

export default Footer;
