"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-[#0a0a0a] group-[.toaster]:text-cyan-50 group-[.toaster]:border-cyan-500/50 group-[.toaster]:shadow-[0_0_15px_rgba(6,182,212,0.2)] font-mono",
          description: "group-[.toast]:text-cyan-500/70",
          actionButton: "group-[.toast]:bg-fuchsia-600 group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-cyan-950/50 group-[.toast]:text-cyan-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
