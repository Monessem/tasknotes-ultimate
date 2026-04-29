"use client"

import { useState, useMemo } from "react"
import {
  Target,
  Plus,
  Flame,
  Check,
  CheckCircle2,
  Pencil,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { audioManager } from "@/lib/audio"
import { logHistory } from "@/lib/history-log"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { AnimatedEmptyState } from "@/components/animated-empty-state"

/**
 * Check if a habit should be shown today based on its frequency.
 * - "daily": always shown
 * - "weekly": always shown (user completes once per week)
 * - "weekdays": only shown Mon-Fri
 */
function shouldShowToday(frequency: string): boolean {
  if (frequency === "daily" || frequency === "weekly") return true
  if (frequency === "weekdays") {
    const day = new Date().getDay()
    return day !== 0 && day !== 6 // Not Sunday or Saturday
  }
  return true
}

/**
 * Get the start of the current week (Monday) as a date string.
 */
function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split("T")[0]
}

/**
 * Check if a weekly habit has been completed this week.
 */
function isWeeklyHabitCompletedThisWeek(
  habitId: string,
  habitLogs: { habitId: string; date: string; completed: boolean }[]
): boolean {
  const weekStart = getWeekStart()
  return habitLogs.some(
    (log) =>
      log.habitId === habitId &&
      log.completed &&
      log.date >= weekStart
  )
}

