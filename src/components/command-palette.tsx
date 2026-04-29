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
} from "lucide-react"
import { useAppStore, type ViewType } from "@/store/app-store"
import { t } from "@/lib/i18n"
import type { LucideIcon } from "lucide-react"

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

const actionItems: { id: string; labelKey: string; icon: LucideIcon; action: string }[] = [
  { id: "addTodo", labelKey: "newTask", icon: Plus, action: "addTodo" },
  { id: "addNote", labelKey: "newNote", icon: Plus, action: "addNote" },
  { id: "addHabit", labelKey: "newHabit", icon: Plus, action: "addHabit" },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const { setCurrentView, setActiveModal, settings } = useAppStore()
  const lang = settings.language

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runAction = useCallback(
    (action: string) => {
      setOpen(false)
      if (action.startsWith("nav:")) {
        setCurrentView(action.replace("nav:", "") as ViewType)
      } else if (action.startsWith("modal:")) {
        setActiveModal(action.replace("modal:", "") as "addTodo" | "addNote" | "addHabit")
      }
    },
    [setCurrentView, setActiveModal]
  )

  const groupLabels: Record<string, string> = {
    navigation: lang === "ar" ? "التنقل" : "Navigation",
    filters: lang === "ar" ? "الفلاتر" : "Filters",
    other: lang === "ar" ? "أخرى" : "Other",
    actions: lang === "ar" ? "إجراءات سريعة" : "Quick Actions",
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
            </CommandItem>
          ))}
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
      </CommandList>
    </CommandDialog>
  )
}
