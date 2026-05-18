import { ReactNode } from "react";
import Link from "next/link";
import { Cpu } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-background">
      {/* Left side: Premium Branding */}
      <div className="hidden md:flex relative flex-col justify-between w-1/2 p-10 lg:p-16 border-r border-border bg-zinc-950 text-white overflow-hidden">
        {/* Abstract structural background */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary opacity-20 blur-[100px]" />
        </div>

        <div className="relative z-10 flex items-center">
          <Link href="/">
            <img
              src="/logo_dark.svg"
              alt="CrypAlgos Logo"
              width={190}
              height={190}
              className="w-[150px] lg:w-[190px] h-auto"
            />
          </Link>
        </div>

        <div className="relative z-10 max-w-md mt-auto">
          <h2 className="text-3xl lg:text-5xl font-medium tracking-tight leading-tight mb-6">
            Institutional quantitative infrastructure.
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Build, test, and deploy high-frequency trading models with sub-millisecond execution. Join the forefront of algorithmic trading.
          </p>
        </div>
      </div>

      {/* Right side: Auth Content */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-12 lg:p-16 bg-background relative overflow-hidden">
         {/* Mobile Logo Header */}
         <div className="absolute top-8 left-6 md:hidden z-20">
           <Link href="/">
             <img
               src="/logo_light.svg"
               alt="CrypAlgos Logo"
               width={150}
               height={150}
               className="block dark:hidden w-[140px] h-auto"
             />
             <img
               src="/logo_dark.svg"
               alt="CrypAlgos Logo"
               width={150}
               height={150}
               className="hidden dark:block w-[140px] h-auto"
             />
           </Link>
         </div>

         {/* Subtle ambient lighting for right side */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary)_0,transparent_50%)] opacity-[0.03] pointer-events-none" />
         
         <div className="w-full max-w-[400px] mx-auto z-10 relative mt-12 md:mt-0">
           {children}
         </div>
      </div>
    </div>
  );
}
