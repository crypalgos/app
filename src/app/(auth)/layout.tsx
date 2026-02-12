import { AuthVisuals } from "@/components/auth-visuals";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px] h-screen">
      <div className="relative flex items-center justify-center py-12 bg-background">
        {/* Subtle grid pattern */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none",
            "bg-size-[40px_40px]",
            "bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
            "dark:bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
            "opacity-50",
          )}
        />
        <div className="pointer-events-none absolute inset-0 bg-background mask-[radial-gradient(ellipse_at_center,transparent_20%,black)]" />

        {/* Logo */}
        <Link href="/" className="absolute top-8 left-8 z-20">
          <Image
            src="/logo_light.svg"
            alt="CrypAlgos"
            width={150}
            height={60}
            className="dark:hidden"
          />
          <Image
            src="/logo_dark.svg"
            alt="CrypAlgos"
            width={150}
            height={60}
            className="hidden dark:block"
          />
        </Link>

        <div className="relative z-10">{children}</div>
      </div>
      <div className="hidden lg:block">
        <div className="h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center">
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-size-[80px_80px]" />

          {/* Noise texture for depth */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay bg-[url('/assets/demo/grain.webp')] bg-size-[400px_400px] bg-repeat" />

          <AuthVisuals />
        </div>
      </div>
    </div>
  );
}
