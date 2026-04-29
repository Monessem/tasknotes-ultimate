"use client"

import { useTheme } from "next-themes"
import {
  Menu,
  Search,
  Plus,
  Sun,
  Moon,
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
} from "lucide-react"
import { useAppStore, type ViewType, type ModalType } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const viewIcons: Record<ViewType, React.ElementType> = {
  dashboard: LayoutDashboard,
  todos: CheckSquare,
  notes: StickyNote,
  habits: Target,
  important: Star,
  today: CalendarDays,
  flagged: Flag,
  history: History,
  folders: FolderOpen,
  recycle: Trash2,
  settings: Settings,
}

const viewTitleKeys: Record<ViewType, string> = {
  dashboard: "dashboard",
  todos: "todos",
  notes: "notes",
  habits: "habits",
  important: "important",
  today: "today",
  flagged: "flagged",
  history: "history",
  folders: "folders",
  recycle: "recycle",
  settings: "settings",
}

export function AppHeader() {
  const { currentView, searchQuery, setSearchQuery, setSidebarOpen, setActiveModal } = useAppStore()
  const { theme, setTheme } = useTheme()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language

  const Icon = viewIcons[currentView]
  const title = t(viewTitleKeys[currentView], lang)

  const viewAddModal: Record<ViewType, ModalType> = {
    dashboard: "addTodo",
    todos: "addTodo",
    notes: "addNote",
    habits: "addHabit",
    important: "addTodo",
    today: "addTodo",
    flagged: "addTodo",
    history: null,
    folders: "addFolder",
    recycle: null,
    settings: null,
  }
  const activeAddModal = viewAddModal[currentView]

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/50 bg-card/80 px-4 py-3 backdrop-blur-xl sm:gap-4 sm:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>

      {/* View title with icon */}
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 shadow-sm ring-1 ring-emerald-500/10 transition-transform hover:scale-105 dark:from-emerald-900/40 dark:to-teal-900/40 dark:ring-emerald-400/10">
          <Icon className="size-4.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden max-w-[280px] flex-1 sm:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t("search", lang)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 rounded-full border-border/50 bg-muted/40 pl-9 pr-4 text-sm shadow-none focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
        />
      </div>

      {/* Add button */}
      {activeAddModal && (
        <Button
          size="sm"
          onClick={() => setActiveModal(activeAddModal)}
          className="hidden gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700 sm:flex"
        >
          <Plus className="size-4" />
          <span>{t("add", lang)}</span>
        </Button>
      )}

      {/* Mobile add button */}
      {activeAddModal && (
        <Button
          size="icon"
          onClick={() => setActiveModal(activeAddModal)}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700 sm:hidden"
        >
          <Plus className="size-4" />
        </Button>
      )}

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="rounded-xl"
        aria-label="Toggle theme"
      >
        <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      </Button>
    </header>
  )
}
