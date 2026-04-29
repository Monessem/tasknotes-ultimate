"use client"

import { useState, useMemo } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Circle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarDays,
  ListTodo,
  CircleCheckBig,
} from "lucide-react"
import { useAppStore, type Todo } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay() // 0=Sun
}

function formatDateStr(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0")
  const d = String(day).padStart(2, "0")
  return `${year}-${m}-${d}`
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date()
  return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day
}

const priorityDotColors: Record<string, string> = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
}

// ── Component ────────────────────────────────────────────────────────────────

export function CalendarView() {
  const { todos, setEditingItem, setActiveModal, fetchTodos } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language
  const searchQuery = useAppStore((s) => s.searchQuery)

  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  // Day headers
  const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

  // Calendar grid data
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

    // Previous month days
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

    const days: { date: string; day: number; isCurrentMonth: boolean }[] = []

    // Fill in previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      days.push({
        date: formatDateStr(prevYear, prevMonth, day),
        day,
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: formatDateStr(currentYear, currentMonth, day),
        day,
        isCurrentMonth: true,
      })
    }

    // Next month days to fill 6 rows
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear
    const remaining = 42 - days.length
    for (let day = 1; day <= remaining; day++) {
      days.push({
        date: formatDateStr(nextYear, nextMonth, day),
        day,
        isCurrentMonth: false,
      })
    }

    return days
  }, [currentYear, currentMonth])

  // Group todos by date
  const todosByDate = useMemo(() => {
    const map: Record<string, Todo[]> = {}
    const activeTodos = todos.filter((t) => !t.deletedAt)

    // Apply search filter
    const filtered = searchQuery
      ? activeTodos.filter(
          (todo) =>
            todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            todo.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : activeTodos

    for (const todo of filtered) {
      if (!todo.dueDate) continue
      const dateKey = todo.dueDate.split("T")[0]
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(todo)
    }
    return map
  }, [todos, searchQuery])

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const monthStart = formatDateStr(currentYear, currentMonth, 1)
    const monthEnd = formatDateStr(currentYear, currentMonth, getDaysInMonth(currentYear, currentMonth))

    const monthTodos = todos.filter((t) => {
      if (t.deletedAt) return false
      if (!t.dueDate) return false
      const d = t.dueDate.split("T")[0]
      return d >= monthStart && d <= monthEnd
    })

    const total = monthTodos.length
    const overdue = monthTodos.filter((t) => !t.completed && t.dueDate.split("T")[0] < todayStr).length
    const completed = monthTodos.filter((t) => t.completed).length

    return { total, overdue, completed }
  }, [todos, currentYear, currentMonth, todayStr])

  // Selected day tasks
  const selectedDayTodos = useMemo(() => {
    if (!selectedDate) return []
    return todosByDate[selectedDate] || []
  }, [selectedDate, todosByDate])

  // Navigation
  function goToPrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
    setSelectedDate(null)
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
    setSelectedDate(null)
  }

  function goToToday() {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
    setSelectedDate(todayStr)
  }

  // Toggle task completion
  async function toggleComplete(todoId: string, completed: boolean) {
    try {
      const res = await fetch(`/api/todos/${todoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: !completed,
          completedAt: !completed ? new Date().toISOString() : null,
        }),
      })
      if (res.ok) {
        await fetchTodos()
      }
    } catch (err) {
      console.error("Failed to toggle task completion:", err)
    }
  }

  const isOverdue = (dueDate: string | null, completed: boolean) => {
    if (!dueDate || completed) return false
    return dueDate.split("T")[0] < todayStr
  }

  // Format month name
  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString(
    lang === "ar" ? "ar-SA" : "en-US",
    { month: "long", year: "numeric" }
  )

  return (
    <div className="space-y-5">
      {/* ── Summary Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
            <ListTodo className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-foreground">{monthlyStats.total}</p>
            <p className="text-[10px] font-medium text-muted-foreground">{t("calendarTasks", lang)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
            <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400">{monthlyStats.overdue}</p>
            <p className="text-[10px] font-medium text-muted-foreground">{t("calendarOverdue", lang)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
            <CircleCheckBig className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-foreground">{monthlyStats.completed}</p>
            <p className="text-[10px] font-medium text-muted-foreground">{t("calendarCompleted", lang)}</p>
          </div>
        </div>
      </div>

      {/* ── Month Navigation ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            onClick={goToPrevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-border/50 text-xs font-semibold"
            onClick={goToToday}
          >
            {t("today", lang)}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            onClick={goToNextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* ── Calendar Grid ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border/30 bg-muted/20">
          {dayKeys.map((key) => (
            <div
              key={key}
              className="py-2 text-center text-xs font-semibold text-muted-foreground"
            >
              {t(key, lang)}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((dayInfo, idx) => {
            const dayTodos = todosByDate[dayInfo.date] || []
            const hasHigh = dayTodos.some((t) => t.priority === "high" && !t.completed)
            const hasMedium = dayTodos.some((t) => t.priority === "medium" && !t.completed)
            const hasLow = dayTodos.some((t) => t.priority === "low" && !t.completed)
            const incompleteTodos = dayTodos.filter((t) => !t.completed)
            const isTodayCell = isToday(
              parseInt(dayInfo.date.split("-")[0]),
              parseInt(dayInfo.date.split("-")[1]) - 1,
              parseInt(dayInfo.date.split("-")[2])
            )
            const isSelected = selectedDate === dayInfo.date

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(dayInfo.date)}
                className={cn(
                  "relative flex min-h-[72px] flex-col items-center gap-1 border-b border-r border-border/20 p-1.5 transition-colors sm:min-h-[88px] sm:p-2",
                  "hover:bg-muted/30 focus:bg-muted/30",
                  !dayInfo.isCurrentMonth && "opacity-35",
                  isSelected && "bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/30",
                  isTodayCell && !isSelected && "ring-2 ring-inset ring-emerald-500"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-semibold sm:size-7 sm:text-sm",
                    isTodayCell && "bg-emerald-500 text-white",
                    !isTodayCell && dayInfo.isCurrentMonth && "text-foreground",
                    !isTodayCell && !dayInfo.isCurrentMonth && "text-muted-foreground"
                  )}
                >
                  {dayInfo.day}
                </span>
                {/* Priority dots — show for all tasks (completed + incomplete) */}
                {dayTodos.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-0.5">
                    {hasHigh && <span className="size-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/40" />}
                    {hasMedium && <span className="size-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/40" />}
                    {hasLow && <span className="size-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />}
                    {/* Completed task dot */}
                    {dayTodos.some((t) => t.completed) && !hasHigh && !hasMedium && !hasLow && (
                      <span className="size-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                )}
                {/* Task count badge if >2 */}
                {dayTodos.length > 2 && (
                  <Badge
                    variant="secondary"
                    className="h-4 min-w-[18px] px-1 text-[9px] font-bold"
                  >
                    {dayTodos.length}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Day Detail Panel ──────────────────────────────────────────────── */}
      {selectedDate && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <CalendarDays className="size-4 text-emerald-500" />
                {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                  lang === "ar" ? "ar-SA" : "en-US",
                  { weekday: "long", month: "long", day: "numeric" }
                )}
              </h4>
              {selectedDayTodos.length > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                >
                  {selectedDayTodos.length}
                </Badge>
              )}
            </div>

            {selectedDayTodos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/50 py-6 text-center">
                <CalendarDays className="mx-auto mb-1.5 size-5 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">{t("noTasksForDay", lang)}</p>
              </div>
            ) : (
              <div className="max-h-96 space-y-1.5 overflow-y-auto">
                {selectedDayTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all hover:shadow-sm cursor-pointer",
                      todo.completed
                        ? "border-border/20 bg-muted/10"
                        : isOverdue(todo.dueDate, todo.completed)
                          ? "border-rose-200/50 bg-rose-50/50 dark:border-rose-800/30 dark:bg-rose-900/10"
                          : "border-border/30 bg-muted/20 hover:bg-muted/40"
                    )}
                    onClick={() => {
                      setEditingItem(todo)
                      setActiveModal("editTodo")
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleComplete(todo.id, todo.completed)
                      }}
                      className="shrink-0"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="size-5 text-emerald-500" />
                      ) : (
                        <Circle
                          className={cn(
                            "size-5 transition-colors hover:text-emerald-500",
                            todo.priority === "high" && "text-rose-400",
                            todo.priority === "medium" && "text-amber-400",
                            todo.priority === "low" && "text-emerald-400"
                          )}
                        />
                      )}
                    </button>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "truncate text-sm font-medium",
                            todo.completed
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          )}
                        >
                          {todo.title}
                        </span>
                        {isOverdue(todo.dueDate, todo.completed) && (
                          <Badge
                            variant="outline"
                            className="h-4 shrink-0 border-rose-300 px-1 text-[9px] text-rose-600 dark:border-rose-700 dark:text-rose-400"
                          >
                            {t("calendarOverdue", lang)}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <div
                          className={cn(
                            "size-1.5 rounded-full",
                            priorityDotColors[todo.priority]
                          )}
                        />
                        <span className="text-[10px] capitalize text-muted-foreground">
                          {t(todo.priority, lang)}
                        </span>
                        {todo.dueDate && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Clock className="size-2.5" />
                            {new Date(todo.dueDate).toLocaleTimeString(
                              lang === "ar" ? "ar-SA" : "en-US",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Monthly Progress ──────────────────────────────────────────────── */}
      {monthlyStats.total > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("completionRate", lang)}
            </span>
            <span className="text-xs font-bold text-foreground">
              {monthlyStats.total > 0
                ? Math.round((monthlyStats.completed / monthlyStats.total) * 100)
                : 0}
              %
            </span>
          </div>
          <Progress
            value={
              monthlyStats.total > 0
                ? Math.round((monthlyStats.completed / monthlyStats.total) * 100)
                : 0
            }
            className="h-2"
          />
        </div>
      )}
    </div>
  )
}
