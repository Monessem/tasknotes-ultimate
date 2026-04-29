// Design Token System
// Maps semantic names to concrete Tailwind class strings
// This makes color themes swappable without touching component code

export interface ColorTokens {
  // Primary actions & accents
  primary: string
  primaryHover: string
  primaryGradient: string
  primaryShadow: string
  primaryText: string
  primaryBg: string

  // Success / completion
  success: string
  successText: string
  successBg: string
  successGradient: string

  // Warning
  warning: string
  warningText: string
  warningBg: string
  warningGradient: string

  // Danger / destructive
  danger: string
  dangerText: string
  dangerBg: string
  dangerGradient: string

  // Info
  info: string
  infoText: string
  infoBg: string
  infoGradient: string

  // Neutral accents
  accent: string
  accentText: string
  accentBg: string

  // Priority colors
  priorityHigh: string
  priorityMedium: string
  priorityLow: string
  priorityHighDot: string
  priorityMediumDot: string
  priorityLowDot: string

  // Badge variants
  badgePrimary: string
  badgePrimaryText: string

  // Icon backgrounds
  iconBgAmber: string
  iconBgRose: string
  iconBgEmerald: string
  iconBgCyan: string
  iconBgViolet: string

  // Chart colors
  chartPrimary: string
  chartSecondary: string
  chartTertiary: string
}

// Emerald/Teal theme (current default)
export const emeraldTheme: ColorTokens = {
  primary: "from-emerald-500 to-teal-600",
  primaryHover: "hover:from-emerald-600 hover:to-teal-700",
  primaryGradient: "bg-gradient-to-r from-emerald-500 to-teal-600",
  primaryShadow: "shadow-emerald-500/25",
  primaryText: "text-emerald-600 dark:text-emerald-400",
  primaryBg: "bg-emerald-100 dark:bg-emerald-900/40",

  success: "from-emerald-500 to-teal-600",
  successText: "text-emerald-600 dark:text-emerald-400",
  successBg: "bg-emerald-100 dark:bg-emerald-900/30",
  successGradient: "bg-gradient-to-r from-emerald-500 to-teal-600",

  warning: "from-amber-500 to-orange-500",
  warningText: "text-amber-600 dark:text-amber-400",
  warningBg: "bg-amber-100 dark:bg-amber-900/40",
  warningGradient: "bg-gradient-to-r from-amber-500 to-orange-500",

  danger: "from-rose-500 to-pink-500",
  dangerText: "text-rose-600 dark:text-rose-400",
  dangerBg: "bg-rose-100 dark:bg-rose-900/40",
  dangerGradient: "bg-gradient-to-r from-rose-500 to-pink-500",

  info: "from-cyan-500 to-teal-500",
  infoText: "text-cyan-600 dark:text-cyan-400",
  infoBg: "bg-cyan-100 dark:bg-cyan-900/40",
  infoGradient: "bg-gradient-to-r from-cyan-500 to-teal-500",

  accent: "from-teal-500 to-emerald-600",
  accentText: "text-teal-600 dark:text-teal-400",
  accentBg: "bg-teal-100 dark:bg-teal-900/40",

  priorityHigh: "text-rose-400",
  priorityMedium: "text-amber-400",
  priorityLow: "text-emerald-400",
  priorityHighDot: "bg-rose-500",
  priorityMediumDot: "bg-amber-500",
  priorityLowDot: "bg-emerald-500",

  badgePrimary: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  badgePrimaryText: "text-emerald-700 dark:text-emerald-400",

  iconBgAmber: "from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40",
  iconBgRose: "from-rose-100 to-pink-100 dark:from-rose-900/40 dark:to-pink-900/40",
  iconBgEmerald: "from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40",
  iconBgCyan: "from-cyan-100 to-teal-100 dark:from-cyan-900/40 dark:to-teal-900/40",
  iconBgViolet: "from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40",

  chartPrimary: "#10b981",
  chartSecondary: "#14b8a6",
  chartTertiary: "#f59e0b",
}

// Active theme reference
let activeTheme: ColorTokens = emeraldTheme

export function getTokens(): ColorTokens {
  return activeTheme
}

export function setTheme(theme: ColorTokens) {
  activeTheme = theme
}

// Re-export the default for direct imports
export const tokens = emeraldTheme
