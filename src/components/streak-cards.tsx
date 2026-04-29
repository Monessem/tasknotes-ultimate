"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { Flame, Trophy } from "lucide-react"

function StreakCardsInner() {
  const { habits, habitLogs, todos, pomodoroSessions, settings } = useAppStore()
  const lang = settings.language

  // Calculate current streak and longest streak
  const { currentStreak, longestStreak } = useMemo(() => {
    // Build a set of all "active" dates (dates with at least 1 completion from any source)
    const activeDates = new Set<string>()

    // 1. Habit logs
    for (const log of habitLogs) {
      if (log.completed) {
        activeDates.add(log.date)
      }
    }

    // 2. Completed todos
    for (const todo of todos) {
      if (todo.completed && !todo.deletedAt && todo.completedAt) {
        const dateStr = todo.completedAt.split("T")[0]
        if (dateStr) activeDates.add(dateStr)
      }
    }

    // 3. Pomodoro sessions
    for (const session of pomodoroSessions) {
      activeDates.add(session.date)
    }

    if (activeDates.size === 0) return { currentStreak: 0, longestStreak: 0 }

    const sortedDates = [...activeDates].sort()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split("T")[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split("T")[0]

    // Calculate longest streak
    let bestStreak = 1
    let streak = 1
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1] + "T00:00:00")
      const curr = new Date(sortedDates[i] + "T00:00:00")
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        streak++
        if (streak > bestStreak) bestStreak = streak
      } else if (diffDays > 1) {
        streak = 1
      }
    }

    // Calculate current streak (must include today or yesterday)
    let curStreak = 0
    const checkDate = activeDates.has(todayStr) ? todayStr : activeDates.has(yesterdayStr) ? yesterdayStr : null

    if (checkDate) {
      let d = new Date(checkDate + "T00:00:00")
      while (activeDates.has(d.toISOString().split("T")[0])) {
        curStreak++
        d.setDate(d.getDate() - 1)
      }
    }

    return { currentStreak: curStreak, longestStreak: bestStreak }
  }, [habitLogs, todos, pomodoroSessions])

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Current Streak */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
        <div className="relative flex flex-col items-center text-center">
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-emerald-500/15">
            <Flame className="size-5 text-emerald-500" />
          </div>
          <span className="text-3xl font-extrabold text-foreground">{currentStreak}</span>
          <span className="text-xs text-muted-foreground">{t("daysStreak", lang)}</span>
          <span className="mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            {t("currentStreak", lang)}
          </span>
        </div>
      </motion.div>

      {/* Longest Streak */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5" />
        <div className="relative flex flex-col items-center text-center">
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-amber-500/15">
            <Trophy className="size-5 text-amber-500" />
          </div>
          <span className="text-3xl font-extrabold text-foreground">{longestStreak}</span>
          <span className="text-xs text-muted-foreground">{t("daysStreak", lang)}</span>
          <span className="mt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            {t("longestStreak", lang)}
          </span>
        </div>
      </motion.div>
    </div>
  )
}

export const StreakCards = dynamic(
  () => Promise.resolve(StreakCardsInner),
  { ssr: false }
)
