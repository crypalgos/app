"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GoogleLoginButton } from "@/components/google-login-button";
import { IconArrowRight } from "@tabler/icons-react";
import { Mail, Shield, Cpu } from "lucide-react";

interface LoginDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ isOpen, onOpenChange }: LoginDialogProps) {
  const router = useRouter();

  const handleManualLogin = () => {
    onOpenChange(false);
    router.push("/login");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-background text-foreground rounded-2xl overflow-hidden p-0 shadow-lg">
        <div className="p-6 flex flex-col gap-5 relative">
          {/* Subtle ambient brand glow in both themes */}
          <div className="absolute top-0 right-0 -z-10 h-[120px] w-[120px] rounded-full bg-primary/5 blur-[60px] pointer-events-none" />
          
          <DialogHeader className="space-y-2 flex flex-col items-center">
            <div className="mb-2 mt-1 select-none">
              <img
                src="/logo_light.svg"
                alt="CrypAlgos Logo"
                className="block dark:hidden w-[160px] h-auto"
              />
              <img
                src="/logo_dark.svg"
                alt="CrypAlgos Logo"
                className="hidden dark:block w-[160px] h-auto"
              />
            </div>
            <DialogTitle className="sr-only">
              Access Workspace
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs text-center max-w-sm mx-auto">
              Sign in to access your quantitative trading workspace.
            </DialogDescription>
          </DialogHeader>

          {/* Staggered Short & Sweet Options Container */}
          <div className="flex flex-col gap-4 mt-1">
            <div className="min-h-[40px]">
              {isOpen && <GoogleLoginButton onSuccess={() => onOpenChange(false)} />}
            </div>

            <div className="relative flex items-center justify-center my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60"></div>
              </div>
              <span className="relative px-3 text-[10px] uppercase bg-background text-muted-foreground font-bold tracking-wider z-10">
                Or
              </span>
            </div>

            <Button
              onClick={handleManualLogin}
              variant="outline"
              className="w-full h-11 border-border bg-background hover:bg-secondary text-foreground font-medium rounded-xl flex items-center justify-center gap-2 group transition-all duration-200 shadow-sm"
            >
              <Mail className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              Sign in manually
              <IconArrowRight className="size-4 ml-0.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
            </Button>
          </div>

          {/* Secure indicator footer */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground border-t border-border/50 pt-3 mt-1">
            <Shield className="size-3 text-primary/70" />
            <span>End-to-end encrypted session</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
