"use client";

import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import ProfileDropdown from "@/components/kokonutui/profile-dropdown";
import { useUser } from "@/api-actions/hooks/user-hooks";
import { NavbarButton } from "@/app/(public)/_components/base/resizable-navbar";
import { IconLogin2 } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { LoginDialog } from "@/components/login-dialog";
import { useAuthStore } from "@/store/auth-store";

export function DashboardHeaderActions() {
  const { data: user, isLoading } = useUser();
  const { isAuthenticated } = useAuthStore();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldShowLoader = mounted && isAuthenticated && isLoading;
  const shouldShowUser = mounted && user;

  return (
    <div className="pl-2 shrink-0 flex items-center gap-3">
      <ThemeToggle className="scale-90" />
      
      {!mounted ? (
        isAuthenticated ? (
          <div className="w-8 h-8 flex items-center justify-center">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground/60" />
          </div>
        ) : (
          <NavbarButton
            variant="shimmer"
            as="button"
            onClick={() => setIsLoginOpen(true)}
            className="h-8.5 py-1 px-3 text-xs font-bold gap-1.5"
          >
            Login
            <IconLogin2 size={15} stroke={2.5} />
          </NavbarButton>
        )
      ) : shouldShowLoader ? (
        <div className="w-8 h-8 flex items-center justify-center">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground/60" />
        </div>
      ) : shouldShowUser ? (
        <ProfileDropdown className="scale-95 origin-right" />
      ) : (
        <NavbarButton
          variant="shimmer"
          as="button"
          onClick={() => setIsLoginOpen(true)}
          className="h-8.5 py-1 px-3 text-xs font-bold gap-1.5"
        >
          Login
          <IconLogin2 size={15} stroke={2.5} />
        </NavbarButton>
      )}

      <LoginDialog isOpen={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </div>
  );
}
