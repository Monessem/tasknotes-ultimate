"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { useAppStore, type ViewType } from "@/store/app-store"
import { AppSidebar } from "@/components/sidebar"
import { AppHeader } from "@/components/app-header"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { TodosView } from "@/components/views/todos-view"
import { ImportantView } from "@/components/views/important-view"
import { TodayView } from "@/components/views/today-view"
import { CalendarView } from "@/components/views/calendar-view"
import { FlaggedView } from "@/components/views/flagged-view"
import { NotesView } from "@/components/views/notes-view"
import { HabitsView } from "@/components/views/habits-view"
import { FoldersView } from "@/components/views/folders-view"
import { SettingsView } from "@/components/views/settings-view"
import { RecycleView } from "@/components/views/recycle-view"
import { HistoryView } from "@/components/views/history-view"
import { FolderDetailView } from "@/components/views/folder-detail-view"
import { AchievementsView } from "@/components/views/achievements-view"
import { FocusView } from "@/components/views/focus-view"
import { TodoModal } from "@/components/modals/todo-modal"
import { NoteModal } from "@/components/modals/note-modal"
import { HabitModal } from "@/components/modals/habit-modal"
import { FolderModal } from "@/components/modals/folder-modal"
import { ConfirmModal } from "@/components/modals/confirm-modal"
import { InstallPrompt } from "@/components/install-prompt"
import { PageTransition } from "@/components/page-transition"
import { CommandPalette } from "@/components/command-palette"
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog"
import { NotificationManager } from "@/components/notification-manager"
import { SmartFAB } from "@/components/smart-fab"
import { WeeklyReport } from "@/components/weekly-report"
import { AnimatedEmptyState } from "@/components/animated-empty-state"
import { CheckSquare, Star, Flag, ListTodo, CircleCheckBig, Target, TrendingUp, Plus, Clock, AlertTriangle, Flame, CalendarCheck, CheckCircle2, Timer, ArrowUpRight, ArrowDownRight, Minus, BarChart3 } from "lucide-react"
import { WeeklyTaskChart } from "@/components/weekly-task-chart"
import { PriorityPieChart } from "@/components/priority-pie-chart"
import { HabitHeatmap } from "@/components/habit-heatmap"
import { HabitCompletionChart } from "@/components/habit-completion-chart"
import { ActivityHeatmap } from "@/components/activity-heatmap"
import { WeeklyBarChart } from "@/components/weekly-bar-chart"
import { StreakCards } from "@/components/streak-cards"
import { CompletionRateCard } from "@/components/completion-rate-card"
import { t } from "@/lib/i18n"
import { audioManager } from "@/lib/audio"
import { logHistory } from "@/lib/history-log"
import { staggerContainer, staggerItem } from "@/lib/animations"
import type { Language } from "@/lib/i18n"
import { toast } from "sonner"

