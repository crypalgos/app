"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import { AuthActions } from "@/api-actions/auth-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleLoginButton({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const setLogin = useAuthStore((state) => state.setLogin);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const buttonRef = useRef<HTMLDivElement>(null);

  const activeTheme = resolvedTheme || theme || "dark";
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "your-google-client-id.apps.googleusercontent.com";

  useEffect(() => {
    // 1. Check if script is already loaded
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      setInitializing(false);
      return;
    }

    // 2. Dynamically load Google GSI script safely after hydration (Vercel best practice)
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setScriptLoaded(true);
      setInitializing(false);
    };
    script.onerror = () => {
      setInitializing(false);
      toast.error("Failed to load Google Sign-In SDK. Please refresh the page.");
    };
    document.body.appendChild(script);

    return () => {
      // Keep it loaded globally
    };
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !window.google?.accounts?.id || !buttonRef.current) return;

    const handleCredentialResponse = async (response: any) => {
      try {
        const id_token = response.credential;
        if (!id_token) {
          toast.error("Google authentication returned empty credentials.");
          return;
        }

        const loginResponse = await AuthActions.GoogleLoginAction({ id_token });
        setLogin(loginResponse);
        toast.success("Welcome back! Logged in via Google successfully.");
        if (onSuccess) {
          onSuccess();
        }
        router.push("/strategies");
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Google authentication failed.");
      }
    };

    try {
      // 3. Initialize Google Auth client
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Measure the exact parent container width to perfectly align with credentials inputs
      const parentWidth = buttonRef.current.parentElement?.offsetWidth || 380;
      const clampedWidth = Math.max(200, Math.min(400, parentWidth));

      // 4. Render the official, fully compliant Google branded button
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "filled_blue",
        size: "large",
        width: `${clampedWidth}`,
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
      });
    } catch (err) {
      console.error("Error rendering Google Sign-In Button", err);
    }
  }, [scriptLoaded, activeTheme, clientId, router, setLogin]);

  return (
    <div className="w-full relative h-10">
      {initializing && (
        <Skeleton className="w-full h-10 rounded-xl animate-pulse" />
      )}
      
      {/* Visual Shadcn primary button representation */}
      <div className={`w-full ${initializing ? "absolute pointer-events-none opacity-0" : ""}`}>
        <Button
          variant="outline"
          className="w-full h-10 bg-white text-black hover:bg-gray-50 border border-gray-200 dark:bg-white dark:text-black dark:hover:bg-gray-100 font-semibold rounded-xl flex items-center justify-center gap-2 group transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <FcGoogle className="size-5 shrink-0" />
          <span>Continue with Google</span>
        </Button>
      </div>

      {/* Invisible overlay containing the official Google button iframe to capture click and trigger safe SDK modal popup */}
      <div 
        ref={buttonRef} 
        id="google-signin-button" 
        className={`absolute inset-0 w-full h-full cursor-pointer z-20 opacity-[0.01] transition-all duration-300 ${initializing ? "pointer-events-none" : ""}`}
      />
    </div>
  );
}
