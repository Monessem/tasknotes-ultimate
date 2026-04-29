"use client"

import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  CheckSquare,
  StickyNote,
  Target,
  Star,
  CalendarDays,
  Zap,
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore, type ViewType } from "@/store/app-store"
import { t } from "@/lib/i18n"
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
  accentColor?: string
}

interface NavSection {
  titleKey: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    titleKey: "navMain",
    items: [
      { id: "dashboard", labelKey: "dashboard", icon: LayoutDashboard, accentColor: "emerald" },
      { id: "todos", labelKey: "todos", icon: CheckSquare, accentColor: "emerald" },
      { id: "notes", labelKey: "notes", icon: StickyNote, accentColor: "amber" },
      { id: "habits", labelKey: "habits", icon: Target, accentColor: "rose" },
    ],
  },
  {
    titleKey: "navFilters",
    items: [
      { id: "important", labelKey: "important", icon: Star, accentColor: "amber" },
      { id: "today", labelKey: "today", icon: CalendarDays, accentColor: "emerald" },
      { id: "calendar", labelKey: "calendar", icon: CalendarDays, accentColor: "emerald" },
      { id: "focus", labelKey: "focusView", icon: Zap, accentColor: "cyan" },
      { id: "flagged", labelKey: "flagged", icon: Flag, accentColor: "rose" },
      { id: "history", labelKey: "history", icon: History, accentColor: "teal" },
    ],
  },
  {
    titleKey: "navOther",
    items: [
      { id: "folders", labelKey: "folders", icon: FolderOpen, accentColor: "amber" },
      { id: "achievements", labelKey: "achievements", icon: Trophy, accentColor: "amber" },
      { id: "recycle", labelKey: "recycle", icon: Trash2, accentColor: "rose" },
      { id: "settings", labelKey: "settings", icon: Settings, accentColor: "teal" },
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
    <div className="mx-3 mb-4 overflow-hidden rounded-xl border border-amber-500/10 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-yellow-500/5 p-3 dark:border-amber-400/15 dark:from-amber-400/5 dark:via-orange-400/5 dark:to-yellow-400/5">
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
              <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-400/20 shadow-sm dark:from-amber-400/15 dark:to-orange-400/15">
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

function SidebarContent({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const { currentView, setCurrentView, todos, habits, habitLogs, pomodoroSessions, settings } = useAppStore()
  const lang = settings.language

  // Calculate counts
  const activeTodos = todos.filter((t) => !t.completed && !t.deletedAt)
  const importantCount = activeTodos.filter((t) => t.important).length
  const todayStr = new Date().toISOString().split("T")[0]
  const todayCount = activeTodos.filter((t) => t.dueDate === todayStr).length
  const flaggedCount = activeTodos.filter((t) => t.flagged).length
  const historyCount = 0

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

  // Calculate streak
  const streakDays = calculateStreak(habitLogs)

  function handleNav(view: ViewType) {
    setCurrentView(view)
    onNavigate?.()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn("p-5", collapsed && "p-3 flex justify-center")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center gap-0")}>
          <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
            <ClipboardList className="size-6 text-white" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/25 via-transparent to-transparent" />
            {/* Animated shimmer */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
                TaskNotes
              </h1>
              <p className="text-[10px] font-medium tracking-wide text-muted-foreground">
                {t("appSubtitle", lang)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Weather - hidden when collapsed */}
      {!collapsed && <WeatherWidget />}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className={cn("space-y-5 pb-4", collapsed && "space-y-2")}>
          {navSections.map((section) => (
            <div key={section.titleKey}>
              {/* Section headers hidden when collapsed */}
              {!collapsed && (
                <div className="mb-2 px-3 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
                    {t(section.titleKey, lang)}
                  </span>
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = currentView === item.id
                  const Icon = item.icon
                  const count = counts[item.id]

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      title={collapsed ? t(item.labelKey, lang) : undefined}
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                        collapsed && "justify-center px-2 py-2.5",
                        isActive
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                          : "text-muted-foreground hover:bg-emerald-500/5 hover:text-foreground"
                      )}
                    >
                      {/* Active indicator line */}
                      {isActive && !collapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-white/60" />
                      )}

                      <div
                        className={cn(
                          "flex size-7 items-center justify-center rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-white/20 shadow-sm"
                            : "group-hover:bg-emerald-500/10 group-hover:scale-105"
                        )}
                      >
                        <Icon className={cn(
                          "size-4 transition-transform duration-200",
                          !isActive && "group-hover:scale-110"
                        )} />
                      </div>
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{t(item.labelKey, lang)}</span>
                          {count !== undefined && count > 0 && (
                            <span
                              className={cn(
                                "min-w-[24px] rounded-full px-2 py-0.5 text-center text-[10px] font-bold transition-all duration-200",
                                isActive
                                  ? "bg-white/25 text-white"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/15"
                              )}
                            >
                              {count}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Quick Stats Footer - hidden when collapsed */}
      {!collapsed && (
        <div className="border-t border-border/50 bg-muted/20 p-4">
          <div className="flex items-center justify-around text-center">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {completedTodos}
                </span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">
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
              <span className="text-[10px] font-medium text-muted-foreground">
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
              <span className="text-[10px] font-medium text-muted-foreground">
                {t("pomodoro", lang)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AppSidebar() {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed, settings } = useAppStore()
  const lang = settings.language

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:shrink-0 lg:flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "lg:w-[68px]" : "lg:w-[280px]"
        )}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
        {/* Collapse/Expand toggle button */}
        <div className="border-t border-border/50 p-2">
          <button
            onClick={toggleSidebarCollapsed}
            className="flex w-full items-center justify-center gap-2 rounded-xl p-2.5 text-muted-foreground transition-all duration-200 hover:bg-emerald-500/5 hover:text-foreground"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <>
                <ChevronLeft className="size-4" />
                <span className="text-xs font-medium">{t("collapse", lang)}</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar as Sheet - always expanded */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
