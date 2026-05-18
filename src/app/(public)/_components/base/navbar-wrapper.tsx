"use client";

import React, { useState, useEffect } from "react";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "./resizable-navbar";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { IconLogin2 } from "@tabler/icons-react";
import { useUser } from "@/api-actions/hooks/user-hooks";
import ProfileDropdown from "@/components/kokonutui/profile-dropdown";
import { LoginDialog } from "@/components/login-dialog";
import { useAuthStore } from "@/store/auth-store";

export function NavbarWrapper() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: user, isLoading } = useUser();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      name: "Features",
      link: "#features",
    },
    {
      name: "Dashboard",
      link: "/dashboard",
    },
    {
      name: "Pricing",
      link: "/pricing",
    },
    {
      name: "Contact",
      link: "/contact",
    },
  ];

  const showAuthMenu = mounted && isAuthenticated && !isLoading;
  const showLoginButton = mounted && (!isAuthenticated || (!isLoading && !user));

  return (
    <Navbar>
      {/* Desktop Navigation */}
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItems} />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {!mounted ? (
            !isAuthenticated && (
              <NavbarButton variant="shimmer" as="button" onClick={() => setIsLoginOpen(true)}>
                Login
                <IconLogin2 size={18} stroke={2} />
              </NavbarButton>
            )
          ) : (
            <>
              {showAuthMenu && user && <ProfileDropdown />}
              {showLoginButton && (
                <NavbarButton variant="shimmer" as="button" onClick={() => setIsLoginOpen(true)}>
                  Login
                  <IconLogin2 size={18} stroke={2} />
                </NavbarButton>
              )}
            </>
          )}
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <div className="flex items-center gap-2">
            <ThemeToggle className="mr-2" />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </div>
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {navItems.map((item, idx) => (
            <a
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={() => setIsMobileMenuOpen(false)}
              className="relative text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="block">{item.name}</span>
            </a>
          ))}
          <div className="flex w-full flex-col gap-4">
            {!mounted ? (
              !isAuthenticated && (
                <NavbarButton
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsLoginOpen(true);
                  }}
                  variant="primary"
                  className="w-full"
                  as="button"
                >
                  Login
                  <IconLogin2 size={18} stroke={2} />
                </NavbarButton>
              )
            ) : (
              <>
                {showAuthMenu && user && (
                  <div className="px-4 py-2 border-t border-border mt-4">
                    <ProfileDropdown className="w-full" />
                  </div>
                )}
                {showLoginButton && (
                  <NavbarButton
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsLoginOpen(true);
                    }}
                    variant="primary"
                    className="w-full"
                    as="button"
                  >
                    Login
                    <IconLogin2 size={18} stroke={2} />
                  </NavbarButton>
                )}
              </>
            )}
          </div>
        </MobileNavMenu>
      </MobileNav>

      {/* Global Login Dialog Trigger */}
      <LoginDialog isOpen={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </Navbar>
  );
}
