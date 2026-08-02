"use client";

import { useParams, useRouter } from "next/navigation";
import { IconLoader2, IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useLiveSession } from "@/api-actions/hooks/live-trading-hooks";
import LiveViewer from "../../../../_components/live/live-viewer";

export default function LiveSessionPage() {
  const { workflowid: strategyId, liveId } = useParams<{ workflowid: string; liveId: string }>();
  const router = useRouter();

  const { data: session, isLoading, isError } = useLiveSession(strategyId, liveId);

  if (isLoading) {
    return (
      <div className="fixed inset-0 top-17 bg-background flex items-center justify-center">
        <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="fixed inset-0 top-17 bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Couldn&apos;t find this live session.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/workflow/${strategyId}/live`)}
          className="cursor-pointer gap-1.5"
        >
          <IconArrowLeft className="size-3.5" /> Back to Live
        </Button>
      </div>
    );
  }

  return (
    <LiveViewer
      session={session}
      onBack={() => router.push(`/workflow/${strategyId}/live`)}
    />
  );
}
