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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { IconLoader2, IconRocket } from "@tabler/icons-react";
import { useBrokerCredentials } from "@/api-actions/hooks/credential-hooks";
import type { LiveTradingMode, StartLiveSessionRequest } from "@/types/live-trading";

interface StartTradingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: StartLiveSessionRequest) => void;
  isSubmitting: boolean;
}

export function StartTradingDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: StartTradingDialogProps) {
  const [mode, setMode] = useState<LiveTradingMode>("PAPER");
  const [credentialId, setCredentialId] = useState<string | null>(null);
  const { data: credentials = [] } = useBrokerCredentials();
  const isPaper = mode === "PAPER";
  const deltaCredentials = credentials.filter(
    (credential) => credential.exchange === "delta" && credential.is_active
  );
  const testnetDeltaCredentials = deltaCredentials.filter(
    (credential) => credential.is_testnet
  );
  const productionDeltaCredentials = deltaCredentials.filter(
    (credential) => !credential.is_testnet
  );
  const environmentCredentials = isPaper
    ? testnetDeltaCredentials
    : productionDeltaCredentials;
  const hasSelectedEnvironmentCredential = environmentCredentials.some(
    (credential) => credential.id === credentialId
  );
  const canSubmit = hasSelectedEnvironmentCredential;

  const handleModeChange = (value: LiveTradingMode) => {
    setMode(value);
    // A credential selected in one environment must never leak into the other.
    setCredentialId(null);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      mode,
      broker: "delta",
      credential_id: credentialId,
    });
  };

  const credentialLabel = isPaper ? "Testnet Credential" : "Production Credential";
  const credentialPlaceholder = isPaper
    ? "Select a Delta Testnet credential"
    : "Select a production Delta credential";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconRocket className="size-5 text-primary" />
            Start Trading
          </DialogTitle>
          <DialogDescription>
            Paper Trading places real orders on Delta Testnet using Testnet funds.
            Live Trading places real orders on Delta Production using real funds.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Mode</label>
            <Select
              value={mode}
              onValueChange={(value) => handleModeChange(value as LiveTradingMode)}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAPER">Paper Trading (Delta Testnet)</SelectItem>
                <SelectItem value="LIVE">Live Trading (Delta Production)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
            <span className="text-xs font-semibold text-muted-foreground">Environment</span>
            <Badge variant="outline">{isPaper ? "DELTA TESTNET" : "DELTA PRODUCTION"}</Badge>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Broker</label>
            <div className="flex h-10 items-center gap-2 rounded-xl border border-border/60 px-3">
              <span className="text-sm font-medium text-foreground">Delta Exchange</span>
              <Badge variant="outline" className="text-[9px]">
                Only supported broker
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {credentialLabel}
            </label>
            <Select value={credentialId ?? undefined} onValueChange={setCredentialId}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder={credentialPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {environmentCredentials.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {isPaper
                      ? "No Delta Testnet credential saved. Add one in Profile."
                      : "No production Delta credential saved. Add one in Profile."}
                  </div>
                ) : (
                  environmentCredentials.map((credential) => (
                    <SelectItem key={credential.id} value={credential.id}>
                      {credential.account_label} ({isPaper ? "Testnet" : "Production"})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="cursor-pointer gap-1.5"
          >
            {isSubmitting ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconRocket className="size-4" />
            )}
            {isPaper ? "Start Testnet Trading" : "Go Live"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
