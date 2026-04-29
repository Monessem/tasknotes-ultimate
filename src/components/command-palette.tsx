"use client"

import { useEffect, useState, useCallback } from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  LayoutDashboard,
  CheckSquare,
  StickyNote,
  Target,
  Star,
  CalendarDays,
  Flag,
  History,
  FolderOpen,
  Trash2,
  Settings,
  Trophy,
  Plus,
  Keyboard,
  Moon,
  Sun,
} from "lucide-react"
import { useAppStore, type ViewType } from "@/store/app-store"
import { t } from "@/lib/i18n"
import type { LucideIcon } from "lucide-react"
import { useTheme } from "next-themes"

const navItems: { id: ViewType; labelKey: string; icon: LucideIcon; group: string }[] = [
  { id: "dashboard", labelKey: "dashboard", icon: LayoutDashboard, group: "navigation" },
  { id: "todos", labelKey: "todos", icon: CheckSquare, group: "navigation" },
  { id: "notes", labelKey: "notes", icon: StickyNote, group: "navigation" },
  { id: "habits", labelKey: "habits", icon: Target, group: "navigation" },
  { id: "important", labelKey: "important", icon: Star, group: "filters" },
  { id: "today", labelKey: "today", icon: CalendarDays, group: "filters" },
  { id: "flagged", labelKey: "flagged", icon: Flag, group: "filters" },
  { id: "history", labelKey: "history", icon: History, group: "filters" },
  { id: "folders", labelKey: "folders", icon: FolderOpen, group: "other" },
  { id: "achievements", labelKey: "achievementsView", icon: Trophy, group: "other" },
  { id: "recycle", labelKey: "recycle", icon: Trash2, group: "other" },
  { id: "settings", labelKey: "settings", icon: Settings, group: "other" },
]

const actionItems: { id: string; labelKey: string; icon: LucideIcon; action: string; shortcut?: string }[] = [
  { id: "addTodo", labelKey: "newTask", icon: Plus, action: "addTodo", shortcut: "T" },
  { id: "addNote", labelKey: "newNote", icon: Plus, action: "addNote", shortcut: "N" },
  { id: "addHabit", labelKey: "newHabit", icon: Plus, action: "addHabit", shortcut: "H" },
]

const shortcutItems: { label: string; shortcut: string; icon: LucideIcon }[] = [
  { label: "Toggle Theme", shortcut: "⇧⌘D", icon: Moon },
  { label: "Command Palette", shortcut: "⌘K", icon: Keyboard },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const { setCurrentView, setActiveModal, settings } = useAppStore()
  const lang = settings.language
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      // Quick shortcuts when not in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === "t" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
        setActiveModal("addTodo")
      }
      if (e.key === "n" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
        setActiveModal("addNote")
      }
      if (e.key === "d" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
        setTheme(theme === "dark" ? "light" : "dark")
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [setActiveModal, setTheme, theme])

  const runAction = useCallback(
    (action: string) => {
      setOpen(false)
      if (action.startsWith("nav:")) {
        setCurrentView(action.replace("nav:", "") as ViewType)
      } else if (action.startsWith("modal:")) {
        setActiveModal(action.replace("modal:", "") as "addTodo" | "addNote" | "addHabit")
      } else if (action === "toggleTheme") {
        setTheme(theme === "dark" ? "light" : "dark")
      }
    },
    [setCurrentView, setActiveModal, setTheme, theme]
  )

  const groupLabels: Record<string, string> = {
    navigation: lang === "ar" ? "التنقل" : "Navigation",
    filters: lang === "ar" ? "الفلاتر" : "Filters",
    other: lang === "ar" ? "أخرى" : "Other",
    actions: lang === "ar" ? "إجراءات سريعة" : "Quick Actions",
    shortcuts: lang === "ar" ? "اختصارات لوحة المفاتيح" : "Keyboard Shortcuts",
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={lang === "ar" ? "ابحث عن أمر أو صفحة..." : "Search for a command or page..."} />
      <CommandList>
        <CommandEmpty>{lang === "ar" ? "لا توجد نتائج" : "No results found"}</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading={groupLabels.actions}>
          {actionItems.map((item) => (
            <CommandItem key={item.id} onSelect={() => runAction(`modal:${item.action}`)}>
              <item.icon className="mr-2 size-4" />
              <span>{t(item.labelKey, lang)}</span>
              {item.shortcut && (
                <span className="ml-auto text-[10px] font-medium text-muted-foreground">
                  ⇧⌘{item.shortcut}
                </span>
              )}
            </CommandItem>
          ))}
          {/* Toggle theme action */}
          <CommandItem onSelect={() => runAction("toggleTheme")}>
            {theme === "dark" ? (
              <Sun className="mr-2 size-4" />
            ) : (
              <Moon className="mr-2 size-4" />
            )}
            <span>{lang === "ar" ? "تبديل المظهر" : "Toggle Theme"}</span>
            <span className="ml-auto text-[10px] font-medium text-muted-foreground">⇧⌘D</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        {["navigation", "filters", "other"].map((group) => (
          <CommandGroup key={group} heading={groupLabels[group]}>
            {navItems
              .filter((item) => item.group === group)
              .map((item) => (
                <CommandItem key={item.id} onSelect={() => runAction(`nav:${item.id}`)}>
                  <item.icon className="mr-2 size-4" />
                  <span>{t(item.labelKey, lang)}</span>
                </CommandItem>
              ))}
          </CommandGroup>
        ))}

        <CommandSeparator />

        {/* Keyboard Shortcuts */}
        <CommandGroup heading={groupLabels.shortcuts}>
          {shortcutItems.map((item) => (
            <CommandItem key={item.shortcut} onSelect={() => {}} disabled>
              <item.icon className="mr-2 size-4 text-muted-foreground" />
              <span className="text-muted-foreground">{item.label}</span>
              <kbd className="ml-auto rounded border border-border/50 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {item.shortcut}
              </kbd>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
