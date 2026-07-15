"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useUser, useUpdateUser } from "@/api-actions/hooks/user-hooks";
import { useSessions, useDeleteSession, useDeleteAllSessions } from "@/api-actions/hooks/session-hooks";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  Mail,
  Phone,
  Globe,
  Calendar,
  Trash2,
  Plus,
  Loader2,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Laptop,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  Coins
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
import { QuantumOrbitLoader } from "@/components/orbit-loader/QuantumOrbitLoader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  EXCHANGES,
  VERIFIABLE_EXCHANGES,
  type Exchange as ExchangeValue,
  type BrokerCredential,
} from "@/api-actions/credential-actions";
import {
  useBrokerCredentials,
  useSaveBrokerCredential,
  useVerifyBrokerCredential,
  useRotateBrokerCredential,
  useDeleteBrokerCredential,
} from "@/api-actions/hooks/credential-hooks";
import {
  useNotificationPreference,
  useSaveNotificationPreference,
} from "@/api-actions/hooks/notification-hooks";

const EXCHANGE_STYLE: Record<ExchangeValue, { logo: string; color: string }> = {
  delta: { logo: "DELTA", color: "from-primary/10 to-indigo-500/5 text-primary border-primary/20" },
  binance: { logo: "BNB", color: "from-amber-500/10 to-yellow-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  bybit: { logo: "BYBIT", color: "from-purple-500/10 to-indigo-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  okx: { logo: "OKX", color: "from-slate-500/10 to-gray-500/5 text-slate-700 dark:text-slate-300 border-slate-500/20" },
};

type VerifyState = "idle" | "verifying" | "success" | "unsupported" | "failed";

function verifyNote(state: VerifyState, message?: string): { tone: "muted" | "success" | "warning" | "danger"; text: string } | null {
  switch (state) {
    case "verifying":
      return { tone: "muted", text: "Verifying connection..." };
    case "success":
      return { tone: "success", text: message || "Connection verified successfully." };
    case "unsupported":
      return {
        tone: "warning",
        text: "Live verification isn't available for this exchange yet — credentials will still be saved encrypted.",
      };
    case "failed":
      return { tone: "danger", text: message || "Verification failed — check your API key/secret." };
    default:
      return null;
  }
}

export default function ProfilePage() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { mutate: updateUser, isPending: isSavingProfile } = useUpdateUser();
  const router = useRouter();

  // Active Sessions hooks
  const { data: sessionsData, isLoading: isSessionsLoading } = useSessions();
  const { mutate: deleteSession, isPending: isDeletingSession } = useDeleteSession();
  const { mutate: deleteAllSessions, isPending: isDeletingAllSessions } = useDeleteAllSessions();

  // Active Tab state synced with URL search parameters for high-end SaaS UX
  const [activeTab, setActiveTab] = React.useState("profile");

  // Form states for profile
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [countryCode, setCountryCode] = React.useState<number>(91);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // ── Broker credentials (real backend) ────────────────────────────────────
  const { data: credentials, isLoading: isCredentialsLoading } = useBrokerCredentials();
  const { mutateAsync: saveCredential, isPending: isSavingCredential } = useSaveBrokerCredential();
  const { mutateAsync: verifyCredential } = useVerifyBrokerCredential();
  const { mutateAsync: rotateCredential, isPending: isRotatingCredential } = useRotateBrokerCredential();
  const { mutateAsync: deleteCredential } = useDeleteBrokerCredential();

  const [connectOpen, setConnectOpen] = React.useState(false);
  const [connectExchange, setConnectExchange] = React.useState<ExchangeValue>("delta");
  const [connectLabel, setConnectLabel] = React.useState("");
  const [connectKey, setConnectKey] = React.useState("");
  const [connectSecret, setConnectSecret] = React.useState("");
  const [connectPassphrase, setConnectPassphrase] = React.useState("");
  const [connectTestnet, setConnectTestnet] = React.useState(true);
  const [verifyState, setVerifyState] = React.useState<VerifyState>("idle");
  const [verifyMessage, setVerifyMessage] = React.useState<string | undefined>();

  const resetConnectForm = () => {
    setConnectExchange("delta");
    setConnectLabel("");
    setConnectKey("");
    setConnectSecret("");
    setConnectPassphrase("");
    setConnectTestnet(true);
    setVerifyState("idle");
    setVerifyMessage(undefined);
  };

  const canSubmitConnect = connectLabel.trim() && connectKey.trim() && connectSecret.trim() && !isSavingCredential;

  const handleConnectExchange = async () => {
    const isVerifiable = VERIFIABLE_EXCHANGES.includes(connectExchange);

    if (isVerifiable) {
      setVerifyState("verifying");
      try {
        const result = await verifyCredential({
          exchange: connectExchange,
          api_key: connectKey,
          api_secret: connectSecret,
          passphrase: connectPassphrase || undefined,
          is_testnet: connectTestnet,
        });
        setVerifyState(result.success ? "success" : "failed");
        setVerifyMessage(result.message);
      } catch {
        setVerifyState("failed");
      }
    } else {
      setVerifyState("unsupported");
    }

    try {
      await saveCredential({
        exchange: connectExchange,
        account_label: connectLabel.trim(),
        api_key: connectKey,
        api_secret: connectSecret,
        passphrase: connectPassphrase || undefined,
        is_testnet: connectTestnet,
      });
      toast.success(
        isVerifiable ? "Broker credentials saved." : "Saved — live verification isn't supported for this exchange yet."
      );
      setConnectOpen(false);
      resetConnectForm();
    } catch {
      toast.error("Failed to save broker credentials.");
    }
  };

  const [rotateTarget, setRotateTarget] = React.useState<BrokerCredential | null>(null);
  const [rotateKey, setRotateKey] = React.useState("");
  const [rotateSecret, setRotateSecret] = React.useState("");
  const [rotatePassphrase, setRotatePassphrase] = React.useState("");

  const openRotate = (credential: BrokerCredential) => {
    setRotateTarget(credential);
    setRotateKey("");
    setRotateSecret("");
    setRotatePassphrase("");
  };

  const handleRotateExchange = async () => {
    if (!rotateTarget) return;
    try {
      await rotateCredential({
        credentialId: rotateTarget.id,
        data: { api_key: rotateKey, api_secret: rotateSecret, passphrase: rotatePassphrase || undefined },
      });
      toast.success("Keys rotated successfully.");
      setRotateTarget(null);
    } catch {
      toast.error("Failed to rotate keys.");
    }
  };

  const [deleteExchangeTarget, setDeleteExchangeTarget] = React.useState<BrokerCredential | null>(null);

  const handleDisconnectExchange = async () => {
    if (!deleteExchangeTarget) return;
    const target = deleteExchangeTarget;
    setDeleteExchangeTarget(null);
    try {
      await deleteCredential(target.id);
      toast.success("Exchange disconnected.");
    } catch {
      toast.error("Failed to disconnect exchange.");
    }
  };

  // ── Telegram / notification integrations (real backend) ──────────────────
  const { data: notificationPref, isLoading: isNotificationPrefLoading } = useNotificationPreference();
  const { mutate: saveNotificationPref, isPending: isSavingNotificationPref } = useSaveNotificationPreference();

  const [telegramEnabled, setTelegramEnabled] = React.useState(false);
  const [telegramChatId, setTelegramChatId] = React.useState("");
  const [timezone, setTimezone] = React.useState("UTC");
  const [paperAlerts, setPaperAlerts] = React.useState(true);
  const [liveAlerts, setLiveAlerts] = React.useState(true);
  const [stoplossAlerts, setStoplossAlerts] = React.useState(true);
  const [tpAlerts, setTpAlerts] = React.useState(true);

  React.useEffect(() => {
    if (notificationPref) {
      setTelegramEnabled(notificationPref.telegram_enabled);
      setTelegramChatId(notificationPref.telegram_chat_id || "");
      setTimezone(notificationPref.timezone || "UTC");
      setPaperAlerts(notificationPref.paper_alerts);
      setLiveAlerts(notificationPref.live_alerts);
      setStoplossAlerts(notificationPref.stoploss_alerts);
      setTpAlerts(notificationPref.tp_alerts);
    }
  }, [notificationPref]);

  const handleSaveNotificationPref = () => {
    if (telegramEnabled && !telegramChatId.trim()) {
      toast.error("Enter your Telegram chat ID, or turn off Telegram alerts.");
      return;
    }
    saveNotificationPref(
      {
        telegram_chat_id: telegramChatId.trim() || null,
        telegram_enabled: telegramEnabled,
        timezone,
        paper_alerts: paperAlerts,
        live_alerts: liveAlerts,
        stoploss_alerts: stoplossAlerts,
        tp_alerts: tpAlerts,
      },
      {
        onSuccess: () => toast.success("Notification preferences saved."),
        onError: () => toast.error("Failed to save notification preferences."),
      }
    );
  };

  // Sync tab state from URL parameters safely
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["profile", "exchanges", "integrations", "sessions"].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  // Session Revocation handlers
  const handleRevokeSession = (sessionId: string) => {
    const session = sessionsData?.sessions.find((s: ISession) => s.id === sessionId);
    deleteSession(sessionId, {
      onSuccess: (res) => {
        toast.success(res.message || "Session revoked successfully");
        if (session?.is_current) {
          router.push("/login");
        }
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to revoke session");
      }
    });
  };

  const handleRevokeAllSessions = () => {
    deleteAllSessions(undefined, {
      onSuccess: (res) => {
        toast.success(res.message || "All other sessions revoked successfully");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to revoke sessions");
      }
    });
  };

  // Handler to change tab and update URL search query dynamically
  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", val);
      window.history.pushState(null, "", url.toString());
    }
  };

  // Sync profile details when user is loaded
  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUsername(user.username || "");
      setPhone(user.phone || "");
      setCountryCode(user.country_code || 91);
    }
  }, [user]);

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <QuantumOrbitLoader size="md" text="Loading profile settings..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle className="size-10 text-destructive" />
        <h3 className="font-semibold text-lg">Not Authenticated</h3>
        <p className="text-sm text-muted-foreground">Please log in to manage your trading profile.</p>
      </div>
    );
  }

  // Interactive profile saving
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Frontend validations to match UpdateUserSchema
    if (name.length < 3 || name.length > 50) {
      setValidationError("Name must be between 3 and 50 characters long.");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setValidationError("Username must be 3-20 characters, letters, numbers, or underscores only.");
      return;
    }
    if (phone.length < 10 || phone.length > 15) {
      setValidationError("Phone number must be between 10 and 15 digits long.");
      return;
    }
    if (countryCode < 1 || countryCode > 999) {
      setValidationError("Country code must be a valid phone prefix code.");
      return;
    }

    updateUser({
      name,
      username,
      phone,
      country_code: Number(countryCode),
    }, {
      onSuccess: () => {
        toast.success("Profile updated successfully!");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to update profile.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto select-none animate-in fade-in duration-500">
      
      {/* Upper Title Header */}
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Account & Security</h1>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex gap-1 py-0.5 px-2.5 text-[10px] font-bold items-center select-none uppercase">
                <Coins className="size-3" />
                Algo Trader Pro
              </Badge>
              <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 dark:text-emerald-400 border-emerald-500/20 flex gap-1 py-0.5 px-2.5 text-[10px] font-bold items-center select-none uppercase">
                <CheckCircle2 className="size-3" />
                {user.is_verified ? "Verified" : "Unverified"}
              </Badge>
            </div>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-0.5">
            Configure your professional profiles, manage exchange links, and configure credentials.
          </p>
        </div>
      </div>

      <Separator className="bg-border/60" />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side Quick Profile Summary Card */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="border border-border/80 bg-card rounded-2xl shadow-xs overflow-hidden group pt-0 pb-0 gap-0">
            {/* cover image mesh gradient with decorative SVG grid pattern overlay */}
            <div className="relative h-24 bg-gradient-to-br from-primary/30 via-violet-500/20 to-accent/10 dark:from-primary/40 dark:via-purple-500/25 dark:to-accent/15">
              <div className="absolute inset-0 opacity-15 mix-blend-overlay">
                <svg className="size-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                  <defs>
                    <pattern id="summary-grid" width="12" height="12" patternUnits="userSpaceOnUse">
                      <path d="M 12 0 L 0 0 0 12" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#summary-grid)" />
                </svg>
              </div>
            </div>
            
            <CardContent className="relative flex flex-col items-center p-6 -mt-12">
              <div className="size-20 rounded-full bg-background p-1 shadow-sm ring-4 ring-primary/10 border-2 border-background group-hover:scale-105 transition-all duration-300">
                <Avatar className="size-full">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <h2 className="text-lg font-bold text-foreground mt-3 tracking-tight">{name}</h2>
              <p className="text-xs text-muted-foreground">@{username}</p>
              
              <div className="flex flex-col gap-2.5 w-full mt-6 text-xs text-muted-foreground">
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="flex items-center gap-1.5 text-muted-foreground/80">
                    <Mail className="size-3.5" /> Email
                  </span>
                  <span className="font-semibold text-foreground break-all select-all ml-4 text-right">{user.email}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="flex items-center gap-1.5 text-muted-foreground/80">
                    <Phone className="size-3.5" /> Phone
                  </span>
                  <span className="font-semibold text-foreground">
                    {phone ? `+${countryCode} ${phone}` : "Not Connected"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="flex items-center gap-1.5 text-muted-foreground/80">
                    <Calendar className="size-3.5" /> Member Since
                  </span>
                  <span className="font-semibold text-foreground">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "2026-05-18"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card rounded-2xl p-5 shadow-xs flex flex-col gap-3 relative overflow-hidden group">
            {/* Hover subtle glow decoration */}
            <div className="absolute -right-12 -top-12 size-24 rounded-full bg-primary/5 group-hover:scale-125 transition-transform duration-500 blur-xl" />
            <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="size-4.5 text-primary animate-pulse" /> API Guidelines
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              API Keys are highly sensitive credentials. Platform API Keys allow external trading engines to manage your live portfolios. 
              **Never share your private keys or secrets with third parties.**
            </p>
            <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5 rounded-xl cursor-pointer hover:bg-primary/5 hover:text-primary transition-all duration-300 mt-1" asChild>
              <a href="/dashboard/documentation" target="_blank" rel="noopener noreferrer">
                API Spec Docs
                <ExternalLink className="size-3" />
              </a>
            </Button>
          </Card>
        </div>

        {/* Right Side Settings Area with Line-tabs */}
        <div className="lg:col-span-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col gap-6">
            
            {/* Premium Underlined Vercel settings-style tabs */}
            <TabsList variant="line" className="w-full border-b border-border/80 justify-start gap-6 h-10 bg-transparent p-0 rounded-none">
              <TabsTrigger value="profile" className="flex items-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-none cursor-pointer">
                <User className="size-3.5" />
                Profile Info
              </TabsTrigger>
              <TabsTrigger value="exchanges" className="flex items-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-none cursor-pointer">
                <Coins className="size-3.5" />
                Exchange Connections
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-none cursor-pointer">
                <Send className="size-3.5" />
                Integrations
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-none cursor-pointer">
                <Laptop className="size-3.5" />
                Active Sessions
              </TabsTrigger>
            </TabsList>

            {/* TAB CONTENT: PROFILE INFO */}
            <TabsContent value="profile" className="animate-in fade-in duration-300">
              <Card className="border border-border/80 bg-card rounded-2xl shadow-xs">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold">Profile Identity Settings</CardTitle>
                  <CardDescription className="text-xs">Update your basic name details and verify contact information.</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {validationError ? (
                    <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
                      <AlertCircle className="size-4" />
                      <span>{validationError}</span>
                    </div>
                  ) : null}

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Name input with prefix icon */}
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-name" className="text-xs font-bold text-foreground/80">Full Legal Name</Label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                          <Input 
                            id="profile-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Legal name"
                            className="h-10.5 pl-10 rounded-xl border-border/50 bg-black/[0.01] dark:bg-white/[0.01] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-300"
                            required
                          />
                        </div>
                      </div>
                      
                      {/* Username input with prefix handle */}
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-username" className="text-xs font-bold text-foreground/80">Username</Label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-muted-foreground/60 select-none">@</span>
                          <Input 
                            id="profile-username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Trading handle"
                            className="h-10.5 pl-8 rounded-xl border-border/50 bg-black/[0.01] dark:bg-white/[0.01] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-300"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Readonly Email Input with prefix */}
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-email" className="text-xs font-bold text-foreground/80">Primary Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                          <Input 
                            id="profile-email"
                            value={user.email}
                            disabled
                            className="h-10.5 pl-10 rounded-xl border-border/50 bg-muted/30 cursor-not-allowed text-muted-foreground/70"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground/80">Email address cannot be changed directly.</p>
                      </div>

                      {/* Phone Contact details grouped side-by-side */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground/80">Contact Phone Number</Label>
                        <div className="flex gap-2">
                          {/* Compact Country Code */}
                          <div className="relative w-28 shrink-0">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
                            <Input 
                              id="profile-code"
                              type="number"
                              value={countryCode}
                              onChange={(e) => setCountryCode(Number(e.target.value))}
                              placeholder="91"
                              className="h-10.5 pl-8 rounded-xl border-border/50 bg-black/[0.01] dark:bg-white/[0.01] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-300 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              required
                            />
                          </div>
                          
                          {/* Phone Number taking the rest */}
                          <div className="relative flex-1">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                            <Input 
                              id="profile-phone"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="9999999999"
                              className="h-10.5 pl-10 rounded-xl border-border/50 bg-black/[0.01] dark:bg-white/[0.01] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-300"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-3">
                      <Button 
                        type="submit" 
                        disabled={isSavingProfile}
                        className="h-10.5 px-6 font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                      >
                        {isSavingProfile ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Saving Profile...
                          </>
                        ) : (
                          "Save Settings"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB CONTENT: EXCHANGE CONNECTIONS */}
            <TabsContent value="exchanges" className="animate-in fade-in duration-300">
              <Card className="border border-border/80 bg-card rounded-2xl shadow-xs">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="text-lg font-bold">Exchange Integrations</CardTitle>
                    <CardDescription className="text-xs">Establish execution endpoints by integrating your API keys of exchange partners.</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setConnectOpen(true)}
                    className="text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 rounded-xl cursor-pointer gap-1.5 shrink-0"
                  >
                    <Plus className="size-3.5" /> Connect Exchange
                  </Button>
                </CardHeader>
                <CardContent className="pt-2">
                  {isCredentialsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="h-[160px] rounded-2xl bg-muted/40 animate-pulse" />
                      ))}
                    </div>
                  ) : !credentials || credentials.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border rounded-2xl">
                      <p className="text-xs text-muted-foreground">
                        No exchanges connected yet. Connect one above to enable live trading.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {credentials.map((credential) => {
                        const style = EXCHANGE_STYLE[credential.exchange];
                        return (
                          <div
                            key={credential.id}
                            className={cn(
                              "border rounded-2xl p-4 bg-gradient-to-br flex flex-col justify-between gap-4 transition-all hover:shadow-xs group/item relative overflow-hidden",
                              style.color
                            )}
                          >
                            <div className="flex justify-between items-start z-10">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="size-9 rounded-xl bg-background border border-border/60 flex items-center justify-center font-black text-[10px] text-foreground shadow-xs group-hover/item:scale-105 transition-transform duration-300 shrink-0">
                                  {style.logo.slice(0, 4)}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm tracking-tight text-foreground truncate">{credential.account_label}</h4>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {EXCHANGES.find((e) => e.value === credential.exchange)?.label ?? credential.exchange}
                                  </p>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="size-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/60 transition-all cursor-pointer shrink-0 z-10">
                                    <Settings className="size-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem onClick={() => openRotate(credential)} className="cursor-pointer">
                                    <RefreshCw className="size-3.5 mr-2" /> Rotate Keys
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setDeleteExchangeTarget(credential)}
                                    variant="destructive"
                                    className="cursor-pointer"
                                  >
                                    <Trash2 className="size-3.5 mr-2" /> Disconnect
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="space-y-1 mt-1 z-10">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Active API Key</p>
                              <div className="flex items-center justify-between bg-background/80 border border-border/45 backdrop-blur-xs p-2 rounded-xl text-xs font-mono">
                                <span className="truncate max-w-[160px] text-foreground/80">{credential.api_key_masked}</span>
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-[9px] font-bold py-0.5 px-2 tracking-wide uppercase border shrink-0",
                                    credential.is_testnet
                                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  )}
                                >
                                  {credential.is_testnet ? "Testnet" : "Live"}
                                </Badge>
                              </div>
                            </div>

                            <div className="text-[10px] text-muted-foreground/80 z-10 flex items-center gap-1.5">
                              {credential.last_verified_at ? (
                                <>
                                  <CheckCircle2 className="size-3 text-emerald-500" />
                                  Verified {new Date(credential.last_verified_at).toLocaleDateString()}
                                </>
                              ) : credential.last_error ? (
                                <>
                                  <AlertCircle className="size-3 text-amber-500" />
                                  {credential.last_error}
                                </>
                              ) : (
                                "Not yet verified"
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB CONTENT: INTEGRATIONS (TELEGRAM) */}
            <TabsContent value="integrations" className="animate-in fade-in duration-300">
              <Card className="border border-border/80 bg-card rounded-2xl shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">App Integrations</CardTitle>
                  <CardDescription className="text-xs">
                    Connect Telegram to receive real-time alerts for your strategies.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {isNotificationPrefLoading ? (
                    <div className="h-[220px] rounded-2xl bg-muted/40 animate-pulse" />
                  ) : (
                    <div className="space-y-5">
                      <div className="p-4 border border-border/60 bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/20 flex items-center justify-center shrink-0">
                              <Send className="size-4 text-[#229ED9]" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm tracking-tight text-foreground">Telegram</h4>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Get instant alerts on trade fills, stop losses, and take profits.
                              </p>
                            </div>
                          </div>
                          <Switch checked={telegramEnabled} onCheckedChange={setTelegramEnabled} className="cursor-pointer" />
                        </div>

                        {telegramEnabled && (
                          <div className="space-y-3 pt-1">
                            <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-[11px] text-muted-foreground leading-relaxed">
                              Message your Telegram bot to start a chat, then find your numeric chat ID with{" "}
                              <span className="font-semibold text-foreground">@userinfobot</span> on Telegram and paste it below.
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="telegram-chat-id" className="text-xs font-bold text-foreground/80">Telegram Chat ID</Label>
                              <Input
                                id="telegram-chat-id"
                                value={telegramChatId}
                                onChange={(e) => setTelegramChatId(e.target.value)}
                                placeholder="e.g. 123456789"
                                className="h-10 rounded-xl font-mono text-xs"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="telegram-timezone" className="text-xs font-bold text-foreground/80">Timezone</Label>
                              <Input
                                id="telegram-timezone"
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                placeholder="e.g. UTC, Asia/Kolkata"
                                className="h-10 rounded-xl text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-bold text-sm text-foreground">Alert Types</h4>
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between p-3 border border-border/60 bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl">
                            <div>
                              <h5 className="font-semibold text-xs text-foreground">Paper Trading Fills</h5>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Notify when a paper-trading order fills.</p>
                            </div>
                            <Switch checked={paperAlerts} onCheckedChange={setPaperAlerts} className="cursor-pointer" />
                          </div>
                          <div className="flex items-center justify-between p-3 border border-border/60 bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl">
                            <div>
                              <h5 className="font-semibold text-xs text-foreground">Live Trading Fills</h5>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Notify when a live order fills.</p>
                            </div>
                            <Switch checked={liveAlerts} onCheckedChange={setLiveAlerts} className="cursor-pointer" />
                          </div>
                          <div className="flex items-center justify-between p-3 border border-border/60 bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl">
                            <div>
                              <h5 className="font-semibold text-xs text-foreground">Stop Loss Executions</h5>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Notify when a stop loss triggers.</p>
                            </div>
                            <Switch checked={stoplossAlerts} onCheckedChange={setStoplossAlerts} className="cursor-pointer" />
                          </div>
                          <div className="flex items-center justify-between p-3 border border-border/60 bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl">
                            <div>
                              <h5 className="font-semibold text-xs text-foreground">Take Profit Executions</h5>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Notify when a take profit triggers.</p>
                            </div>
                            <Switch checked={tpAlerts} onCheckedChange={setTpAlerts} className="cursor-pointer" />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          onClick={handleSaveNotificationPref}
                          disabled={isSavingNotificationPref}
                          className="h-10 px-6 font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        >
                          {isSavingNotificationPref ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Notification Settings"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB CONTENT: ACTIVE SESSIONS */}
            <TabsContent value="sessions" className="animate-in fade-in duration-300">
              <Card className="border border-border/80 bg-card rounded-2xl shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold">Active Sessions & Security</CardTitle>
                    <CardDescription className="text-xs">
                      These are the devices and browsers that are currently logged into your account.
                    </CardDescription>
                  </div>
                  {sessionsData && sessionsData.sessions.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRevokeAllSessions}
                      disabled={isDeletingAllSessions}
                      className="text-xs border-destructive/20 hover:border-destructive hover:bg-destructive/10 text-destructive font-medium rounded-xl h-8.5 px-3 cursor-pointer"
                    >
                      {isDeletingAllSessions ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin mr-1.5" />
                          Revoking...
                        </>
                      ) : (
                        "Revoke Other Devices"
                      )}
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-2">
                  {isSessionsLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Loader2 className="size-6 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">Loading active sessions...</p>
                    </div>
                  ) : !sessionsData || sessionsData.sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                      <AlertCircle className="size-8 text-muted-foreground/60" />
                      <p className="text-sm font-semibold text-foreground">No Active Sessions</p>
                      <p className="text-xs text-muted-foreground">No active sessions were found for this account.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {sessionsData.sessions.map((session: ISession) => {
                        const isCurrent = session.is_current;
                        
                        // Parse browser / OS from user agent simply
                        const ua = session.user_agent.toLowerCase();
                        let deviceName = "Unknown Device";
                        let osName = "Unknown OS";
                        
                        if (ua.includes("macintosh") || ua.includes("mac os")) osName = "macOS";
                        else if (ua.includes("windows")) osName = "Windows";
                        else if (ua.includes("linux")) osName = "Linux";
                        else if (ua.includes("iphone") || ua.includes("ipad")) osName = "iOS";
                        else if (ua.includes("android")) osName = "Android";

                        if (ua.includes("chrome")) deviceName = "Google Chrome";
                        else if (ua.includes("firefox")) deviceName = "Mozilla Firefox";
                        else if (ua.includes("safari") && !ua.includes("chrome")) deviceName = "Apple Safari";
                        else if (ua.includes("edge")) deviceName = "Microsoft Edge";
                        else if (ua.includes("opera")) deviceName = "Opera Browser";

                        const displayTitle = `${deviceName} (${osName})`;

                        return (
                          <div
                            key={session.id}
                            className={cn(
                              "flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-2xl transition-all duration-300 gap-4",
                              isCurrent
                                ? "bg-primary/[0.02] border-primary/20 hover:border-primary/30"
                                : "bg-black/[0.01] dark:bg-white/[0.01] border-border/60 hover:border-border"
                            )}
                          >
                            <div className="flex items-start gap-3.5">
                              <div
                                className={cn(
                                  "size-10 rounded-xl flex items-center justify-center shrink-0 border",
                                  isCurrent
                                    ? "bg-primary/10 text-primary border-primary/10"
                                    : "bg-muted text-muted-foreground border-border/50"
                                )}
                              >
                                <Laptop className="size-5" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-bold text-sm tracking-tight text-foreground">
                                    {displayTitle}
                                  </h4>
                                  {isCurrent && (
                                    <Badge
                                      variant="outline"
                                      className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold rounded-md py-0.5 px-2 uppercase tracking-wider"
                                    >
                                      This Device
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Globe className="size-3 text-muted-foreground/60" />
                                    IP: {session.ip_address || "Unknown"}
                                  </span>
                                  <span className="hidden sm:inline text-muted-foreground/30">•</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="size-3 text-muted-foreground/60" />
                                    Logged in: {new Date(session.created_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-end sm:justify-end gap-3 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeSession(session.id)}
                                disabled={isDeletingSession}
                                className={cn(
                                  "h-9 rounded-xl px-3 text-xs font-semibold cursor-pointer border border-transparent transition-all",
                                  isCurrent
                                    ? "text-destructive hover:bg-destructive/10 hover:border-destructive/15"
                                    : "text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/15"
                                )}
                              >
                                {isDeletingSession ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : isCurrent ? (
                                  "Revoke & Logout"
                                ) : (
                                  "Revoke Device"
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* CONNECT EXCHANGE DIALOG */}
      <Dialog
        open={connectOpen}
        onOpenChange={(open) => {
          setConnectOpen(open);
          if (!open) resetConnectForm();
        }}
      >
        <DialogContent className="max-w-md p-6 bg-card border border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Connect Exchange</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Your API key and secret are encrypted before they&apos;re stored — they&apos;re never shown again in plain text.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground/80">Exchange</Label>
              <Select value={connectExchange} onValueChange={(v) => setConnectExchange(v as ExchangeValue)}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXCHANGES.map((ex) => (
                    <SelectItem key={ex.value} value={ex.value}>
                      {ex.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dialog-account-label" className="text-xs font-bold text-foreground/80">Account Label</Label>
              <Input
                id="dialog-account-label"
                autoFocus
                value={connectLabel}
                onChange={(e) => setConnectLabel(e.target.value)}
                placeholder="e.g. Main Trading Account"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dialog-api-key" className="text-xs font-bold text-foreground/80">API Key</Label>
                <Input
                  id="dialog-api-key"
                  value={connectKey}
                  onChange={(e) => setConnectKey(e.target.value)}
                  placeholder="Enter API Key"
                  className="h-10 rounded-xl font-mono text-xs"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dialog-api-secret" className="text-xs font-bold text-foreground/80">API Secret</Label>
                <Input
                  id="dialog-api-secret"
                  type="password"
                  value={connectSecret}
                  onChange={(e) => setConnectSecret(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="h-10 rounded-xl font-mono text-xs"
                  autoComplete="off"
                  onKeyDown={(e) => e.key === "Enter" && canSubmitConnect && handleConnectExchange()}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dialog-passphrase" className="text-xs font-bold text-foreground/80">
                Passphrase <span className="text-muted-foreground font-normal">(optional, OKX only)</span>
              </Label>
              <Input
                id="dialog-passphrase"
                type="password"
                value={connectPassphrase}
                onChange={(e) => setConnectPassphrase(e.target.value)}
                className="h-10 rounded-xl font-mono text-xs"
                autoComplete="off"
              />
            </div>

            <div className="flex items-center justify-between bg-muted/40 border border-border/60 rounded-xl px-3 py-2.5">
              <div>
                <div className="text-xs font-semibold">Testnet / Sandbox</div>
                <div className="text-[10px] text-muted-foreground">Turn off to connect a live account.</div>
              </div>
              <Switch checked={connectTestnet} onCheckedChange={setConnectTestnet} />
            </div>

            {(() => {
              const note = verifyNote(verifyState, verifyMessage);
              if (!note) return null;
              const toneClasses = {
                muted: "bg-muted/40 border-border/60 text-muted-foreground",
                success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
                warning: "bg-amber-500/10 border-amber-500/20 text-amber-500",
                danger: "bg-destructive/10 border-destructive/20 text-destructive",
              }[note.tone];
              const Icon = { muted: Loader2, success: CheckCircle2, warning: AlertCircle, danger: XCircle }[note.tone];
              return (
                <div className={cn("flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[11px] leading-relaxed", toneClasses)}>
                  <Icon className={cn("size-3.5 shrink-0 mt-0.5", note.tone === "muted" && "animate-spin")} />
                  <span>{note.text}</span>
                </div>
              );
            })()}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConnectOpen(false)} className="text-xs font-semibold rounded-xl cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={handleConnectExchange}
              disabled={!canSubmitConnect || verifyState === "verifying"}
              className="text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 rounded-xl cursor-pointer gap-1.5"
            >
              {isSavingCredential || verifyState === "verifying" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Connecting...
                </>
              ) : (
                <>
                  <ShieldCheck className="size-3.5" /> Verify &amp; Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ROTATE KEYS DIALOG */}
      <Dialog open={!!rotateTarget} onOpenChange={(open) => !open && setRotateTarget(null)}>
        <DialogContent className="max-w-md p-6 bg-card border border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Rotate Keys</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter new API credentials for &ldquo;{rotateTarget?.account_label}&rdquo;. The current key is never shown for security.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="rotate-key" className="text-xs font-bold text-foreground/80">New API Key</Label>
              <Input
                id="rotate-key"
                autoFocus
                value={rotateKey}
                onChange={(e) => setRotateKey(e.target.value)}
                className="h-10 rounded-xl font-mono text-xs"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rotate-secret" className="text-xs font-bold text-foreground/80">New API Secret</Label>
              <Input
                id="rotate-secret"
                type="password"
                value={rotateSecret}
                onChange={(e) => setRotateSecret(e.target.value)}
                className="h-10 rounded-xl font-mono text-xs"
                autoComplete="off"
                onKeyDown={(e) => e.key === "Enter" && rotateKey && rotateSecret && handleRotateExchange()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rotate-passphrase" className="text-xs font-bold text-foreground/80">
                Passphrase <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="rotate-passphrase"
                type="password"
                value={rotatePassphrase}
                onChange={(e) => setRotatePassphrase(e.target.value)}
                className="h-10 rounded-xl font-mono text-xs"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRotateTarget(null)} className="text-xs font-semibold rounded-xl cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={handleRotateExchange}
              disabled={!rotateKey.trim() || !rotateSecret.trim() || isRotatingCredential}
              className="text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 rounded-xl cursor-pointer gap-1.5"
            >
              {isRotatingCredential ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Rotating...
                </>
              ) : (
                <>
                  <RefreshCw className="size-3.5" /> Rotate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DISCONNECT EXCHANGE CONFIRMATION */}
      <AlertDialog open={!!deleteExchangeTarget} onOpenChange={(open) => !open && setDeleteExchangeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect this exchange?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &ldquo;{deleteExchangeTarget?.account_label}&rdquo; from your connected exchanges. Any strategies
              currently live-trading through it will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnectExchange} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
