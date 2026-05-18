"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useUser, useUpdateUser } from "@/api-actions/hooks/user-hooks";
import { useSessions, useDeleteSession, useDeleteAllSessions } from "@/api-actions/hooks/session-hooks";
import { useRouter } from "next/navigation";
import { 
  User, 
  Settings, 
  Key, 
  Mail, 
  Phone, 
  Globe, 
  Calendar, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Plus, 
  Loader2, 
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Laptop,
  CheckCircle2,
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Define simulated Exchange type
interface Exchange {
  id: string;
  name: string;
  logo: string;
  connected: boolean;
  apiKey: string;
  secret: string;
  color: string;
}

// Define simulated Platform API Key type
interface PlatformKey {
  id: string;
  name: string;
  key: string;
  scope: "Read Only" | "Read & Trade";
  created: string;
  visible: boolean;
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

  // Stateful interactive API / Exchange integrations with color themes
  const [exchanges, setExchanges] = React.useState<Exchange[]>([
    { id: "binance", name: "Binance Exchange", logo: "BNB", connected: true, apiKey: "binance_api_key_8da194f27da9", secret: "••••••••••••••••••••••••••••", color: "from-amber-500/10 to-yellow-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20" },
    { id: "alpaca", name: "Alpaca Trading", logo: "ALP", connected: true, apiKey: "alpaca_api_key_cf381daeff83", secret: "••••••••••••••••••••••••••••", color: "from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
    { id: "bybit", name: "Bybit", logo: "BYB", connected: false, apiKey: "", secret: "", color: "from-purple-500/10 to-indigo-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20" },
    { id: "coinbase", name: "Coinbase Advanced", logo: "COIN", connected: false, apiKey: "", secret: "", color: "from-blue-500/10 to-sky-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  ]);

  // Stateful Platform API Keys
  const [platformKeys, setPlatformKeys] = React.useState<PlatformKey[]>([
    { id: "key_1", name: "Platform Dashboard Bot", key: "ca_pk_live_d813f8ae702110c4", scope: "Read & Trade", created: "2026-05-10", visible: false },
    { id: "key_2", name: "Local Python Script", key: "ca_pk_live_38bf8cda0281ef55", scope: "Read Only", created: "2026-05-14", visible: false },
  ]);

  // Modals / Input states
  const [selectedExchange, setSelectedExchange] = React.useState<Exchange | null>(null);
  const [inputApiKey, setInputApiKey] = React.useState("");
  const [inputApiSecret, setInputApiSecret] = React.useState("");
  
  // Platform Key Generation State
  const [newKeyName, setNewKeyName] = React.useState("");
  const [newKeyScope, setNewKeyScope] = React.useState<"Read Only" | "Read & Trade">("Read & Trade");
  const [isGeneratingKey, setIsGeneratingKey] = React.useState(false);
  const [generatedKeyValue, setGeneratedKeyValue] = React.useState<string | null>(null);

  // Sync tab state from URL parameters safely
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["profile", "exchanges", "keys", "preferences", "sessions"].includes(tab)) {
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
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading profile settings...</p>
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

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

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

  // Connect Exchange Flow
  const handleConnectExchange = () => {
    if (!selectedExchange || !inputApiKey || !inputApiSecret) {
      toast.error("Please enter both API Key and API Secret.");
      return;
    }

    setExchanges(prev => prev.map(ex => {
      if (ex.id === selectedExchange.id) {
        return {
          ...ex,
          connected: true,
          apiKey: inputApiKey,
          secret: "••••••••••••••••"
        };
      }
      return ex;
    }));

    toast.success(`${selectedExchange.name} connected successfully!`);
    setSelectedExchange(null);
    setInputApiKey("");
    setInputApiSecret("");
  };

  // Disconnect Exchange Flow
  const handleDisconnectExchange = (exId: string) => {
    setExchanges(prev => prev.map(ex => {
      if (ex.id === exId) {
        return { ...ex, connected: false, apiKey: "", secret: "" };
      }
      return ex;
    }));
    toast.success("Exchange disconnected successfully.");
  };

  // Generate Platform API Key
  const handleGeneratePlatformKey = () => {
    if (!newKeyName.trim()) {
      toast.error("Please provide a label for the API Key.");
      return;
    }

    setIsGeneratingKey(true);
    setTimeout(() => {
      const generatedPart = Math.random().toString(16).substring(2, 18);
      const newKeyString = `ca_pk_live_${generatedPart}`;
      
      const newKey: PlatformKey = {
        id: `key_${Date.now()}`,
        name: newKeyName,
        key: newKeyString,
        scope: newKeyScope,
        created: new Date().toISOString().split('T')[0],
        visible: false
      };

      setPlatformKeys(prev => [newKey, ...prev]);
      setGeneratedKeyValue(newKeyString);
      setNewKeyName("");
      setIsGeneratingKey(false);
      toast.success("New API key generated!");
    }, 800);
  };

  // Revoke Platform Key
  const handleRevokePlatformKey = (keyId: string) => {
    setPlatformKeys(prev => prev.filter(k => k.id !== keyId));
    toast.success("API Key revoked successfully.");
  };

  // Toggle visible Platform Key
  const handleToggleKeyVisibility = (keyId: string) => {
    setPlatformKeys(prev => prev.map(k => {
      if (k.id === keyId) {
        return { ...k, visible: !k.visible };
      }
      return k;
    }));
  };

  // Copy helper
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
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
                  <AvatarImage src={avatarUrl} alt={name} />
                  <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-lg">
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
              <TabsTrigger value="keys" className="flex items-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-none cursor-pointer">
                <Key className="size-3.5" />
                Platform API Keys
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-none cursor-pointer">
                <Settings className="size-3.5" />
                Preferences
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
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Exchange Integrations</CardTitle>
                  <CardDescription className="text-xs">Establish execution endpoints by integrating your API keys of exchange partners.</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exchanges.map((ex) => (
                    <div 
                      key={ex.id}
                      className={cn(
                        "border rounded-2xl p-4 bg-gradient-to-br flex flex-col justify-between gap-4 transition-all hover:shadow-xs group/item relative overflow-hidden",
                        ex.color
                      )}
                    >
                      <div className="flex justify-between items-start z-10">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-background border border-border/60 flex items-center justify-center font-black text-xs text-foreground shadow-xs group-hover/item:scale-105 transition-transform duration-300">
                            {ex.logo}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm tracking-tight text-foreground">{ex.name}</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Algorithm Execution Target</p>
                          </div>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-[9px] font-bold py-0.5 px-2 tracking-wide uppercase border",
                            ex.connected 
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                              : "bg-muted text-muted-foreground border-border/40"
                          )}
                        >
                          {ex.connected ? "Connected" : "Inactive"}
                        </Badge>
                      </div>

                      {ex.connected ? (
                        <div className="space-y-1 mt-1 z-10">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Active API Key</p>
                          <div className="flex items-center justify-between bg-background/80 border border-border/45 backdrop-blur-xs p-2 rounded-xl text-xs font-mono">
                            <span className="truncate max-w-[160px] text-foreground/80">{ex.apiKey}</span>
                            <span className="text-[10px] text-muted-foreground font-semibold">Active</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1 z-10">
                          Connect your programmatic account to enable real-time order generation.
                        </p>
                      )}

                      <div className="flex gap-2 w-full mt-2 z-10">
                        {ex.connected ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedExchange(ex);
                                setInputApiKey(ex.apiKey);
                              }}
                              className="text-xs font-semibold rounded-xl bg-background flex-1 cursor-pointer"
                            >
                              Configure
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDisconnectExchange(ex.id)}
                              className="text-xs font-semibold border-destructive/20 hover:border-destructive/30 hover:bg-destructive/10 text-destructive bg-background rounded-xl flex-1 cursor-pointer"
                            >
                              Disconnect
                            </Button>
                          </>
                        ) : (
                          <Button 
                            onClick={() => setSelectedExchange(ex)}
                            className="w-full text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 rounded-xl cursor-pointer"
                          >
                            Link Exchange Account
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB CONTENT: PLATFORM API KEYS */}
            <TabsContent value="keys" className="animate-in fade-in duration-300">
              <div className="flex flex-col gap-6">
                
                {/* Generated Key Modal Helper Box */}
                {generatedKeyValue ? (
                  <Card className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-5 shadow-xs animate-in zoom-in-95 duration-300">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">Private Platform Key Generated</h4>
                        <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
                          Please copy this API key now. For absolute safety, it will not be displayed again once you reload or navigate away.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 bg-background border border-emerald-500/15 p-3 rounded-xl">
                      <code className="text-xs font-mono text-foreground font-semibold break-all flex-1 select-all">{generatedKeyValue}</code>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleCopyToClipboard(generatedKeyValue)} 
                        className="size-8 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button size="sm" onClick={() => setGeneratedKeyValue(null)} className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer">
                        Dismiss Key Warning
                      </Button>
                    </div>
                  </Card>
                ) : null}

                <Card className="border border-border/80 bg-card rounded-2xl shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Generate Platform Access Keys</CardTitle>
                    <CardDescription className="text-xs">Create custom access tokens to securely trigger strategies and request endpoints from outer scripts.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-5">
                    
                    <div className="p-4 border border-border/60 bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl space-y-4">
                      <h4 className="font-bold text-sm text-foreground">Create New Key</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="key-name" className="text-xs font-bold text-foreground/80">API Key Label</Label>
                          <Input 
                            id="key-name"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            placeholder="E.g., Python Trader Bot"
                            className="h-10 rounded-xl border-border/50 bg-background focus-visible:ring-2 focus-visible:ring-primary/20"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="key-scope" className="text-xs font-bold text-foreground/80">Access Scope</Label>
                          <select 
                            id="key-scope"
                            value={newKeyScope}
                            onChange={(e) => setNewKeyScope(e.target.value as any)}
                            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="Read & Trade">Read & Trade (Execute orders)</option>
                            <option value="Read Only">Read Only (Analytics only)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button 
                          onClick={handleGeneratePlatformKey}
                          disabled={isGeneratingKey}
                          className="h-10 px-5 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {isGeneratingKey ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Plus className="size-3.5" />
                              Generate Private Token
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h4 className="font-bold text-sm text-foreground">Active Access Tokens</h4>
                      
                      {platformKeys.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-border rounded-2xl">
                          <p className="text-xs text-muted-foreground">No platform API keys created yet. Generate one above.</p>
                        </div>
                      ) : (
                        <div className="border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/60">
                          {platformKeys.map((k) => (
                            <div key={k.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 bg-black/[0.005] dark:bg-white/[0.005] hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm tracking-tight text-foreground">{k.name}</span>
                                  <Badge variant="outline" className="text-[8px] uppercase tracking-wide px-1.5 font-bold py-0 bg-primary/5 text-primary border-primary/10">
                                    {k.scope}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <code className="text-xs font-mono font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                                    {k.visible ? k.key : "••••••••••••••••••••••••••••"}
                                  </code>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    onClick={() => handleToggleKeyVisibility(k.id)} 
                                    className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                                  >
                                    {k.visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    onClick={() => handleCopyToClipboard(k.key)} 
                                    className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                                  >
                                    <Copy className="size-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-6 text-xs shrink-0">
                                <div className="text-right text-muted-foreground">
                                  <p className="text-[10px] font-semibold text-muted-foreground/80 uppercase">Created</p>
                                  <p className="font-medium mt-0.5">{k.created}</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleRevokePlatformKey(k.id)}
                                  className="size-9 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/15 transition-all cursor-pointer"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB CONTENT: PREFERENCES */}
            <TabsContent value="preferences" className="animate-in fade-in duration-300">
              <Card className="border border-border/80 bg-card rounded-2xl shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Preferences & Notifications</CardTitle>
                  <CardDescription className="text-xs">Manage system notification rules and algorithmic trading behavior preferences.</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 space-y-4">
                  <div className="space-y-3.5">
                    
                    <div className="flex items-center justify-between p-3.5 border border-border/60 bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl hover:border-border transition-colors">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-sm tracking-tight text-foreground">Email Notifications</h4>
                        <p className="text-[11px] text-muted-foreground">Send real-time alerts on strategy transitions, backtest completions, and orders.</p>
                      </div>
                      <Switch defaultChecked className="cursor-pointer" />
                    </div>

                    <div className="flex items-center justify-between p-3.5 border border-border/60 bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl hover:border-border transition-colors">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-sm tracking-tight text-foreground">Auto-Slippage Mitigation</h4>
                        <p className="text-[11px] text-muted-foreground">Use AI model estimation to automatically place limit order corrections for slippage.</p>
                      </div>
                      <Switch defaultChecked className="cursor-pointer" />
                    </div>

                    <div className="flex items-center justify-between p-3.5 border border-border/60 bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl hover:border-border transition-colors">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-sm tracking-tight text-foreground">Multi-Device Session Sync</h4>
                        <p className="text-[11px] text-muted-foreground">Keep trading instances globally synced in real-time across multiple tabs/devices.</p>
                      </div>
                      <Switch defaultChecked className="cursor-pointer" />
                    </div>

                    <div className="flex items-center justify-between p-3.5 border border-border/60 bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl hover:border-border transition-colors">
                      <div className="space-y-0.5 flex gap-1.5 items-center">
                        <Laptop className="size-4 text-primary shrink-0" />
                        <div>
                          <h4 className="font-bold text-sm tracking-tight text-foreground">Hardware Acceleration</h4>
                          <p className="text-[11px] text-muted-foreground">Utilize GPU acceleration in the web dashboard for rendering charting metrics.</p>
                        </div>
                      </div>
                      <Switch defaultChecked className="cursor-pointer" />
                    </div>

                  </div>
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

      {/* DIALOG CONNECTOR MODAL FOR EXCHANGES */}
      <Dialog open={selectedExchange !== null} onOpenChange={(open) => !open && setSelectedExchange(null)}>
        <DialogContent className="max-w-md p-6 bg-card border border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Link {selectedExchange?.name} API
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Please enter your programmatic API credentials. Read-Write trading scopes must be enabled in your exchange portal.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="dialog-api-key" className="text-xs font-bold text-foreground/80">API Key / Access Token</Label>
              <Input 
                id="dialog-api-key"
                value={inputApiKey}
                onChange={(e) => setInputApiKey(e.target.value)}
                placeholder="Enter Exchange API Key"
                className="h-10 rounded-xl"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="dialog-api-secret" className="text-xs font-bold text-foreground/80">API Secret Key / Passphrase</Label>
              <Input 
                id="dialog-api-secret"
                type="password"
                value={inputApiSecret}
                onChange={(e) => setInputApiSecret(e.target.value)}
                placeholder="••••••••••••••••••••"
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedExchange(null);
                setInputApiKey("");
                setInputApiSecret("");
              }}
              className="text-xs font-semibold rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConnectExchange}
              className="text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 rounded-xl cursor-pointer"
            >
              Verify & Connect Exchange
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
