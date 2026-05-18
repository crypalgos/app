"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Settings,
  CreditCard,
  FileText,
  LogOut,
  User,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useLogout } from "@/api-actions/hooks/user-hooks";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  label: string;
  value?: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}

interface ProfileDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  showTopbar?: boolean;
}

export default function ProfileDropdown({
  className,
  ...props
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { data: user, isLoading } = useUser();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-2", className)}>
        <Loader2 className="size-5 animate-spin text-muted-foreground/60" />
      </div>
    );
  }

  if (!user) return null;

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

  const menuItems: MenuItem[] = [
    {
      label: "Profile",
      href: "/profile?tab=profile",
      icon: <User className="size-4" />,
    },
    {
      label: "Subscription",
      value: "PRO",
      href: "#",
      icon: <CreditCard className="size-4" />,
    },
    {
      label: "Settings",
      href: "/profile?tab=preferences",
      icon: <Settings className="size-4" />,
    },
    {
      label: "Terms & Policies",
      href: "#",
      icon: <FileText className="size-4" />,
      external: true,
    },
  ];

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        router.push("/login");
      },
    });
  };

  return (
    <div className={cn("relative", className)} {...props}>
      <DropdownMenu onOpenChange={setIsOpen}>
        <div className="group relative">
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 p-1.5 px-2 rounded-2xl bg-transparent hover:bg-accent/40 transition-all duration-200 focus:outline-none cursor-pointer"
            >
              <div className="relative">
                <div className="size-8 rounded-full bg-gradient-to-br from-primary via-primary/80 to-accent p-0.5 shadow-xs">
                  <Avatar className="size-full border border-background">
                    <AvatarImage src={avatarUrl} alt={user.name} />
                    <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-semibold text-foreground tracking-tight leading-tight">
                  {user.name}
                </div>
                <div className="text-xs text-muted-foreground tracking-tight leading-tight truncate max-w-[120px]">
                  {user.email}
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>

          {/* Bending line indicator on the right */}
          <div
            className={cn(
              "absolute -right-2.5 top-1/2 -translate-y-1/2 transition-all duration-200",
              isOpen ? "opacity-100" : "opacity-60 group-hover:opacity-100",
            )}
          >
            <svg
              width="10"
              height="20"
              viewBox="0 0 12 24"
              fill="none"
              className={cn(
                "transition-all duration-200",
                isOpen
                  ? "text-primary scale-110"
                  : "text-muted-foreground/60 group-hover:text-foreground",
              )}
              aria-hidden="true"
            >
              <path
                d="M2 4C6 8 6 16 2 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-64 p-2 bg-popover/95 backdrop-blur-xs border border-border rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 
                    data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-top-right"
          >
            <div className="space-y-1">
              {menuItems.map((item) => (
                <DropdownMenuItem key={item.label} asChild>
                  <Link
                    href={item.href}
                    className="flex items-center p-2.5 hover:bg-accent hover:text-accent-foreground rounded-xl transition-all duration-200 cursor-pointer group hover:shadow-xs border border-transparent hover:border-border/30 focus:bg-accent focus:text-accent-foreground"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {item.icon}
                      <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                        {item.label}
                      </span>
                    </div>
                    {item.value ? (
                      <div className="flex-shrink-0 ml-auto">
                        <Badge 
                          variant="secondary" 
                          className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold tracking-wider rounded-md py-0.5 px-2 uppercase"
                        >
                          {item.value}
                        </Badge>
                      </div>
                    ) : null}
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem asChild>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 p-2.5 duration-200 bg-destructive/10 rounded-xl hover:bg-destructive/20 cursor-pointer border border-transparent hover:border-destructive/30 hover:shadow-xs transition-all group disabled:opacity-50 disabled:cursor-not-allowed focus:bg-transparent"
              >
                <LogOut className="size-4 text-destructive group-hover:text-destructive/80" />
                <span className="text-sm font-medium text-destructive group-hover:text-destructive/80">
                  {isLoggingOut ? "Signing out..." : "Sign Out"}
                </span>
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </div>
      </DropdownMenu>
    </div>
  );
}
