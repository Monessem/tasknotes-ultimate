"use client"

import { useCallback, useState } from "react"
import {
  Target,
  Plus,
  Flame,
  Check,
  CalendarDays,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { audioManager } from "@/lib/audio"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function HabitsView() {
  const { habits, habitLogs, setEditingItem, setActiveModal, fetchHabitLogs } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language

  const activeHabits = habits.filter((h) => !h.deletedAt)
  const todayStr = new Date().toISOString().split("T")[0]

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
          audioManager.play("complete")
          await fetchHabitLogs()
        }
      } catch {
        // Silently fail
      }
    },
    [fetchHabitLogs, todayStr]
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge
          variant="secondary"
          className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
        >
          {activeHabits.filter((h) => isHabitCompletedToday(h.id)).length}/
          {activeHabits.length} {t("done", lang)}
        </Badge>
        <Button
          size="sm"
          onClick={() => setActiveModal("addHabit")}
          className="gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25 hover:from-rose-600 hover:to-pink-600"
        >
          <Plus className="size-3.5" />
          {t("newHabit", lang)}
        </Button>
      </div>

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

            return (
              <Card
                key={habit.id}
                className="group cursor-pointer rounded-xl border border-border/30 bg-card/80 backdrop-blur-sm transition-all hover:shadow-md"
                onClick={() => {
                  setEditingItem(habit)
                  setActiveModal("editHabit")
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Toggle button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleHabitLog(habit.id)
                      }}
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl transition-all",
                        completed
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                          : "border-2 border-dashed border-muted-foreground/30 text-muted-foreground/50 hover:border-emerald-500/50 hover:text-emerald-500"
                      )}
                    >
                      <Check className="size-5" />
                    </button>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
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
                      </div>

                      {/* Streak */}
                      <div className="mt-1 flex items-center gap-3">
                        {streak > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <Flame className="size-3 text-orange-500" />
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              {streak} {t("daysStreak", lang)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Mini 7-day calendar */}
                      <div className="mt-2 flex items-center gap-1">
                        {last7Days.map((day) => {
                          const dayCompleted = habitLogs.some(
                            (l) =>
                              l.habitId === habit.id &&
                              l.date === day &&
                              l.completed
                          )
                          return (
                            <div
                              key={day}
                              className={cn(
                                "size-4 rounded-[4px] transition-colors",
                                dayCompleted
                                  ? "bg-emerald-500"
                                  : "bg-muted/50"
                              )}
                              title={day}
                            />
                          )
                        })}
                      </div>
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
