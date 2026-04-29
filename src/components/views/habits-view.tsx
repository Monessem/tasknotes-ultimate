"use client"

import { useCallback } from "react"
import {
  Target,
  Plus,
  Flame,
  Check,
  Pencil,
  Trash2,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { audioManager } from "@/lib/audio"
import { logHistory } from "@/lib/history-log"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

export function HabitsView() {
  const { habits, habitLogs, setEditingItem, setActiveModal, fetchHabitLogs, fetchHabits } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language

  const activeHabits = habits.filter((h) => !h.deletedAt)
  const todayStr = new Date().toISOString().split("T")[0]

  const completedCount = activeHabits.filter((h) =>
    habitLogs.some((log) => log.habitId === h.id && log.date === todayStr && log.completed)
  ).length
  const overallProgress = activeHabits.length > 0 ? Math.round((completedCount / activeHabits.length) * 100) : 0

  const isHabitCompletedToday = (habitId: string) => {
    return habitLogs.some(
      (log) => log.habitId === habitId && log.date === todayStr && log.completed
    )
  }

  const toggleHabitLog = useCallback(
    async (habitId: string) => {
      try {
        const res = await fetch("/api/habit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habitId, date: todayStr }),
        })
        if (res.ok) {
          const wasCompleted = habitLogs.some(
            (log) => log.habitId === habitId && log.date === todayStr && log.completed
          )
          audioManager.play(wasCompleted ? "click" : "complete")
          if (!wasCompleted) {
            const habit = habits.find((h) => h.id === habitId)
            if (habit) {
              logHistory("complete", "habit", habitId, habit.name)
              toast.success(t("habitCompleted", lang), { description: t("keepItUp", lang) })
            }
          }
          await fetchHabitLogs()
        }
      } catch {
        // Silently fail
      }
    },
    [fetchHabitLogs, todayStr, habits, habitLogs, lang]
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
    },
    [fetchHabits, lang]
  )

  // Calculate streak for each habit
  const getStreak = (habitId: string) => {
    const habitLogsForHabit = habitLogs.filter(
      (l) => l.habitId === habitId && l.completed
    )
    const completedDates = new Set(habitLogsForHabit.map((l) => l.date))

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

  // Get completion rate for last 7 days
  const get7DayRate = (habitId: string) => {
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
  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date.toISOString().split("T")[0])
    }
    return days
  }

  const last7Days = getLast7Days()

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
          >
            {completedCount}/{activeHabits.length} {t("done", lang)}
          </Badge>
          {activeHabits.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground">
              {overallProgress}% {t("completionRate", lang).toLowerCase()}
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => setActiveModal("addHabit")}
          className="gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25 hover:from-rose-600 hover:to-pink-600"
        >
          <Plus className="size-3.5" />
          {t("newHabit", lang)}
        </Button>
      </div>

      {/* Overall progress bar */}
      {activeHabits.length > 0 && (
        <div className="rounded-xl border border-border/30 bg-card/60 p-3 backdrop-blur-sm">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("todayProgress", lang)}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {completedCount}/{activeHabits.length}
            </span>
          </div>
          <Progress
            value={overallProgress}
            className="h-2 bg-emerald-100 dark:bg-emerald-900/30 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-emerald-400 [&>[data-slot=progress-indicator]]:to-teal-500"
          />
        </div>
      )}

      {/* Habits list */}
      {activeHabits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/30">
            <Target className="size-7 text-rose-500" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            {t("noHabits", lang)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("noHabitsDesc", lang)}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeHabits.map((habit) => {
            const completed = isHabitCompletedToday(habit.id)
            const streak = getStreak(habit.id)
            const rate7d = get7DayRate(habit.id)

            return (
              <Card
                key={habit.id}
                className={cn(
                  "group relative cursor-pointer overflow-hidden rounded-xl border bg-card/80 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                  completed
                    ? "border-emerald-200/50 dark:border-emerald-800/30"
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
                  style={{ backgroundColor: habit.color || "#10b981" }}
                />
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Toggle button with habit icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleHabitLog(habit.id)
                      }}
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-xl text-lg transition-all",
                        completed
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                          : "border-2 border-dashed border-muted-foreground/30 hover:border-emerald-500/50"
                      )}
                      style={!completed ? { borderColor: `${habit.color}80` } : undefined}
                    >
                      {completed ? (
                        <Check className="size-5" />
                      ) : (
                        <span className="text-base">{habit.icon}</span>
                      )}
                    </button>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-semibold",
                          completed ? "text-muted-foreground line-through" : "text-foreground"
                        )}>
                          {habit.name}
                        </span>
                        {habit.frequency === "daily" && (
                          <Badge
                            variant="outline"
                            className="h-4 border-0 px-1 text-[9px]"
                          >
                            {t("daily", lang)}
                          </Badge>
                        )}
                        {habit.frequency === "weekly" && (
                          <Badge
                            variant="outline"
                            className="h-4 border-0 px-1 text-[9px]"
                          >
                            {t("weekly", lang)}
                          </Badge>
                        )}
                      </div>

                      {/* Streak + 7-day rate */}
                      <div className="mt-1 flex items-center gap-3">
                        {streak > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <Flame className="size-3 text-orange-500" />
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              {streak} {t("daysStreak", lang)}
                            </span>
                          </div>
                        )}
                        <div className="text-[10px] font-medium text-muted-foreground">
                          7d: {rate7d}%
                        </div>
                      </div>

                      {/* Mini 7-day calendar */}
                      <div className="mt-2 flex items-center gap-1.5">
                        {last7Days.map((day) => {
                          const dayCompleted = habitLogs.some(
                            (l) =>
                              l.habitId === habit.id &&
                              l.date === day &&
                              l.completed
                          )
                          const isToday = day === todayStr
                          return (
                            <div
                              key={day}
                              className={cn(
                                "size-5 rounded-md transition-colors",
                                dayCompleted
                                  ? "bg-emerald-500"
                                  : isToday
                                    ? "border border-emerald-300 bg-muted/50 dark:border-emerald-700"
                                    : "bg-muted/50"
                              )}
                              title={day}
                            />
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
