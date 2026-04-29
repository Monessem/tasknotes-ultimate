"use client"

import { useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  X,
  Download,
  Copy,
  CheckCircle2,
  Target,
  Timer,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarCheck,
  Trophy,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  BarChart3,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import type { Language } from "@/lib/i18n"

function ComparisonIndicator({
  comparison,
}: {
  comparison: { type: "up" | "down" | "same"; pct: number }
}) {
  if (comparison.type === "up") {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <ArrowUpRight className="size-3" />+{comparison.pct}%
      </span>
    )
  }
  if (comparison.type === "down") {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
        <ArrowDownRight className="size-3" />-{comparison.pct}%
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
      <Minus className="size-3" />0%
    </span>
  )
}

interface WeeklyReportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WeeklyReport({ open, onOpenChange }: WeeklyReportProps) {
  const {
    todos,
    habits,
    habitLogs,
    pomodoroSessions,
    historyEntries,
    achievements,
    settings,
  } = useAppStore()
  const lang = settings.language
  const [copied, setCopied] = useState(false)

  // Week boundaries
  const { startOfWeek, endOfWeek, startOfLastWeek, endOfLastWeek } = useMemo(() => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const start = new Date(now)
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    const lastStart = new Date(start)
    lastStart.setDate(lastStart.getDate() - 7)
    const lastEnd = new Date(start)
    lastEnd.setDate(lastEnd.getDate() - 1)
    lastEnd.setHours(23, 59, 59, 999)
    return {
      startOfWeek: start,
      endOfWeek: end,
      startOfLastWeek: lastStart,
      endOfLastWeek: lastEnd,
    }
  }, [])

  const isThisWeek = useCallback(
    (dateStr: string) => {
      const d = new Date(dateStr)
      return d >= startOfWeek && d <= endOfWeek
    },
    [startOfWeek, endOfWeek]
  )

  const isLastWeek = useCallback(
    (dateStr: string) => {
      const d = new Date(dateStr)
      return d >= startOfLastWeek && d <= endOfLastWeek
    },
    [startOfLastWeek, endOfLastWeek]
  )

  // Calculations
  const tasksCompletedThisWeek = useMemo(
    () =>
      todos.filter(
        (todo) =>
          todo.completed &&
          !todo.deletedAt &&
          todo.completedAt &&
          isThisWeek(todo.completedAt)
      ).length,
    [todos, isThisWeek]
  )

  const tasksCompletedLastWeek = useMemo(
    () =>
      todos.filter(
        (todo) =>
          todo.completed &&
          !todo.deletedAt &&
          todo.completedAt &&
          isLastWeek(todo.completedAt)
      ).length,
    [todos, isLastWeek]
  )

  const tasksCreatedThisWeek = useMemo(
    () =>
      todos.filter(
        (todo) => !todo.deletedAt && isThisWeek(todo.createdAt)
      ).length,
    [todos, isThisWeek]
  )

  const habitsCompletedThisWeek = useMemo(
    () =>
      habitLogs.filter((log) => log.completed && isThisWeek(log.date)).length,
    [habitLogs, isThisWeek]
  )

  const habitsCompletedLastWeek = useMemo(
    () =>
      habitLogs.filter((log) => log.completed && isLastWeek(log.date)).length,
    [habitLogs, isLastWeek]
  )

  const activeHabits = habits.filter((h) => !h.deletedAt)

  const focusSessionsThisWeek = useMemo(
    () =>
      pomodoroSessions.filter(
        (s) => s.type === "work" && isThisWeek(s.date)
      ).length,
    [pomodoroSessions, isThisWeek]
  )

  const focusSessionsLastWeek = useMemo(
    () =>
      pomodoroSessions.filter(
        (s) => s.type === "work" && isLastWeek(s.date)
      ).length,
    [pomodoroSessions, isLastWeek]
  )

  const focusMinutesThisWeek = useMemo(
    () =>
      pomodoroSessions
        .filter((s) => s.type === "work" && isThisWeek(s.date))
        .reduce((acc, s) => acc + s.duration, 0),
    [pomodoroSessions, isThisWeek]
  )

  const focusMinutesLastWeek = useMemo(
    () =>
      pomodoroSessions
        .filter((s) => s.type === "work" && isLastWeek(s.date))
        .reduce((acc, s) => acc + s.duration, 0),
    [pomodoroSessions, isLastWeek]
  )

  // Most productive day
  const mostProductiveDay = useMemo(() => {
    const dayCounts: Record<string, number> = {}
    todos
      .filter(
        (todo) =>
          todo.completed &&
          !todo.deletedAt &&
          todo.completedAt &&
          isThisWeek(todo.completedAt)
      )
      .forEach((todo) => {
        if (todo.completedAt) {
          const day = new Date(todo.completedAt).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US",
            { weekday: "long" }
          )
          dayCounts[day] = (dayCounts[day] || 0) + 1
        }
      })
    const entries = Object.entries(dayCounts)
    if (entries.length === 0) return null
    return entries.reduce((a, b) => (b[1] > a[1] ? b : a))
  }, [todos, isThisWeek, lang])

  // Achievements this week
  const achievementsThisWeek = useMemo(
    () =>
      achievements.filter(
        (a) => a.unlockedAt && isThisWeek(a.unlockedAt)
      ),
    [achievements, isThisWeek]
  )

  // Week comparison
  const getComparison = useCallback(
    (current: number, previous: number) => {
      if (previous === 0 && current === 0) return { type: "same" as const, pct: 0 }
      if (previous === 0) return { type: "up" as const, pct: 100 }
      const pct = Math.round(((current - previous) / previous) * 100)
      if (pct > 0) return { type: "up" as const, pct }
      if (pct < 0) return { type: "down" as const, pct: Math.abs(pct) }
      return { type: "same" as const, pct: 0 }
    },
    []
  )

  const taskComparison = getComparison(tasksCompletedThisWeek, tasksCompletedLastWeek)
  const habitComparison = getComparison(habitsCompletedThisWeek, habitsCompletedLastWeek)
  const focusComparison = getComparison(focusMinutesThisWeek, focusMinutesLastWeek)

  // Habit completion rate this week
  const habitCompletionRate = useMemo(() => {
    if (activeHabits.length === 0) return 0
    const daysInWeek = 7
    const totalPossible = activeHabits.length * daysInWeek
    const totalCompleted = habitLogs.filter(
      (log) => log.completed && isThisWeek(log.date)
    ).length
    return Math.round((totalCompleted / totalPossible) * 100)
  }, [activeHabits, habitLogs, isThisWeek])

  // Motivational message
  const motivationalMessage = useMemo(() => {
    const total = tasksCompletedThisWeek + habitsCompletedThisWeek + focusSessionsThisWeek
    if (total === 0) return t("reportMotivation0", lang)
    if (total < 5) return t("reportMotivation1", lang)
    if (total < 15) return t("reportMotivation2", lang)
    if (total < 30) return t("reportMotivation3", lang)
    return t("reportMotivation4", lang)
  }, [tasksCompletedThisWeek, habitsCompletedThisWeek, focusSessionsThisWeek, lang])

  // Overall score
  const overallScore = useMemo(() => {
    const taskScore = Math.min(tasksCompletedThisWeek * 5, 30)
    const habitScore = Math.min(habitCompletionRate * 0.35, 35)
    const focusScore = Math.min(focusMinutesThisWeek / 2, 35)
    return Math.round(taskScore + habitScore + focusScore)
  }, [tasksCompletedThisWeek, habitCompletionRate, focusMinutesThisWeek])

  // Export report as text
  const handleExport = useCallback(() => {
    const weekRange = `${startOfWeek.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric", year: "numeric" })}`
    const report = [
      `📊 ${t("weeklyReport", lang)}`,
      `${weekRange}`,
      ``,
      `──────────────────────────────`,
      ``,
      `🎯 ${t("overallScore", lang)}: ${overallScore}/100`,
      ``,
      `✅ ${t("tasksCompletedWeek", lang)}: ${tasksCompletedThisWeek}`,
      `🎯 ${t("habitsCompletedWeek", lang)}: ${habitsCompletedThisWeek}`,
      `⏱️ ${t("focusMinutes", lang)}: ${focusMinutesThisWeek}m`,
      `🔥 ${t("focusSessionsWeek", lang)}: ${focusSessionsThisWeek}`,
      ``,
      `📈 ${t("vsLastWeek", lang)}:`,
      `  Tasks: ${taskComparison.type === "up" ? "↑" : taskComparison.type === "down" ? "↓" : "="} ${taskComparison.type === "same" ? t("sameTasks", lang) : `${taskComparison.pct}%`}`,
      `  Habits: ${habitComparison.type === "up" ? "↑" : habitComparison.type === "down" ? "↓" : "="} ${habitComparison.type === "same" ? t("sameTasks", lang) : `${habitComparison.pct}%`}`,
      `  Focus: ${focusComparison.type === "up" ? "↑" : focusComparison.type === "down" ? "↓" : "="} ${focusComparison.type === "same" ? t("sameTasks", lang) : `${focusComparison.pct}%`}`,
      ``,
      mostProductiveDay ? `📅 ${t("mostProductiveDay", lang)}: ${mostProductiveDay[0]} (${mostProductiveDay[1]} ${t("completed", lang).toLowerCase()})` : "",
      ``,
      `💪 ${motivationalMessage}`,
      ``,
      `— TaskNotes Ultimate`,
    ].join("\n")

    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `weekly-report-${startOfWeek.toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [
    lang, startOfWeek, endOfWeek, overallScore, tasksCompletedThisWeek,
    habitsCompletedThisWeek, focusMinutesThisWeek, focusSessionsThisWeek,
    taskComparison, habitComparison, focusComparison, mostProductiveDay,
    motivationalMessage,
  ])

  // Copy report to clipboard
  const handleCopy = useCallback(() => {
    const weekRange = `${startOfWeek.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric", year: "numeric" })}`
    const text = [
      `📊 ${t("weeklyReport", lang)} — ${weekRange}`,
      `🎯 Score: ${overallScore}/100`,
      `✅ Tasks: ${tasksCompletedThisWeek} | 🎯 Habits: ${habitsCompletedThisWeek} | ⏱️ Focus: ${focusMinutesThisWeek}m`,
      `💪 ${motivationalMessage}`,
    ].join("\n")

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [
    lang, startOfWeek, endOfWeek, overallScore, tasksCompletedThisWeek,
    habitsCompletedThisWeek, focusMinutesThisWeek, motivationalMessage,
  ])

  const weekRange = `${startOfWeek.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric", year: "numeric" })}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("weeklyReport", lang)}</DialogTitle>
          <DialogDescription>{t("weeklyReportDesc", lang)}</DialogDescription>
        </DialogHeader>

        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <BarChart3 className="size-5 text-emerald-500" />
                {t("weeklyReport", lang)}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{weekRange}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Overall Score Ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-6 flex flex-col items-center rounded-2xl border border-border/50 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 p-6"
          >
            <div className="relative mb-3">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="reportScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/30"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="url(#reportScoreGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - overallScore / 100)}`}
                  transform="rotate(-90 60 60)"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  {overallScore}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  / 100
                </span>
              </div>
            </div>
            <p className="text-sm font-bold text-foreground">
              {t("overallScore", lang)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground italic">
              {motivationalMessage}
            </p>
          </motion.div>

          {/* Key Metrics */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            {/* Tasks Completed */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border/30 bg-emerald-500/5 p-3 text-center"
            >
              <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                <CheckCircle2 className="size-4" />
              </div>
              <p className="text-xl font-extrabold text-foreground">
                {tasksCompletedThisWeek}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground">
                {t("tasksCompletedWeek", lang)}
              </p>
              <div className="mt-1">
                <ComparisonIndicator comparison={taskComparison} />
              </div>
            </motion.div>

            {/* Habits */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl border border-border/30 bg-amber-500/5 p-3 text-center"
            >
              <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                <Target className="size-4" />
              </div>
              <p className="text-xl font-extrabold text-foreground">
                {habitCompletionRate}%
              </p>
              <p className="text-[10px] font-medium text-muted-foreground">
                {t("habitCompletionRate", lang)}
              </p>
              <div className="mt-1">
                <ComparisonIndicator comparison={habitComparison} />
              </div>
            </motion.div>

            {/* Focus Time */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-border/30 bg-cyan-500/5 p-3 text-center"
            >
              <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 text-white">
                <Timer className="size-4" />
              </div>
              <p className="text-xl font-extrabold text-foreground">
                {focusMinutesThisWeek}m
              </p>
              <p className="text-[10px] font-medium text-muted-foreground">
                {t("focusTime", lang)}
              </p>
              <div className="mt-1">
                <ComparisonIndicator comparison={focusComparison} />
              </div>
            </motion.div>
          </div>

          {/* Detailed Stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-5 rounded-2xl border border-border/50 bg-card/60 p-4"
          >
            <h3 className="mb-3 text-sm font-bold text-foreground">
              {t("reportDetails", lang)}
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarCheck className="size-3.5 text-emerald-500" />
                  {t("tasksCreated", lang)}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {tasksCreatedThisWeek}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3.5 text-cyan-500" />
                  {t("focusSessionsWeek", lang)}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {focusSessionsThisWeek}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Target className="size-3.5 text-amber-500" />
                  {t("habitsCompletedWeek", lang)}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {habitsCompletedThisWeek}
                </span>
              </div>
              {mostProductiveDay && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="size-3.5 text-amber-500" />
                      {t("mostProductiveDay", lang)}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {mostProductiveDay[0]}
                    </span>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Achievements This Week */}
          {achievementsThisWeek.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"
            >
              <h3 className="mb-3 text-sm font-bold text-foreground flex items-center gap-2">
                <Trophy className="size-4 text-amber-500" />
                {t("achievementsThisWeek", lang)}
              </h3>
              <div className="space-y-2">
                {achievementsThisWeek.map((ach) => (
                  <div
                    key={ach.id}
                    className="flex items-center gap-3 rounded-xl bg-card/60 px-3 py-2"
                  >
                    <span className="text-lg">{ach.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {ach.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {ach.description}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                    >
                      {ach.tier}
                    </Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded-xl border-border/50"
              onClick={handleExport}
            >
              <Download className="size-4" />
              {t("exportReport", lang)}
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded-xl border-border/50"
              onClick={handleCopy}
            >
              {copied ? (
                <CheckCircle2 className="size-4 text-emerald-500" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? t("copied", lang) : t("copyReport", lang)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
