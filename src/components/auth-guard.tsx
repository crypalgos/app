"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  if (!mounted || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest animate-pulse pl-1">
            Loading Workspace...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
