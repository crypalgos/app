"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  IconGitBranch,
  IconGitCommit,
  IconGitMerge,
  IconStarFilled,
  IconHistory,
  IconArrowBackUp,
  IconChevronDown,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useStrategy,
  useStrategyVersions,
  useRestoreVersion,
  useVersionDiff,
} from "@/api-actions/hooks/strategy-hooks";
import type { StrategyVersion } from "@/types/strategy-actions";

function DiffView({ diffCode }: { diffCode: string }) {
  if (!diffCode.trim()) {
    return (
      <p className="text-xs text-muted-foreground py-3 px-1">
        No compiled-code differences from the current draft.
      </p>
    );
  }
  const lines = diffCode.split("\n");
  return (
    <pre className="text-[11px] leading-relaxed font-mono overflow-x-auto rounded-lg border border-border/40 bg-muted/10 p-3 max-h-80">
      {lines.map((line, i) => {
        const cls = line.startsWith("+") && !line.startsWith("+++")
          ? "text-emerald-500 dark:text-emerald-400"
          : line.startsWith("-") && !line.startsWith("---")
            ? "text-rose-500 dark:text-rose-400"
            : line.startsWith("@@")
              ? "text-primary/80"
              : "text-muted-foreground";
        return (
          <div key={i} className={cls}>
            {line || " "}
          </div>
        );
      })}
    </pre>
  );
}

function VersionRow({
  version,
  isCurrent,
  strategyId,
  onRestore,
  isRestoring,
}: {
  version: StrategyVersion;
  isCurrent: boolean;
  strategyId: string;
  onRestore: (version: number) => void;
  isRestoring: boolean;
}) {
  const [diffOpen, setDiffOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data: diff, isLoading: diffLoading } = useVersionDiff(
    diffOpen ? strategyId : null,
    diffOpen ? version.version : null
  );

  return (
    <div className="border border-border/30 bg-muted/10 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
          v{version.version}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">
              {version.label || version.commit_message || `Version ${version.version}`}
            </span>
            {isCurrent && (
              <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border border-primary/20">
                Current
              </Badge>
            )}
            {version.is_golden && (
              <IconStarFilled className="w-3.5 h-3.5 text-amber-500" />
            )}
            {version.is_code_modified && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Custom code
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(version.created_at).toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 gap-1.5"
            onClick={() => setDiffOpen((v) => !v)}
          >
            <IconGitMerge className="w-3.5 h-3.5" />
            Diff
            <IconChevronDown className={cn("w-3.5 h-3.5 transition-transform", diffOpen && "rotate-180")} />
          </Button>
          {!isCurrent && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={() => setConfirmOpen(true)}
              disabled={isRestoring}
            >
              <IconArrowBackUp className="w-3.5 h-3.5" />
              Restore
            </Button>
          )}
        </div>
      </div>
      {diffOpen && (
        <div className="px-4 pb-4">
          {diffLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <DiffView diffCode={diff?.diff_code ?? ""} />
          )}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore version {version.version}?</AlertDialogTitle>
            <AlertDialogDescription>
              This copies version {version.version}&apos;s canvas and compiled code into your
              current draft. Your next backtest, optimization, or other run will
              automatically save this as a new version snapshot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onRestore(version.version);
                setConfirmOpen(false);
              }}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function StrategyVersionsPage() {
  const params = useParams();
  const strategyId = params?.strategyId as string;

  const { data: strategy } = useStrategy(strategyId);
  const { data: versions, isLoading } = useStrategyVersions(strategyId);
  const { mutateAsync: restoreVersion, isPending: isRestoring } = useRestoreVersion(strategyId);

  const handleRestore = async (version: number) => {
    try {
      await restoreVersion(version);
      toast.success(`Version ${version} restored into your draft.`);
    } catch {
      toast.error("Failed to restore version.");
    }
  };

  return (
    <div className="grid gap-6 animate-in fade-in duration-300">
      <Card className="border-border/50 bg-card/40 backdrop-blur-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <IconGitBranch className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Version Control</h2>
          </div>
          <CardDescription>
            Every backtest, optimization, walk-forward, or Monte Carlo run automatically
            snapshots your draft as a new version, so you always know exactly which
            configuration produced a given result.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconGitCommit className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">Commit History</h3>
              <p className="text-xs text-muted-foreground">Restore prior strategy compiles and track visual edits chronologically.</p>
            </div>
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2 opacity-60">
              <IconGitBranch className="w-5 h-5 text-primary/80" />
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">Branching Layouts</h3>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">UPCOMING</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Branch off configurations to test independent trade entry or exit criteria safely.</p>
            </div>
            <div className="border border-border/30 bg-muted/10 p-4 rounded-xl space-y-2">
              <IconGitMerge className="w-5 h-5 text-primary/80" />
              <h3 className="text-sm font-bold">Difference Engine</h3>
              <p className="text-xs text-muted-foreground">Compare a version&apos;s compiled code against your current draft.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : !versions || versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/30 rounded-xl gap-2">
              <IconHistory className="w-6 h-6 text-muted-foreground/60" />
              <p className="text-sm font-medium text-muted-foreground">
                No version snapshots yet — one is created automatically the first
                time you run a backtest, optimization, walk-forward, or Monte Carlo.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <VersionRow
                  key={v.id}
                  version={v}
                  isCurrent={v.version === strategy?.current_version}
                  strategyId={strategyId}
                  onRestore={handleRestore}
                  isRestoring={isRestoring}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
