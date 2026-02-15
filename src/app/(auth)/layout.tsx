
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background relative overflow-hidden">
      {/* Background patterns */}
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
      <div className="absolute top-0 inset-x-0 z-50 flex justify-center">
        <div className="flex w-full max-w-[calc(100vw-2rem)] flex-row items-center justify-between py-2 lg:max-w-[95%] lg:px-4 lg:py-4">
          <Link href="/" className="flex items-center space-x-2 px-2 py-1 select-none">
            <Image
              src="/logo_light.svg"
              alt="CrypAlgos"
              width={190}
              height={190}
              className="dark:hidden"
            />
            <Image
              src="/logo_dark.svg"
              alt="CrypAlgos"
              width={190}
              height={190}
              className="hidden dark:block"
            />
          </Link>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto p-4">
        {children}
      </div>
    </div>
  );
}
