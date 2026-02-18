"use client";

import React, { Suspense, useState } from "react";
import { useUser, useUpdateUser } from "@/api-actions/hooks/user-hooks";
import {
  useSessions,
  useDeleteSession,
  useDeleteAllSessions,
} from "@/api-actions/hooks/session-hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Shield,
  User,
  Monitor,
  Smartphone,
  Globe,
  LogOut,
  Trash2,
  Camera,
  Mail,
  Phone,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import ProfileDropdown from "@/components/kokonutui/profile-dropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get("tab") || "general";

  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: sessionData, isLoading: isSessionsLoading } = useSessions();

  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteSession, isPending: isDeletingSession } =
    useDeleteSession();
  const { mutate: deleteAllSessions, isPending: isDeletingAll } =
    useDeleteAllSessions();

  const [formData, setFormData] = React.useState({
    name: "",
    username: "",
    email: "",
    phone: "",
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(formData, {
      onSuccess: () => toast.success("Profile updated successfully"),
      onError: (err: any) =>
        toast.error(err.message || "Failed to update profile"),
    });
  };

  const handleRevokeSession = (sessionId: string) => {
    deleteSession(sessionId, {
      onSuccess: () => toast.success("Session revoked"),
      onError: (err: any) =>
        toast.error(err.message || "Failed to revoke session"),
    });
  };

  const handleRevokeAll = () => {
    deleteAllSessions(undefined, {
      onSuccess: () => toast.success("All other sessions revoked"),
      onError: (err: any) =>
        toast.error(err.message || "Failed to revoke sessions"),
    });
  };

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (
      ua.includes("mobi") ||
      ua.includes("android") ||
      ua.includes("iphone")
    ) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  if (isUserLoading || isSessionsLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { id: "general", label: "General", icon: User },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <main className="flex-1 flex flex-col bg-background overflow-y-auto">
      {/* Header */}
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-2 border-b border-border/50 min-h-[52px] bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="h-5 bg-border/60" />
          <h2 className="text-sm font-medium">Account Settings</h2>
        </div>
        <div className="flex items-center gap-2">
          <ProfileDropdown />
        </div>
      </header>

      {/* Main Content */}
      <div className="container max-w-6xl py-8 px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 shrink-0">
            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-r-lg transition-all duration-200 group overflow-hidden",
                    currentTab === item.id
                      ? "bg-primary/5 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {currentTab === item.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary shadow-[0_0_10px_rgba(var(--color-primary),0.5)]" />
                  )}
                  <item.icon
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      currentTab === item.id
                        ? "scale-110"
                        : "group-hover:scale-110",
                    )}
                  />
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content Area */}
          <div className="flex-1 space-y-6">
            {currentTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    General Information
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your public profile and contact details.
                  </p>
                </div>
                <Separator />

                {/* Avatar Section */}
                <div className="flex items-center gap-6 p-6 border border-white/10 dark:border-white/5 rounded-xl bg-white/50 dark:bg-white/[0.02] shadow-sm backdrop-blur-md">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                      <AvatarImage src="" alt={user.name || ""} />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-lg font-medium">Profile Picture</h4>
                    <p className="text-xs text-muted-foreground max-w-[250px]">
                      Supports JPG, PNG and GIF. Max file size 2MB.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 mt-2 bg-transparent border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                    >
                      Upload New
                    </Button>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile}>
                  <Card className="border-white/10 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-md shadow-sm">
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="name"
                            className="text-[0.7rem] uppercase tracking-wider text-muted-foreground font-semibold"
                          >
                            Full Name
                          </Label>
                          <div className="relative group">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  name: e.target.value,
                                })
                              }
                              className="pl-9 h-10 bg-white/5 dark:bg-black/5 border-black/10 dark:border-white/10 focus-visible:ring-0 focus-visible:border-primary/50 focus-visible:shadow-[0_0_15px_rgba(var(--color-primary),0.1)] transition-all duration-300"
                              placeholder="Enter your name"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="username"
                            className="text-[0.7rem] uppercase tracking-wider text-muted-foreground font-semibold"
                          >
                            Username
                          </Label>
                          <div className="relative">
                            <LayoutGrid className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="username"
                              value={formData.username}
                              disabled
                              className="pl-9 h-10 bg-muted/30 border-black/5 dark:border-white/5 opacity-70"
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Username cannot be changed.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="email"
                            className="text-[0.7rem] uppercase tracking-wider text-muted-foreground font-semibold"
                          >
                            Email Address
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              value={formData.email}
                              disabled
                              className="pl-9 h-10 bg-muted/30 border-black/5 dark:border-white/5 opacity-70"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="phone"
                            className="text-[0.7rem] uppercase tracking-wider text-muted-foreground font-semibold"
                          >
                            Phone Number
                          </Label>
                          <div className="relative group">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  phone: e.target.value,
                                })
                              }
                              className="pl-9 h-10 bg-white/5 dark:bg-black/5 border-black/10 dark:border-white/10 focus-visible:ring-0 focus-visible:border-primary/50 focus-visible:shadow-[0_0_15px_rgba(var(--color-primary),0.1)] transition-all duration-300"
                              placeholder="+1234567890"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end pt-4 border-t mt-4">
                        <Button
                          type="submit"
                          disabled={isUpdating}
                          className="h-10 px-6 shadow-[0_0_15px_rgba(var(--color-primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--color-primary),0.5)] transition-all duration-300"
                        >
                          {isUpdating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Save Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </div>
            )}

            {currentTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Security Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your active sessions and device history.
                  </p>
                </div>
                <Separator />

                <Card className="border-white/10 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-md shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        Active Sessions
                      </CardTitle>
                      <CardDescription>
                        Devices currently logged into your account.
                      </CardDescription>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRevokeAll}
                      disabled={isDeletingAll}
                      className="h-8"
                    >
                      <LogOut className="mr-2 h-3.5 w-3.5" />
                      Revoke All Others
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border-t">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="pl-6">Device</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right pr-6">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessionData?.sessions.map((session) => (
                            <TableRow key={session.id}>
                              <TableCell className="pl-6">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted border border-border/50">
                                    {getDeviceIcon(session.user_agent)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium truncate max-w-[180px]">
                                      {session.user_agent}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Last active:{" "}
                                      {new Date(
                                        session.created_at,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <Globe className="h-3.5 w-3.5" />
                                  {session.ip_address}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20"
                                >
                                  Active
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() =>
                                    handleRevokeSession(session.id)
                                  }
                                  disabled={isDeletingSession}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
