"use client";

import GlobalProviders from "@/components/providers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
export default function ClientWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GlobalProviders>
      <ScrollArea className="h-dvh w-full">
        {children}
        <Toaster />
      </ScrollArea>
    </GlobalProviders>
  );
}
