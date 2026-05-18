"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/sonner";

import { useAuthStore } from "@/store/auth-store";

export function Providers({
  children,
  initialUser,
  ...props
}: ThemeProviderProps & { initialUser?: IUser | null }) {
  const [queryClient] = React.useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
        },
      },
    });
    if (initialUser) {
      client.setQueryData(["user", "me"], initialUser);
    }
    return client;
  });

  const hasInitialized = React.useRef(false);
  if (!hasInitialized.current) {
    if (initialUser) {
      useAuthStore.setState({
        user: initialUser,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      useAuthStore.setState({
        isLoading: false,
      });
    }
    hasInitialized.current = true;
  }

  return (
    <NextThemesProvider {...props}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster position="top-right" richColors closeButton />
        </TooltipProvider>
      </QueryClientProvider>
    </NextThemesProvider>
  );
}
