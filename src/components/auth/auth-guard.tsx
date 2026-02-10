"use client";

import { useAuthStore } from "@/store/auth-store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        toast.error("You must be logged in to access this page");
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else {
        setAuthorized(true);
      }
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    // You might want to render a loading spinner here
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
