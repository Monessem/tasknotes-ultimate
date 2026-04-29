import type { AppSettings } from "@/store/app-store"

// Shared types
export type Lang = AppSettings["language"]
export type UpdateSettingsFn = (updates: Partial<AppSettings>) => void

// Shared CSS class for section cards
export const sectionClass =
  "rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5"

// Shared constants
export const CITIES = [
  { value: "cairo", label: "Cairo" },
  { value: "riyadh", label: "Riyadh" },
  { value: "dubai", label: "Dubai" },
  { value: "jeddah", label: "Jeddah" },
  { value: "doha", label: "Doha" },
  { value: "kuwait", label: "Kuwait" },
  { value: "amman", label: "Amman" },
  { value: "casablanca", label: "Casablanca" },
  { value: "london", label: "London" },
  { value: "newyork", label: "New York" },
  { value: "paris", label: "Paris" },
  { value: "tokyo", label: "Tokyo" },
  { value: "istanbul", label: "Istanbul" },
  { value: "berlin", label: "Berlin" },
  { value: "sydney", label: "Sydney" },
  { value: "toronto", label: "Toronto" },
  { value: "mumbai", label: "Mumbai" },
  { value: "beijing", label: "Beijing" },
  { value: "seoul", label: "Seoul" },
  { value: "singapur", label: "Singapore" },
]

export const COLOR_THEMES = [
  { value: "emerald", label: "Emerald", from: "#10b981", to: "#0d9488", shadow: "rgba(16,185,129,0.3)" },
  { value: "ocean", label: "Ocean", from: "#3b82f6", to: "#0891b2", shadow: "rgba(59,130,246,0.3)" },
  { value: "sunset", label: "Sunset", from: "#f97316", to: "#e11d48", shadow: "rgba(249,115,22,0.3)" },
]

export const SHORTCUTS = [
  { keys: ["⌘", "K"], descKey: "openCommandPalette" },
  { keys: ["⌘", "N"], descKey: "addNewTask" },
  { keys: ["⇧", "⌘", "N"], descKey: "addNewNote" },
  { keys: ["⇧", "⌘", "H"], descKey: "addNewHabit" },
  { keys: ["⌘", "D"], descKey: "toggleDarkMode" },
  { keys: ["?"], descKey: "showShortcuts" },
  { keys: ["Esc"], descKey: "closeDialog" },
]

export const TECH_BADGES = [
  { name: "Next.js 16", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { name: "TypeScript", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { name: "Prisma", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
  { name: "Tailwind CSS", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
  { name: "Zustand", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { name: "shadcn/ui", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
]

// Shared utility functions
export function getInitials(name: string) {
  if (!name) return "U"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function formatDate(date: Date, lang: Lang) {
  return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
