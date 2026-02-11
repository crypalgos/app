import Image from "next/image";
import { AuthVisuals } from "@/components/auth-visuals";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px] h-screen">
      <div className="flex items-center justify-center py-12">{children}</div>
      <div className="hidden bg-muted lg:block">
        <div className="h-full w-full bg-zinc-900 flex items-center justify-center">
          <AuthVisuals />
        </div>
      </div>
    </div>
  );
}