function getGreeting(lang: Language): string {
  const hour = new Date().getHours()
  if (lang === "ar") {
    if (hour < 12) return "صباح الخير ☀️"
    if (hour < 17) return "مساء الخير 🌤️"
    return "مساء الخير 🌙"
  }
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

// Motivational quotes - one for each day of the week (Sunday=0 to Saturday=6)
const MOTIVATIONAL_QUOTES = [
  "The secret of getting ahead is getting started.",
  "Small daily improvements are the key to staggering long-term results.",
  "Focus on being productive instead of busy.",
  "The only way to do great work is to love what you do.",
  "It always seems impossible until it's done.",
  "Don't watch the clock; do what it does. Keep going.",
  "Your future is created by what you do today, not tomorrow.",
]

// Dashboard view
function DashboardView() {
  const { todos, notes, habits, habitLogs, pomodoroSessions, settings, fetchTodos } = useAppStore()
  const lang = settings.language
  const quickAddRef = useRef<HTMLInputElement>(null)
  const [quickAddValue, setQuickAddValue] = useState("")

  const activeTodos = todos.filter((t) => !t.completed && !t.deletedAt)
  const completedTodos = todos.filter((t) => t.completed && !t.deletedAt)
  const completionRate = todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0
  const todayStr = new Date().toISOString().split("T")[0]
  const todaySessions = pomodoroSessions.filter((s) => s.date === todayStr && s.type === "work").length
  const focusMinutes = pomodoroSessions
    .filter((s) => s.date === todayStr && s.type === "work")
    .reduce((acc, s) => acc + s.duration, 0)

  // Today's focus calculations
  const todosDueToday = todos.filter((t) => !t.deletedAt && t.dueDate === todayStr)
  const overdueTodos = todos.filter(
    (t) => !t.completed && !t.deletedAt && t.dueDate && t.dueDate < todayStr
  )
  const activeHabits = habits.filter((h) => !h.deletedAt)
  const habitsCompletedToday = activeHabits.filter((h) =>
    habitLogs.some((log) => log.habitId === h.id && log.date === todayStr && log.completed)
  ).length
  const habitsRemainingToday = activeHabits.length - habitsCompletedToday

  // Weekly Insights calculations
  const startOfWeek = (() => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const start = new Date(d.setDate(diff))
    start.setHours(0, 0, 0, 0)
    return start
  })()
  const startOfLastWeek = new Date(startOfWeek)
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)
  const endOfLastWeek = new Date(startOfWeek)

  const isThisWeek = (dateStr: string) => {
    const d = new Date(dateStr)
    return d >= startOfWeek
  }
  const isLastWeek = (dateStr: string) => {
    const d = new Date(dateStr)
    return d >= startOfLastWeek && d < endOfLastWeek
  }

  const tasksCompletedThisWeek = todos.filter(
    (t) => t.completed && !t.deletedAt && t.completedAt && isThisWeek(t.completedAt)
  ).length
  const tasksCompletedLastWeek = todos.filter(
    (t) => t.completed && !t.deletedAt && t.completedAt && isLastWeek(t.completedAt)
  ).length
  const habitsCompletedThisWeek = habitLogs.filter(
    (log) => log.completed && isThisWeek(log.date)
  ).length
  const focusSessionsThisWeek = pomodoroSessions.filter(
    (s) => s.type === "work" && isThisWeek(s.date)
  ).length

  // Habit streak: longest consecutive days of habit completion
  const getHabitStreak = () => {
    const activeHabitList = habits.filter((h) => !h.deletedAt)
    let bestStreak = 0
    for (const habit of activeHabitList) {
      const logs = habitLogs
        .filter((l) => l.habitId === habit.id && l.completed)
        .map((l) => l.date)
        .sort()
        .reverse()
      let streak = 0
      let checkDate = new Date().toISOString().split("T")[0]
      for (const logDate of logs) {
        if (logDate === checkDate) {
          streak++
          const d = new Date(checkDate)
          d.setDate(d.getDate() - 1)
          checkDate = d.toISOString().split("T")[0]
        } else if (logDate < checkDate) {
          break
        }
      }
      if (streak > bestStreak) bestStreak = streak
    }
    return bestStreak
  }

  // Pomodoro streak: consecutive days with at least one work session
  const getPomodoroStreak = () => {
    const workDates = [
      ...new Set(
        pomodoroSessions
          .filter((s) => s.type === "work")
          .map((s) => s.date)
      ),
    ].sort()
      .reverse()
    if (workDates.length === 0) return 0
    let streak = 0
    let checkDate = new Date().toISOString().split("T")[0]
    // If no session today, check from yesterday
    if (!workDates.includes(checkDate)) {
      const d = new Date(checkDate)
      d.setDate(d.getDate() - 1)
      checkDate = d.toISOString().split("T")[0]
    }
    for (const sessionDate of workDates) {
      if (sessionDate === checkDate) {
        streak++
        const d = new Date(checkDate)
        d.setDate(d.getDate() - 1)
        checkDate = d.toISOString().split("T")[0]
      } else if (sessionDate < checkDate) {
        break
      }
    }
    return streak
  }

  const habitStreak = getHabitStreak()
  const pomodoroStreak = getPomodoroStreak()

  // Week vs last week comparison
  const getWeekComparison = () => {
    if (tasksCompletedLastWeek === 0 && tasksCompletedThisWeek === 0) return { type: "same" as const }
    if (tasksCompletedLastWeek === 0) return { type: "up" as const, pct: 100 }
    const pct = Math.round(
      ((tasksCompletedThisWeek - tasksCompletedLastWeek) / tasksCompletedLastWeek) * 100
    )
    if (pct > 0) return { type: "up" as const, pct }
    if (pct < 0) return { type: "down" as const, pct: Math.abs(pct) }
    return { type: "same" as const }
  }
  const weekComparison = getWeekComparison()

  // Productivity score: weighted combination of task completion, habits, and focus time
  const taskScore = completionRate * 0.4
  const habitScore = activeHabits.length > 0 ? (habitsCompletedToday / activeHabits.length) * 100 * 0.35 : 0
  const focusScore = Math.min(focusMinutes / 120, 1) * 100 * 0.25
  const productivityScore = Math.round(taskScore + habitScore + focusScore)

  // Motivational quote based on day of week
  const dayOfWeek = new Date().getDay()
  const todayQuote = MOTIVATIONAL_QUOTES[dayOfWeek]

  // Quick add task handler
  const handleQuickAdd = useCallback(async () => {
    const title = quickAddValue.trim()
    if (!title) return
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority: "medium" }),
      })
      if (res.ok) {
        const newTodo = await res.json()
        logHistory("create", "task", newTodo.id, title)
        toast.success(t("taskAdded", lang))
        setQuickAddValue("")
        fetchTodos()
        audioManager.play("click")
      }
    } catch {
      // Silently fail
    }
  }, [quickAddValue, lang, fetchTodos])

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="mb-2">
        <h2 className="text-2xl font-extrabold text-foreground">
          {getGreeting(lang)}
        </h2>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Quick-Add Task Bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <div className="group flex items-center gap-3 rounded-2xl border border-border/50 bg-card/80 px-4 py-3 backdrop-blur-sm transition-all focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 focus-within:bg-card">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
            <Plus className="size-4" />
          </div>
          <input
            ref={quickAddRef}
            type="text"
            value={quickAddValue}
            onChange={(e) => setQuickAddValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleQuickAdd()
            }}
            placeholder={t("quickAddPlaceholder", lang)}
            className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
        </div>
      </motion.div>

      {/* Productivity Score + Motivational Quote */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Productivity Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-card/80 p-6 backdrop-blur-sm shadow-lg shadow-emerald-500/5 lg:col-span-2"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
          <div className="relative flex items-center gap-6">
            {/* SVG Circular Gauge */}
            <div className="relative shrink-0">
              <svg width="140" height="140" viewBox="0 0 140 140" className="drop-shadow-sm">
                {/* Background ring */}
                <circle
                  cx="70"
                  cy="70"
                  r="58"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-muted/30"
                />
                {/* Gradient ring */}
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <circle
                  cx="70"
                  cy="70"
                  r="58"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 58}`}
                  strokeDashoffset={`${2 * Math.PI * 58 * (1 - productivityScore / 100)}`}
                  transform="rotate(-90 70 70)"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  {productivityScore}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  / 100
                </span>
              </div>
            </div>
            {/* Score details */}
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-bold text-foreground">
                {t("productivityScore", lang)}
              </h3>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Task Completion</span>
                  <span className="font-semibold text-foreground">{completionRate}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Habits Today</span>
                  <span className="font-semibold text-foreground">
                    {activeHabits.length > 0 ? Math.round((habitsCompletedToday / activeHabits.length) * 100) : 0}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
                    style={{
                      width: `${activeHabits.length > 0 ? (habitsCompletedToday / activeHabits.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Focus Time</span>
                  <span className="font-semibold text-foreground">{focusMinutes}m</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-700"
                    style={{ width: `${Math.min((focusMinutes / 120) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative flex items-center overflow-hidden rounded-2xl border border-amber-500/20 bg-card/80 p-6 backdrop-blur-sm shadow-lg shadow-amber-500/5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5" />
          <div className="relative flex flex-col items-center justify-center text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40">
              <Flame className="size-5 text-amber-500" />
            </div>
            <p className="italic leading-relaxed bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400">
              &ldquo;{todayQuote}&rdquo;
            </p>
          </div>
        </motion.div>
      </div>

      {/* Today's Focus Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm shadow-sm"
      >
        <h3 className="mb-3 text-sm font-bold text-foreground">
          {t("todayFocus", lang)}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 px-3 py-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20">
              <CalendarCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-foreground">{todosDueToday.length}</p>
              <p className="text-[10px] font-medium text-muted-foreground">{t("dueDate", lang)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-rose-500/10 px-3 py-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/20">
              <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400">{overdueTodos.length}</p>
              <p className="text-[10px] font-medium text-muted-foreground">{t("overdue", lang)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 px-3 py-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
              <Target className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-foreground">{habitsRemainingToday}</p>
              <p className="text-[10px] font-medium text-muted-foreground">{t("habitsRemaining", lang)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-cyan-500/10 px-3 py-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20">
              <Clock className="size-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-foreground">{focusMinutes}m</p>
              <p className="text-[10px] font-medium text-muted-foreground">{t("focusTimeToday", lang)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Weekly Insights */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.28 }}
        className="rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">
            {t("weeklyInsights", lang)}
          </h3>
          <button
            onClick={() => setWeeklyReportOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
          >
            <BarChart3 className="size-3" />
            {t("viewWeeklyReport", lang)}
          </button>
        </div>

        {/* Category Breakdown Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Tasks completed this week */}
          <div className="group relative overflow-hidden rounded-xl border border-border/30 bg-emerald-500/5 p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5">
            <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm">
              <CheckCircle2 className="size-4" />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{tasksCompletedThisWeek}</p>
            <p className="text-[10px] font-medium text-muted-foreground">{t("tasksCompletedWeek", lang)}</p>
          </div>
          {/* Habits completed this week */}
          <div className="group relative overflow-hidden rounded-xl border border-border/30 bg-amber-500/5 p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/5">
            <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
              <Target className="size-4" />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{habitsCompletedThisWeek}</p>
            <p className="text-[10px] font-medium text-muted-foreground">{t("habitsCompletedWeek", lang)}</p>
          </div>
          {/* Focus sessions this week */}
          <div className="group relative overflow-hidden rounded-xl border border-border/30 bg-cyan-500/5 p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/5">
            <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 text-white shadow-sm">
              <Timer className="size-4" />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{focusSessionsThisWeek}</p>
            <p className="text-[10px] font-medium text-muted-foreground">{t("focusSessionsWeek", lang)}</p>
          </div>
        </div>

        {/* Streak Status + Week Comparison */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Streak badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1.5 dark:from-amber-900/40 dark:to-orange-900/40">
              <Flame className="size-3.5 text-amber-500" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                {habitStreak} {t("daysStreak", lang)}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">{t("bestStreak", lang)}</span>
            <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-100 to-teal-100 px-3 py-1.5 dark:from-cyan-900/40 dark:to-teal-900/40">
              <Flame className="size-3.5 text-cyan-500" />
              <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">
                {pomodoroStreak} {t("daysStreak", lang)}
              </span>
            </div>
          </div>

          {/* Week vs Last Week */}
          <div className="flex items-center gap-1.5">
            {weekComparison.type === "up" && (
              <>
                <ArrowUpRight className="size-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ↑ {weekComparison.pct}% {t("moreTasks", lang)}
                </span>
              </>
            )}
            {weekComparison.type === "down" && (
              <>
                <ArrowDownRight className="size-3.5 text-rose-500" />
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  ↓ {weekComparison.pct}% {t("fewerTasks", lang)}
                </span>
              </>
            )}
            {weekComparison.type === "same" && (
              <>
                <Minus className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("sameTasks", lang)}
                </span>
              </>
            )}
            <span className="text-[10px] text-muted-foreground">{t("vsLastWeek", lang)}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem}>
          <StatCard
            label={t("totalTasks", lang)}
            value={activeTodos.length}
            gradient="from-emerald-500 to-teal-600"
            bgGradient="from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40"
            icon={ListTodo}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label={t("completed", lang)}
            value={completedTodos.length}
            gradient="from-amber-500 to-orange-500"
            bgGradient="from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40"
            icon={CircleCheckBig}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label={t("todayHabits", lang)}
            value={habits.filter((h) => !h.deletedAt).length}
            gradient="from-rose-500 to-pink-500"
            bgGradient="from-rose-100 to-pink-100 dark:from-rose-900/40 dark:to-pink-900/40"
            icon={Target}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label={t("completionRate", lang)}
            value={`${completionRate}%`}
            gradient="from-cyan-500 to-teal-500"
            bgGradient="from-cyan-100 to-teal-100 dark:from-cyan-900/40 dark:to-teal-900/40"
            icon={TrendingUp}
          />
        </motion.div>
      </motion.div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pomodoro Timer */}
        <div className="lg:col-span-1">
          <PomodoroTimer />
        </div>

        {/* Recent tasks */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm">
            <h3 className="mb-4 text-base font-bold text-foreground">
              {t("todos", lang)}
            </h3>
            {activeTodos.length === 0 ? (
              <AnimatedEmptyState
                icon={CheckSquare}
                title={t("noTasks", lang)}
                description={t("noTasksDesc", lang)}
              />
            ) : (
              <div className="space-y-2">
                {activeTodos.slice(0, 5).map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div
                      className={cn_priority(
                        todo.priority,
                        "size-2.5 rounded-full"
                      )}
                    />
                    <span className="flex-1 truncate text-sm font-medium text-foreground">
                      {todo.title}
                    </span>
                    {todo.important && (
                      <Star className="size-3.5 text-amber-500" />
                    )}
                    {todo.flagged && (
                      <Flag className="size-3.5 text-rose-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="mt-6">
        <WeeklyTaskChart />
      </div>

      {/* Habit Completion */}
      <div className="mt-6">
        <HabitCompletionChart />
      </div>

      {/* Data Visualizations */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PriorityPieChart />
        <HabitHeatmap />
      </div>

      {/* Analytics Section */}
      <div className="mt-6">
        <motion.h3
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4 text-lg font-bold text-foreground"
        >
          {t("analytics", lang)}
        </motion.h3>

        {/* 365-Day Activity Heatmap (full width) */}
        <ActivityHeatmap />

        {/* Grid: Weekly Bar Chart + Streak Cards + Completion Rate Card */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <WeeklyBarChart />
          <StreakCards />
          <CompletionRateCard />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  gradient,
  bgGradient,
  icon: Icon,
}: {
  label: string
  value: number | string
  gradient: string
  bgGradient: string
  icon: React.ElementType
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5">
      {/* Gradient background on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
      <div className={cn_absolute_bar(gradient)} />
      <div className="relative">
        <div
          className={`mb-3 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${bgGradient} transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className="size-5 text-foreground/70 transition-all duration-300 group-hover:text-foreground" />
        </div>
        <p className="text-2xl font-extrabold text-foreground">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function cn_priority(priority: string, base: string) {
  const colors: Record<string, string> = {
    high: "bg-rose-500",
    medium: "bg-amber-500",
    low: "bg-emerald-500",
  }
  return `${base} ${colors[priority] || colors.medium}`
}

function cn_absolute_bar(gradient: string) {
  return `absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`
}

export function AppShell() {
  const { currentView, fetchAllData, isLoading, settings } = useAppStore()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [weeklyReportOpen, setWeeklyReportOpen] = useState(false)

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Sync soundEnabled setting with audio manager
  useEffect(() => {
    audioManager.setEnabled(settings.soundEnabled)
  }, [settings.soundEnabled])

  const handleSelectFolder = useCallback((folderId: string) => {
    setSelectedFolderId(folderId)
  }, [])

  const handleBackToFolders = useCallback(() => {
    setSelectedFolderId(null)
  }, [])

  // Clear selected folder when not on folders view
  const effectiveFolderId = currentView === "folders" ? selectedFolderId : null

  // Determine which view to render
  const renderView = () => {
    // Folder detail takes priority when a folder is selected
    if (currentView === "folders" && effectiveFolderId) {
      return <FolderDetailView folderId={selectedFolderId} onBack={handleBackToFolders} />
    }

    switch (currentView) {
      case "dashboard":
        return <DashboardView />
      case "todos":
        return <TodosView />
      case "notes":
        return <NotesView />
      case "habits":
        return <HabitsView />
      case "important":
        return <ImportantView />
      case "today":
        return <TodayView />
      case "calendar":
        return <CalendarView />
      case "focus":
        return <FocusView />
      case "flagged":
        return <FlaggedView />
      case "history":
        return <HistoryView />
      case "folders":
        return <FoldersView onSelectFolder={handleSelectFolder} />
      case "recycle":
        return <RecycleView />
      case "achievements":
        return <AchievementsView />
      case "settings":
        return <SettingsView />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-4">
                <div className="size-12 animate-spin rounded-2xl border-4 border-muted border-t-emerald-500" />
                <p className="text-sm font-medium text-muted-foreground">
                  Loading...
                </p>
              </div>
            </div>
          ) : (
            <PageTransition viewKey={currentView}>
              {renderView()}
            </PageTransition>
          )}
        </div>
      </main>

      {/* Modals */}
      <TodoModal />
      <NoteModal />
      <HabitModal />
      <FolderModal />
      <InstallPrompt />
      <CommandPalette />
      <KeyboardShortcutsDialog />
      <NotificationManager />
      <WeeklyReport open={weeklyReportOpen} onOpenChange={setWeeklyReportOpen} />
      <SmartFAB />
    </div>
  )
}
