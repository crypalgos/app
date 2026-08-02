"use client";

import React, { useState } from "react";
import { IconGitMerge, IconCheck } from "@tabler/icons-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DiffEditor } from "@monaco-editor/react";
import { useTheme } from "next-themes";

interface VersionDiffViewerProps {
  diffCode: string;
  originalCode?: string;
  modifiedCode?: string;
  canvasChanged?: boolean;
}

export function VersionDiffViewer({
  diffCode,
  originalCode,
  modifiedCode,
  canvasChanged,
}: VersionDiffViewerProps) {
  const { resolvedTheme } = useTheme();
  const [renderSideBySide, setRenderSideBySide] = useState(false);

  const isLight = resolvedTheme === "light";
  const monacoTheme = isLight ? "vs" : "vs-dark";

  // Check if we have actual code strings for Monaco DiffEditor
  const hasMonacoSource =
    originalCode !== undefined &&
    modifiedCode !== undefined &&
    (originalCode.length > 0 || modifiedCode.length > 0);

  if (!diffCode.trim() && (!hasMonacoSource || originalCode === modifiedCode)) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground p-4 bg-muted/20 border border-border/40 rounded-xl">
        <IconCheck className="size-4 text-emerald-500 shrink-0" />
        <span>No code differences between this version snapshot and your current workspace draft.</span>
      </div>
    );
  }

  const lines = diffCode.split("\n");
  const addedCount = lines.filter((l) => l.startsWith("+") && !l.startsWith("+++")).length;
  const removedCount = lines.filter((l) => l.startsWith("-") && !l.startsWith("---")).length;

  return (
    <div className="flex flex-col gap-0 rounded-xl border border-border/50 bg-card overflow-hidden w-full max-w-full min-w-0 shadow-2xs">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/40 text-xs w-full min-w-0">
        <div className="flex items-center gap-2 font-medium truncate min-w-0">
          <IconGitMerge className="size-4 text-primary shrink-0" />
          <span className="truncate">Compiled Python Diff</span>
          {canvasChanged && (
            <span className="text-[10.5px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md shrink-0">
              DAG Canvas Modified
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] shrink-0 ml-2">
          {hasMonacoSource && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10.5px] px-2 font-mono text-muted-foreground hover:text-foreground border-border/50"
              onClick={() => setRenderSideBySide((v) => !v)}
            >
              {renderSideBySide ? "Inline View" : "Side-by-Side"}
            </Button>
          )}
          <span className="text-emerald-500 font-semibold">+{addedCount}</span>
          <span className="text-rose-500 font-semibold">-{removedCount}</span>
        </div>
      </div>

      {/* Monaco DiffEditor or Theme-Aware Fallback */}
      {hasMonacoSource ? (
        <div className="w-full h-80 rounded-b-xl overflow-hidden border-t border-border/40">
          <DiffEditor
            height="100%"
            language="python"
            original={originalCode}
            modified={modifiedCode}
            theme={monacoTheme}
            options={{
              readOnly: true,
              renderSideBySide: renderSideBySide,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 12,
              lineNumbers: "on",
              domReadOnly: true,
              automaticLayout: true,
              padding: { top: 8, bottom: 8 },
            }}
          />
        </div>
      ) : (
        <ScrollArea className={isLight ? "w-full max-w-full bg-zinc-50 border-t border-border/40 max-h-96" : "w-full max-w-full bg-zinc-950/90 max-h-96"}>
          <div className="p-3 font-mono text-[11.5px] leading-relaxed min-w-max">
            {lines.map((line, i) => {
              const isAdded = line.startsWith("+") && !line.startsWith("+++");
              const isRemoved = line.startsWith("-") && !line.startsWith("---");
              const isHunkHeader = line.startsWith("@@");

              const cls = isAdded
                ? isLight
                  ? "bg-emerald-500/15 text-emerald-800 font-semibold border-l-2 border-emerald-600 pl-2"
                  : "bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-500 pl-2"
                : isRemoved
                  ? isLight
                    ? "bg-rose-500/15 text-rose-800 font-semibold border-l-2 border-rose-600 pl-2"
                    : "bg-rose-500/10 text-rose-400 font-semibold border-l-2 border-rose-500 pl-2"
                  : isHunkHeader
                    ? isLight
                      ? "text-sky-700 font-bold bg-sky-500/15 py-0.5 px-2 rounded-sm my-1"
                      : "text-sky-400 font-bold bg-sky-500/10 py-0.5 px-2 rounded-sm my-1"
                    : isLight
                      ? "text-zinc-700 pl-3.5"
                      : "text-muted-foreground/80 pl-3.5";

              return (
                <div key={i} className={`flex items-start ${cls} whitespace-pre`}>
                  <span className="select-none text-muted-foreground/40 w-8 inline-block text-right pr-3 shrink-0 text-[10px]">
                    {i + 1}
                  </span>
                  <span className="flex-1">{line || " "}</span>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      )}
    </div>
  );
}
