"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children, ...props }: ThemeProviderProps) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <NextThemesProvider {...props}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>{children}</TooltipProvider>
      </QueryClientProvider>
    </NextThemesProvider>
  );
}
