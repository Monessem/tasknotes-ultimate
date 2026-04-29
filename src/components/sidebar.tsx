"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
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
  Sun,
  Cloud,
  CloudRain,
  CloudFog,
  CloudLightning,
  CloudDrizzle,
  Snowflake,
  CloudSun,
  Flame,
  CheckCircle2,
  Timer,
  ClipboardList,
  Trophy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore, type ViewType } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface NavItem {
  id: ViewType
  labelKey: string
  icon: React.ElementType
  count?: number
}

interface NavSection {
  titleKey: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    titleKey: "navMain",
    items: [
      { id: "dashboard", labelKey: "dashboard", icon: LayoutDashboard },
      { id: "todos", labelKey: "todos", icon: CheckSquare },
      { id: "notes", labelKey: "notes", icon: StickyNote },
      { id: "habits", labelKey: "habits", icon: Target },
    ],
  },
  {
    titleKey: "navFilters",
    items: [
      { id: "important", labelKey: "important", icon: Star },
      { id: "today", labelKey: "today", icon: CalendarDays },
      { id: "flagged", labelKey: "flagged", icon: Flag },
      { id: "history", labelKey: "history", icon: History },
    ],
  },
  {
    titleKey: "navOther",
    items: [
      { id: "folders", labelKey: "folders", icon: FolderOpen },
      { id: "achievements", labelKey: "achievements", icon: Trophy },
      { id: "recycle", labelKey: "recycle", icon: Trash2 },
      { id: "settings", labelKey: "settings", icon: Settings },
    ],
  },
]

const weatherIconMap: Record<string, React.ElementType> = {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudFog,
  CloudLightning,
  CloudDrizzle,
  Snowflake,
}

interface WeatherData {
  temperature: number
  description: string
  icon: string
  city: string
}

function WeatherWidget() {
  const { settings } = useAppStore()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!settings.weatherEnabled) {
      setLoading(false)
      return
    }

    async function fetchWeather() {
      try {
        const res = await fetch(`/api/weather?city=${settings.weatherCity}`)
        if (res.ok) {
          const data = await res.json()
          setWeather(data)
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [settings.weatherEnabled, settings.weatherCity])

  if (!settings.weatherEnabled) return null

  return (
    <div className="mx-3 mb-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3 dark:border-emerald-400/15 dark:bg-emerald-400/5">
      {loading ? (
        <div className="flex items-center gap-3">
          <div className="size-8 animate-pulse rounded-lg bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-2 w-12 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ) : weather ? (
        <div className="flex items-center gap-3">
          {(() => {
            const IconComp = weatherIconMap[weather.icon] || Sun
            return (
              <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-400/20 dark:from-amber-400/15 dark:to-orange-400/15">
                <IconComp className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
            )
          })()}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-foreground">
                {weather.temperature}
              </span>
              <span className="text-xs text-muted-foreground">°C</span>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {weather.description} · {weather.city}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { currentView, setCurrentView, todos, habits, habitLogs, pomodoroSessions, settings } = useAppStore()
  const lang = settings.language

  // Calculate counts
  const activeTodos = todos.filter((t) => !t.completed && !t.deletedAt)
  const importantCount = activeTodos.filter((t) => t.important).length
  const todayStr = new Date().toISOString().split("T")[0]
  const todayCount = activeTodos.filter((t) => t.dueDate === todayStr).length
  const flaggedCount = activeTodos.filter((t) => t.flagged).length
  const historyCount = 0 // Will be computed from history entries

  const counts: Record<string, number> = {
    todos: activeTodos.length,
    important: importantCount,
    today: todayCount,
    flagged: flaggedCount,
    history: historyCount,
  }

  // Quick stats
  const completedTodos = todos.filter((t) => t.completed && !t.deletedAt).length
  const todaySessions = pomodoroSessions.filter((s) => s.date === todayStr && s.type === "work").length
  const focusMinutes = pomodoroSessions
    .filter((s) => s.date === todayStr && s.type === "work")
    .reduce((acc, s) => acc + s.duration, 0)

  // Calculate streak
  const streakDays = calculateStreak(habitLogs)

  function handleNav(view: ViewType) {
    setCurrentView(view)
    onNavigate?.()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="relative flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
            <ClipboardList className="size-6 text-white" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/25 via-transparent to-transparent" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
              TaskNotes
            </h1>
            <p className="text-[10px] font-medium tracking-wide text-muted-foreground">
              {t("appSubtitle", lang)}
            </p>
          </div>
        </div>
      </div>

      {/* Weather */}
      <WeatherWidget />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-4 pb-4">
          {navSections.map((section) => (
            <div key={section.titleKey}>
              <div className="mb-2 border-b border-border/50 px-3 pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t(section.titleKey, lang)}
                </span>
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = currentView === item.id
                  const Icon = item.icon
                  const count = counts[item.id]

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150",
                        isActive
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-7 items-center justify-center rounded-lg transition-colors",
                          isActive
                            ? "bg-white/20"
                            : "group-hover:bg-emerald-500/10"
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <span className="flex-1 text-left">{t(item.labelKey, lang)}</span>
                      {count !== undefined && count > 0 && (
                        <span
                          className={cn(
                            "min-w-[24px] rounded-full px-2 py-0.5 text-center text-[10px] font-bold",
                            isActive
                              ? "bg-white/25 text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Quick Stats Footer */}
      <div className="border-t border-border/50 p-4">
        <div className="flex items-center justify-around text-center">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {completedTodos}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {t("completed", lang)}
            </span>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-center gap-1">
              <Flame className="size-3.5 text-amber-500" />
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {streakDays}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {t("consecutiveDays", lang)}
            </span>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-center gap-1">
              <Timer className="size-3.5 text-teal-500" />
              <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                {todaySessions}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {t("pomodoro", lang)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function calculateStreak(habitLogs: { date: string; completed: boolean }[]): number {
  if (habitLogs.length === 0) return 0

  const completedDates = new Set(
    habitLogs.filter((l) => l.completed).map((l) => l.date)
  )

  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    if (completedDates.has(dateStr)) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  return streak
}

export function AppSidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-[300px] lg:shrink-0 lg:flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar as Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[300px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
