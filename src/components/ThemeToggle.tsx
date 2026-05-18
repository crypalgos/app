"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by waiting for mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
      {mounted && resolvedTheme === "dark" ? (
        <Moon className="h-[1.2rem] w-[1.2rem] text-foreground transition-all" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] text-foreground transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
