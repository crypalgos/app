'use client';

import React from 'react';
import { Twitter, Github, MessageCircle, Send, Linkedin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';

const Footer: React.FC = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const footerSections = [
    {
      title: 'PLATFORM',
      links: [
        { href: '/about', label: 'About CrypAlgos' },
        { href: '/pricing', label: 'Pricing Plans' },
        { href: '/docs', label: 'Documentation' },
        { href: '/contact', label: 'Contact Us' }
      ]
    },
    {
      title: 'TRADING',
      links: [
        { href: '#', label: 'Algorithm Library' },
        { href: '#', label: 'Backtesting Tools' },
        { href: '#', label: 'Strategy Builder' },
        { href: '#', label: 'Portfolio Analytics' }
      ]
    },
    {
      title: 'RESOURCES',
      links: [
        { href: '/docs', label: 'API Documentation' },
        { href: '#', label: 'Trading Guides' },
        { href: '#', label: 'Community Forum' },
        { href: '#', label: 'Video Tutorials' }
      ]
    },
    {
      title: 'LEGAL',
      links: [
        { href: '/privacy-policy', label: 'Privacy Policy' },
        { href: '/terms-and-condition', label: 'Terms of Service' },
        { href: '/risk-disclosure', label: 'Risk Disclosure' },
        { href: '/return-policy', label: 'Return Policy' }
      ]
    }
  ];

  const socialLinks = [
    { href: '#', label: 'Twitter', icon: Twitter },
    { href: '#', label: 'Discord', icon: MessageCircle },
    { href: '#', label: 'Telegram', icon: Send },
    { href: '#', label: 'GitHub', icon: Github },
    { href: '#', label: 'LinkedIn', icon: Linkedin }
  ];

  return (
    <footer className="relative bg-background border-t border-border/50 overflow-hidden min-h-[500px]">
      {/* Antigravity Text Background - Full Width Corner to Corner */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <h2 className="text-[18vw] sm:text-[16vw] md:text-[14vw] lg:text-[12vw] xl:text-[20vw] font-black text-foreground/4 whitespace-nowrap leading-none tracking-tighter">
          CrypAlgos
        </h2>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section with Logo */}
        <div className="pt-16 pb-12">
          <div className="flex flex-col items-start space-y-4 mb-12">
            <div className="flex items-center space-x-3">
              {mounted && (
                <Image
                  src={theme === 'light' ? "/logo_light.svg" : "/logo_dark.svg"}
                  alt="CrypAlgos Logo"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
              )}
            </div>
            <p className="text-muted-foreground text-sm max-w-md">
              Professional algorithmic trading platform for cryptocurrency markets. 
              Execute strategies with institutional-grade infrastructure.
            </p>
          </div>

          {/* Footer Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-16">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="font-bold text-xs mb-5 tracking-wider text-foreground/90">
                  {section.title}
                </h3>
                <ul className="space-y-3.5">
                  {section.links.map(({ href, label }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-muted-foreground hover:text-primary text-sm transition-colors duration-200 inline-block hover:translate-x-1 transform"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-6 pt-8 border-t border-border/50">
            {/* Copyright */}
            <div className="flex flex-col md:flex-row items-center gap-2 text-muted-foreground text-sm">
              <p>© {new Date().getFullYear()} CrypAlgos.</p>
              <p className="hidden md:inline">•</p>
              <p>All rights reserved.</p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ href, label, icon: IconComponent }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="group relative w-10 h-10 rounded-lg bg-muted/50 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                >
                  <IconComponent className="w-4 h-4 relative z-10" />
                  <div className="absolute inset-0 rounded-lg bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
