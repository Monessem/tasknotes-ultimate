"use client"

import { useState, useMemo } from "react"
import { Flame, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { useAppStore, type Habit } from "@/store/app-store"
import { Button } from "@/components/ui/button"
import { calculateHabitStreak } from "@/lib/stats"

interface HabitItemProps {
  habit: Habit
}

const DAY_LABELS_EN = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]
const DAY_LABELS_AR = ["س", "ح", "ن", "ث", "ر", "خ", "ج"]

function getWeekDates(): string[] {
  const dates: string[] = []
  const today = new Date()
  const dayOfWeek = today.getDay()

  // Calculate the start of the week (Saturday)
  const startOfWeek = new Date(today)
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 6
  startOfWeek.setDate(today.getDate() - diff)

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    dates.push(date.toISOString().split("T")[0])
  }
  return dates
}



export function HabitItem({ habit }: HabitItemProps) {
  const { habitLogs, settings, fetchHabitLogs, setActiveModal, setEditingItem } = useAppStore()
  const lang = settings.language
  const [hovered, setHovered] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const weekDates = useMemo(() => getWeekDates(), [])
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], [])
  const dayLabels = lang === "ar" ? DAY_LABELS_AR : DAY_LABELS_EN

  const streak = useMemo(() => calculateHabitStreak(habit, habitLogs), [habit, habitLogs])

  const isDayCompleted = (date: string) =>
    habitLogs.some((l) => l.habitId === habit.id && l.date === date && l.completed)

  const handleToggleDay = async (date: string) => {
    setToggling(date)
    try {
      const res = await fetch("/api/habit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId: habit.id, date }),
      })
      if (res.ok) {
        await fetchHabitLogs()
      }
    } catch (err) {
      console.error("Failed to toggle habit log:", err)
    } finally {
      setToggling(null)
    }
  }

  const handleEdit = () => {
    setEditingItem(habit)
    setActiveModal("editHabit")
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/habits/${habit.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        const { fetchHabits, fetchHabitLogs } = useAppStore.getState()
        await Promise.all([fetchHabits(), fetchHabitLogs()])
      }
    } catch (err) {
      console.error("Failed to delete habit:", err)
    }
  }

  return (
    <div
      className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm transition-all hover:shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon */}
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ backgroundColor: `${habit.color}20` }}
      >
        {habit.icon}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-bold text-foreground">
          {habit.name}
        </h4>
        <div className="mt-0.5 flex items-center gap-1.5">
          {streak > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              <Flame className="size-3" />
              {streak} {t("daysStreak", lang)}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              {t("startToday", lang)}
            </span>
          )}
        </div>
      </div>

      {/* Weekly day grid */}
      <div className="flex items-center gap-1.5">
        {weekDates.map((date, i) => {
          const isCompleted = isDayCompleted(date)
          const isToday = date === todayStr
          const isToggling = toggling === date

          return (
            <button
              key={date}
              type="button"
              onClick={() => handleToggleDay(date)}
              disabled={isToggling}
              className={cn(
                "flex size-8 flex-col items-center justify-center rounded-lg text-[10px] font-medium transition-all duration-150",
                isCompleted
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                  : isToday
                    ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-400 dark:ring-emerald-400/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted",
                isToggling && "animate-pulse opacity-60"
              )}
              title={date}
            >
              <span className="text-[8px] leading-none">{dayLabels[i]}</span>
              {isCompleted && (
                <span className="mt-0.5 text-[10px] leading-none">✓</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Actions - shown on hover */}
      <div
        className={cn(
          "flex items-center gap-1 transition-opacity duration-150",
          hovered ? "opacity-100" : "opacity-0"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg"
          onClick={handleEdit}
          aria-label={t("edit", lang)}
        >
          <Pencil className="size-3.5 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg"
          onClick={handleDelete}
          aria-label={t("delete", lang)}
        >
          <Trash2 className="size-3.5 text-rose-500" />
        </Button>
      </div>
    </div>
  )
}
