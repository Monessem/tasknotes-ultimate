"use client"

import { useEffect } from "react"
import { useAppStore } from "@/store/app-store"

/**
 * Syncs the colorTheme setting from the Zustand store to the <html> element's
 * data-theme attribute, which triggers CSS variable overrides in globals.css.
 */
export function ColorThemeSync() {
  const colorTheme = useAppStore((s) => s.settings.colorTheme)

  useEffect(() => {
    const html = document.documentElement
    if (colorTheme && colorTheme !== "emerald") {
      html.setAttribute("data-theme", colorTheme)
    } else {
      // Emerald is the default (no data-theme attribute needed)
      html.removeAttribute("data-theme")
    }
  }, [colorTheme])

  return null
}
