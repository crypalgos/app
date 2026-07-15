"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import {
  IconChartBar,
  IconInfoCircle,
  IconCalendar,
  IconCurrencyDollar,
  IconActivity,
  IconLoader2,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export interface BacktestConfigParams {
  start_date: string;
  end_date: string;
  initial_capital: number;
}

interface BacktestConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: BacktestConfigParams) => void;
  isSubmitting: boolean;
  /** Overrides the dialog title/description for the Analyse-tab (temporary) flow. */
  temporary?: boolean;
}

export function BacktestConfigDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  temporary = false,
}: BacktestConfigDialogProps) {
  const [btStartDate, setBtStartDate] = useState("2024-01-01");
  const [btEndDate, setBtEndDate] = useState("2024-12-31");
  const [btCapital, setBtCapital] = useState("10000");

  const handleSubmit = () => {
    onSubmit({
      start_date: new Date(btStartDate).toISOString(),
      end_date: new Date(btEndDate).toISOString(),
      initial_capital: parseFloat(btCapital),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconChartBar className="size-5 text-primary" />
            Configure Backtest
          </DialogTitle>
          <DialogDescription>
            {temporary
              ? "Runs against your current draft without saving a strategy version — a quick, disposable experiment."
              : "Set the simulation parameters. The backtest will run asynchronously in a secure worker sandbox."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5">
            <IconInfoCircle className="size-3.5 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Symbol, exchange and leverage</span> are read automatically from your{" "}
              <span className="font-semibold text-foreground">Data Node</span> configuration.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5 select-none">
                <IconCalendar className="size-3.5 text-muted-foreground" /> Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="bt-start"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 text-xs bg-background hover:bg-muted/50 border-input",
                      !btStartDate && "text-muted-foreground"
                    )}
                  >
                    <IconCalendar className="mr-2 size-3.5 opacity-60" />
                    {btStartDate ? format(parseISO(btStartDate), "PPP") : <span className="select-none">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    startMonth={new Date(2018, 0)}
                    endMonth={new Date(new Date().getFullYear() + 2, 11)}
                    selected={btStartDate ? parseISO(btStartDate) : undefined}
                    onSelect={(date) => date && setBtStartDate(format(date, "yyyy-MM-dd"))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5 select-none">
                <IconCalendar className="size-3.5 text-muted-foreground" /> End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="bt-end"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 text-xs bg-background hover:bg-muted/50 border-input",
                      !btEndDate && "text-muted-foreground"
                    )}
                  >
                    <IconCalendar className="mr-2 size-3.5 opacity-60" />
                    {btEndDate ? format(parseISO(btEndDate), "PPP") : <span className="select-none">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    startMonth={new Date(2018, 0)}
                    endMonth={new Date(new Date().getFullYear() + 2, 11)}
                    selected={btEndDate ? parseISO(btEndDate) : undefined}
                    onSelect={(date) => date && setBtEndDate(format(date, "yyyy-MM-dd"))}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bt-capital" className="text-xs font-semibold flex items-center gap-1.5">
              <IconCurrencyDollar className="size-3.5 text-muted-foreground" /> Initial Capital (USD)
            </Label>
            <Input
              id="bt-capital"
              type="number"
              min={100}
              value={btCapital}
              onChange={(e) => setBtCapital(e.target.value)}
              className="h-9 text-sm font-mono"
            />
          </div>

          <div className="flex items-center gap-2 bg-muted/40 border border-border/60 rounded-xl px-3 py-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Summary</span>
            <span className="text-xs font-mono text-foreground ml-auto">
              ${parseFloat(btCapital || "0").toLocaleString()} capital · {btStartDate} → {btEndDate}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="cursor-pointer gap-1.5">
            {isSubmitting ? (
              <>
                <IconLoader2 className="size-3.5 animate-spin" />
                Enqueueing...
              </>
            ) : (
              <>
                <IconActivity className="size-3.5" />
                Run Backtest
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
