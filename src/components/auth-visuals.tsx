import React from "react";
import {
  Gemini,
  Replit,
  MagicUI,
  VSCodium,
  MediaWiki,
  GooglePaLM,
} from "@/components/logos";
import { LogoIcon } from "@/components/logo";
import { cn } from "@/lib/utils";

export function AuthVisuals() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8">
      <div className="aspect-16/10 group relative mx-auto flex w-full max-w-88 items-center justify-between sm:max-w-sm">
        <div
          role="presentation"
          className="bg-linear-to-b border-foreground/5 absolute inset-0 z-10 aspect-square animate-spin items-center justify-center rounded-full border-t from-lime-500/15 to-transparent to-25% opacity-0 duration-[3.5s] group-hover:opacity-100 dark:from-white/5"
        ></div>
        <div
          role="presentation"
          className="bg-linear-to-b border-foreground/5 absolute inset-16 z-10 aspect-square scale-90 animate-spin items-center justify-center rounded-full border-t from-blue-500/15 to-transparent to-25% opacity-0 duration-[3.5s] group-hover:opacity-100"
        ></div>
        <div className="bg-linear-to-b from-muted-foreground/15 absolute inset-0 flex aspect-square items-center justify-center rounded-full border-t to-transparent to-25%">
          <IntegrationCard className="-translate-x-1/6 absolute left-0 top-1/4 -translate-y-1/4">
            <Gemini />
          </IntegrationCard>
          <IntegrationCard className="absolute top-0 -translate-y-1/2">
            <Replit />
          </IntegrationCard>
          <IntegrationCard className="translate-x-1/6 absolute right-0 top-1/4 -translate-y-1/4">
            <MagicUI />
          </IntegrationCard>
        </div>
        <div className="bg-linear-to-b from-muted-foreground/15 absolute inset-16 flex aspect-square scale-90 items-center justify-center rounded-full border-t to-transparent to-25%">
          <IntegrationCard className="absolute top-0 -translate-y-1/2">
            <VSCodium />
          </IntegrationCard>
          <IntegrationCard className="absolute left-0 top-1/4 -translate-x-1/4 -translate-y-1/4">
            <MediaWiki />
          </IntegrationCard>
          <IntegrationCard className="absolute right-0 top-1/4 -translate-y-1/4 translate-x-1/4">
            <GooglePaLM />
          </IntegrationCard>
        </div>
        <div className="absolute inset-x-0 bottom-0 mx-auto my-2 flex w-fit justify-center gap-2">
          <div className="bg-muted relative z-20 rounded-full border p-1">
            <IntegrationCard
              className="shadow-black-950/10 dark:bg-background size-16 border-black/20 shadow-xl dark:border-white/25 dark:shadow-white/15"
              isCenter={true}
            >
              <LogoIcon className="text-blue-500" />
            </IntegrationCard>
          </div>
        </div>
      </div>
      <div className="mt-16 max-w-[36rem] space-y-8 text-center">
        <h2 className="text-balance bg-linear-to-br from-white from-30% to-white/40 bg-clip-text py-2 text-5xl font-medium leading-none tracking-tighter text-transparent shadow-xl sm:text-6xl md:text-7xl lg:text-7xl">
          Integrate with your favorite tools
        </h2>
        <p className="text-lg text-muted-foreground md:text-xl relative z-10 max-w-2xl mx-auto">
          Connect seamlessly with popular platforms and services to enhance your
          workflow.
        </p>
      </div>
    </div>
  );
}

const IntegrationCard = ({
  children,
  className,
  isCenter = false,
}: {
  children: React.ReactNode;
  className?: string;
  isCenter?: boolean;
}) => {
  return (
    <div
      className={cn(
        "relative z-30 flex size-12 rounded-full border bg-white shadow-sm shadow-black/5 dark:bg-white/5 dark:backdrop-blur-md",
        className,
      )}
    >
      <div className={cn("m-auto size-fit *:size-5", isCenter && "*:size-8")}>
        {children}
      </div>
    </div>
  );
};