export function HabitsView() {
  const { habits, habitLogs, setEditingItem, setActiveModal, fetchHabitLogs, fetchHabits } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language

  // Track which habit just completed for bounce animation
  const [justCompleted, setJustCompleted] = useState<string | null>(null)

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], [])

  // Filter habits based on frequency - only show relevant habits for today
  const activeHabits = useMemo(
    () => habits.filter((h) => !h.deletedAt && shouldShowToday(h.frequency)),
    [habits]
  )

  const allActiveHabits = useMemo(() => habits.filter((h) => !h.deletedAt), [habits])

  const completedCount = activeHabits.filter((h) => {
    if (h.frequency === "weekly") {
      return isWeeklyHabitCompletedThisWeek(h.id, habitLogs)
    }
    return habitLogs.some(
      (log) => log.habitId === h.id && log.date === todayStr && log.completed
    )
  }).length

  const overallProgress = activeHabits.length > 0 ? Math.round((completedCount / activeHabits.length) * 100) : 0

  // Best streak across all habits
  const bestStreak = allActiveHabits.reduce((max, habit) => {
    const streak = getStreak(habit)
    return streak > max ? streak : max
  }, 0)

  const isHabitCompletedToday = (habitId: string, frequency: string) => {
    if (frequency === "weekly") {
      return isWeeklyHabitCompletedThisWeek(habitId, habitLogs)
    }
    return habitLogs.some(
      (log) => log.habitId === habitId && log.date === todayStr && log.completed
    )
  }

  const toggleHabitLog = useCallback(
    async (habitId: string, frequency: string) => {
      try {
        // For weekly habits, if already completed this week, don't toggle off
        if (frequency === "weekly" && isWeeklyHabitCompletedThisWeek(habitId, habitLogs)) {
          return
        }

        const res = await fetch("/api/habit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habitId, date: todayStr }),
        })
        if (res.ok) {
          const wasCompleted = frequency === "weekly"
            ? isWeeklyHabitCompletedThisWeek(habitId, habitLogs)
            : habitLogs.some(
                (log) => log.habitId === habitId && log.date === todayStr && log.completed
              )
          audioManager.play(wasCompleted ? "click" : "complete")
          if (!wasCompleted) {
            const habit = habits.find((h) => h.id === habitId)
            if (habit) {
              logHistory("complete", "habit", habitId, habit.name)
              toast.success(t("habitCompleted", lang), { description: t("keepItUp", lang) })
            }
            setJustCompleted(habitId)
            setTimeout(() => setJustCompleted(null), 600)
          }
          await fetchHabitLogs()
        }
      } catch {
        // Silently fail
      }
    }
  )

  const handleDeleteHabit = useCallback(
    async (habitId: string, habitName: string) => {
      try {
        const res = await fetch(`/api/habits/${habitId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deletedAt: new Date().toISOString() }),
        })
        if (res.ok) {
          audioManager.play("delete")
          logHistory("delete", "habit", habitId, habitName)
          toast.success(t("habitDeleted", lang))
          await fetchHabits()
        }
      } catch {
        // Silently fail
      }
    }
  )

  /**
   * Calculate streak for a habit, respecting its frequency.
   * - Daily/Weekday: count consecutive days with completions
   * - Weekly: count consecutive weeks with at least one completion
   */
  function getStreak(habit: { id: string; frequency: string }) {
    const logsForHabit = habitLogs.filter(
      (l) => l.habitId === habit.id && l.completed
    )

    if (habit.frequency === "weekly") {
      // Count consecutive weeks with completions
      const completedWeeks = new Set<string>()
      for (const log of logsForHabit) {
        const d = new Date(log.date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(d)
        monday.setDate(diff)
        completedWeeks.add(monday.toISOString().split("T")[0])
      }

      let streak = 0
      const today = new Date()
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
      let checkMonday = new Date(today)
      checkMonday.setDate(diff)

      for (let i = 0; i < 52; i++) {
        const weekKey = checkMonday.toISOString().split("T")[0]
        if (completedWeeks.has(weekKey)) {
          streak++
          checkMonday.setDate(checkMonday.getDate() - 7)
        } else if (i > 0) {
          break
        } else {
          // Check if current week just started, allow grace
          checkMonday.setDate(checkMonday.getDate() - 7)
          const prevWeekKey = checkMonday.toISOString().split("T")[0]
          if (completedWeeks.has(prevWeekKey)) {
            streak++ // Count the previous week at least
          }
          break
        }
      }
      return streak
    }

    // Daily / Weekday streak logic
    const completedDates = new Set(logsForHabit.map((l) => l.date))
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      // For weekday habits, skip weekends
      if (habit.frequency === "weekdays") {
        const dayOfWeek = date.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) continue
      }

      if (completedDates.has(dateStr)) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    return streak
  }

  // Get completion rate for last 7 days
  function get7DayRate(habitId: string) {
    let completed = 0
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      if (habitLogs.some((l) => l.habitId === habitId && l.date === dateStr && l.completed)) {
        completed++
      }
    }
    return Math.round((completed / 7) * 100)
  }

  // Get last 7 days for mini calendar
  const last7Days = useMemo(() => {
    const days: { dateStr: string; dayInitial: string }[] = []
    const dayInitials = ["S", "M", "T", "W", "T", "F", "S"]
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      const dayIdx = date.getDay()
      days.push({ dateStr, dayInitial: dayInitials[dayIdx] })
    }
    return days
  }, [])

  // SVG progress ring calculations
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (overallProgress / 100) * circumference

  return (
    <div className="space-y-4">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
          >
            {completedCount}/{activeHabits.length} {t("done", lang)}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={() => setActiveModal("addHabit")}
          className="gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
        >
          <Plus className="size-3.5" />
          {t("newHabit", lang)}
        </Button>
      </div>

      {/* Summary Header Card with SVG Progress Ring */}
      {activeHabits.length > 0 && (
        <div className={cn(
          "rounded-2xl border border-border/30 p-5 backdrop-blur-sm",
          "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20"
        )}>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
            {/* SVG Progress Ring */}
            <div className="relative shrink-0" style={{ width: 80, height: 80 }}>
              <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                {/* Background circle */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-emerald-100 dark:text-emerald-900/40"
                />
                {/* Progress circle */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              {/* Center text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {overallProgress}%
                </span>
                <span className="text-[8px] font-medium text-muted-foreground">
                  {t("completed", lang).toLowerCase()}
                </span>
              </div>
            </div>

            {/* Stats section */}
            <div className="flex-1 w-full">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                {t("habitSummary", lang)}
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {/* Total active */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 sm:size-8">
                    <Target className="size-3.5 text-emerald-600 dark:text-emerald-400 sm:size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{activeHabits.length}</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">{t("dailyHabits", lang)}</p>
                  </div>
                </div>
                {/* Completed today */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40 sm:size-8">
                    <CheckCircle2 className="size-3.5 text-teal-600 dark:text-teal-400 sm:size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{completedCount}</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">{t("completed", lang)}</p>
                  </div>
                </div>
                {/* Best streak */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/40 sm:size-8">
                    <Flame className="size-3.5 text-orange-600 dark:text-orange-400 sm:size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{bestStreak}</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">{t("daysStreak", lang)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Habits list */}
      {activeHabits.length === 0 ? (
        <AnimatedEmptyState
          icon={Target}
          title={t("noHabits", lang)}
          description={t("noHabitsDesc", lang)}
        />
      ) : (
        <div className="space-y-3">
          {activeHabits.map((habit) => {
            const completed = isHabitCompletedToday(habit.id, habit.frequency)
            const streak = getStreak(habit)
            const rate7d = get7DayRate(habit.id)
            const habitColor = habit.color || "#10b981"
            const isWeekly = habit.frequency === "weekly"

            return (
              <Card
                key={habit.id}
                className={cn(
                  "group relative cursor-pointer overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl",
                  completed
                    ? "border-emerald-200/50 shadow-[0_0_20px_rgba(16,185,129,0.12)] dark:border-emerald-800/30"
                    : "border-border/30"
                )}
                onClick={() => {
                  setEditingItem(habit)
                  setActiveModal("editHabit")
                }}
              >
                {/* Color accent bar */}
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: habitColor }}
                />
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Toggle button with habit icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleHabitLog(habit.id, habit.frequency)
                      }}
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-xl text-lg transition-all",
                        completed
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                          : "border-2 border-dashed border-muted-foreground/30 hover:border-emerald-500/50",
                        justCompleted === habit.id && "animate-bounce"
                      )}
                      style={!completed ? { borderColor: `${habitColor}80` } : undefined}
                    >
                      {completed ? (
                        <Check className="size-5" />
                      ) : (
                        <span className="text-base">{habit.icon}</span>
                      )}
                    </button>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-sm font-semibold",
                          completed ? "text-muted-foreground line-through" : "text-foreground"
                        )}>
                          {habit.name}
                        </span>
                        {/* Frequency badge */}
                        <Badge
                          variant="outline"
                          className="h-4 border-0 px-1 text-[9px]"
                        >
                          {habit.frequency === "daily" && t("daily", lang)}
                          {habit.frequency === "weekly" && t("weekly", lang)}
                          {habit.frequency === "weekdays" && t("weekdays", lang)}
                        </Badge>
                        {/* Weekly Rate mini badge */}
                        <Badge
                          className={cn(
                            "h-4 border-0 px-1.5 text-[9px] font-semibold",
                            rate7d >= 80
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                              : rate7d >= 50
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
                          )}
                        >
                          {t("weeklyRate", lang)} {rate7d}%
                        </Badge>
                      </div>

                      {/* Streak + weekly status */}
                      <div className="mt-1 flex items-center gap-3">
                        {streak > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <Flame className="size-3 text-orange-500" />
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              {streak} {isWeekly ? t("weeksStreak", lang) || "wk streak" : t("daysStreak", lang)}
                            </span>
                          </div>
                        )}
                        {isWeekly && !completed && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <RefreshCw className="size-3" />
                            <span>{t("completeThisWeek", lang) || "Complete this week"}</span>
                          </div>
                        )}
                      </div>

                      {/* Mini 7-day calendar with day initials */}
                      <div className="mt-2 flex items-end gap-1.5">
                        {last7Days.map(({ dateStr, dayInitial }) => {
                          const dayCompleted = habitLogs.some(
                            (l) =>
                              l.habitId === habit.id &&
                              l.date === dateStr &&
                              l.completed
                          )
                          const isToday = dateStr === todayStr
                          return (
                            <div key={dateStr} className="flex flex-col items-center gap-0.5">
                              <div
                                className={cn(
                                  "size-5 rounded-full transition-colors",
                                  dayCompleted
                                    ? "bg-emerald-500"
                                    : isToday
                                      ? "border border-emerald-300 bg-muted/50 dark:border-emerald-700"
                                      : "bg-muted/50"
                                )}
                                title={dateStr}
                              />
                              <span className="text-[8px] font-medium text-muted-foreground/60">
                                {dayInitial}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Hover actions */}
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingItem(habit)
                          setActiveModal("editHabit")
                        }}
                        className="rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteHabit(habit.id, habit.name)
                        }}
                        className="rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
