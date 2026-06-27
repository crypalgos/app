"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { QuantumOrbitLoader } from "@/components/orbit-loader/QuantumOrbitLoader";

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
        <QuantumOrbitLoader variant="default" size="lg" text="Loading Workspace..." />
      </div>
    );
  }

  return <>{children}</>;
}

