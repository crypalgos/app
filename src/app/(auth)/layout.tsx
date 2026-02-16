import Image from "next/image";
import Link from "next/link";
import { FloatingAssets } from "@/components/auth/floating-assets";
import { LogoCloud } from "@/components/auth/logo-cloud";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-background relative overflow-hidden">
      <div className="hidden lg:flex relative w-1/2 flex-col items-center justify-center p-12 overflow-hidden border-r border-border bg-card/20 group">
        {/* Subtle inner glow for dark mode definition */}
        <div className="absolute inset-0 z-20 pointer-events-none border-x border-primary/3 dark:border-primary/5" />

        <div className="absolute inset-0 z-0">

          <div className="absolute inset-0 bg-linear-to-b from-background/10 via-background/50 to-background dark:via-background/70" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-background/10 to-background" />
        </div>

        <FloatingAssets />


        <div className="relative z-10 w-full max-w-lg text-center flex flex-col h-full justify-between py-24">
          <div className="space-y-12">
            <Link
              href="/"
              className="inline-block transform transition-transform hover:scale-105 active:scale-95"
            >
              <Image
                src="/logo_light.svg"
                alt="CrypAlgos"
                width={220}
                height={220}
                className="dark:hidden"
              />
              <Image
                src="/logo_dark.svg"
                alt="CrypAlgos"
                width={220}
                height={220}
                className="hidden dark:block"
              />
            </Link>

            <div className="space-y-6">
              <h2 className="text-5xl font-black italic uppercase tracking-tighter text-foreground leading-[0.9]">
                The Next level of <br />
                <span className="text-primary italic">
                  Institutional Trading
                </span>
              </h2>
              <p className="text-lg text-muted-foreground font-medium opacity-80 leading-relaxed mx-auto max-w-sm">
                Experience ultra-low latency and advanced algorithmic execution
                in a single, professional suite.
              </p>
            </div>
          </div>

          <LogoCloud />
        </div>

      </div>

      {/* Right Rail: Workspace */}
      <div className="w-full lg:flex-1 flex items-center justify-center p-6 sm:p-8 relative">
        {/* Mobile Logo Only */}
        <div className="lg:hidden absolute top-8 left-1/2 -translate-x-1/2 z-50">
          <Link href="/">
            <Image
              src="/logo_light.svg"
              alt="CrypAlgos"
              width={160}
              height={160}
              className="dark:hidden"
            />
            <Image
              src="/logo_dark.svg"
              alt="CrypAlgos"
              width={160}
              height={160}
              className="hidden dark:block"
            />
          </Link>
        </div>

        {/* Subtle background for the workspace side */}
        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none">
          <div className="absolute inset-0 bg-size-[40px_40px] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
