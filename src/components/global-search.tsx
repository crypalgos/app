"use client";

import * as React from "react"
import { Search } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import { COIN_ID_MAP, getCoinLogoUrl, COIN_NAMES } from "@/lib/instruments"

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <div 
        onClick={() => setOpen(true)}
        className="relative group hidden sm:block w-48 md:w-80 cursor-pointer"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" strokeWidth={2.5} />
        <div className="w-full flex items-center pl-9 h-9 bg-black/5 dark:bg-white/5 border border-transparent group-hover:border-black/10 dark:group-hover:border-white/20 text-muted-foreground group-hover:text-foreground text-xs rounded-full transition-all duration-200">
          Search coins, strategies...
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:flex gap-0.5">
           <kbd className="inline-flex items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[9px] font-medium text-muted-foreground opacity-100">
             <span className="text-xs">⌘</span>K
           </kbd>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Coins">
            {Object.entries(COIN_ID_MAP).map(([symbol]) => (
              <CommandItem key={symbol} value={`${COIN_NAMES[symbol]} ${symbol}`} className="flex items-center gap-3 py-2 cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
                  <img src={getCoinLogoUrl(symbol)} alt={symbol} className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{COIN_NAMES[symbol]}</span>
                  <span className="text-xs text-muted-foreground uppercase">{symbol}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
