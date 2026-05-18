"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { IconCircleCheck, IconInfoCircle, IconAlertTriangle, IconAlertOctagon, IconLoader } from "@tabler/icons-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme, resolvedTheme } = useTheme()
  const activeTheme = resolvedTheme || theme || "dark"
  const isDark = activeTheme === "dark"

  return (
    <Sonner
      theme={activeTheme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <IconCircleCheck className="size-4 text-emerald-500 shrink-0" />
        ),
        info: (
          <IconInfoCircle className="size-4 text-blue-500 shrink-0" />
        ),
        warning: (
          <IconAlertTriangle className="size-4 text-amber-500 shrink-0" />
        ),
        error: (
          <IconAlertOctagon className="size-4 text-red-500 shrink-0" />
        ),
        loading: (
          <IconLoader className="size-4 animate-spin text-primary shrink-0" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",

          // Premium adaptive richColors for better UI/UX and visual excellence (solid backgrounds prevent dark mode transparency)
          "--success-bg": isDark ? "#061a14" : "rgba(240, 253, 244, 1)",
          "--success-text": isDark ? "#34d399" : "#15803d",
          "--success-border": isDark ? "rgba(16, 185, 129, 0.3)" : "rgba(22, 163, 74, 0.15)",

          "--error-bg": isDark ? "#1f0a0a" : "rgba(254, 242, 242, 1)",
          "--error-text": isDark ? "#f87171" : "#b91c1c",
          "--error-border": isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(220, 38, 38, 0.15)",

          "--warning-bg": isDark ? "#1f1406" : "rgba(255, 251, 235, 1)",
          "--warning-text": isDark ? "#fbbf24" : "#b45309",
          "--warning-border": isDark ? "rgba(245, 158, 11, 0.3)" : "rgba(217, 119, 6, 0.15)",

          "--info-bg": isDark ? "#0a1329" : "rgba(239, 246, 255, 1)",
          "--info-text": isDark ? "#60a5fa" : "#1d4ed8",
          "--info-border": isDark ? "rgba(59, 130, 246, 0.3)" : "rgba(37, 99, 235, 0.15)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast font-sans border shadow-md flex items-center gap-3 p-4 rounded-xl",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
