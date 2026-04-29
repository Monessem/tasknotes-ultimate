import type { Todo } from "@/store/app-store"

export interface WeeklyStatsPoint {
  day: string       // Short day name: "Mon", "Tue", etc.
  dayAr: string     // Arabic day name
  date: string      // YYYY-MM-DD
  completed: number // Tasks completed on this day
  created: number   // Tasks created on this day
}

export function getWeeklyStats(todos: Todo[], lang: "en" | "ar" = "en"): WeeklyStatsPoint[] {
  const today = new Date()
  const result: WeeklyStatsPoint[] = []

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const dayNamesAr = ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"]

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    const dayIndex = date.getDay()

    const completed = todos.filter((t) => {
      if (!t.completedAt) return false
      return t.completedAt.split("T")[0] === dateStr
    }).length

    const created = todos.filter((t) => {
      return t.createdAt.split("T")[0] === dateStr
    }).length

    result.push({
      day: dayNames[dayIndex],
      dayAr: dayNamesAr[dayIndex],
      date: dateStr,
      completed,
      created,
    })
  }

  return result
}

export interface HabitWeeklyStats {
  day: string
  dayAr: string
  date: string
  completed: number
  total: number
  percentage: number
}

export function getHabitWeeklyStats(
  habitLogs: { date: string; completed: boolean; habitId: string }[],
  activeHabitCount: number,
  lang: "en" | "ar" = "en"
): HabitWeeklyStats[] {
  const today = new Date()
  const result: HabitWeeklyStats[] = []
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const dayNamesAr = ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"]

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    const dayIndex = date.getDay()

    const completed = habitLogs.filter((l) => l.date === dateStr && l.completed).length
    const total = activeHabitCount

    result.push({
      day: dayNames[dayIndex],
      dayAr: dayNamesAr[dayIndex],
      date: dateStr,
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    })
  }

  return result
}

// ── Shared Habit Utility Functions ────────────────────────────────────────────

/**
 * Check if a habit should be shown today based on its frequency.
 * - "daily": always shown
 * - "weekly": always shown (user completes once per week)
 * - "weekdays": only shown Mon-Fri
 */
export function shouldShowHabitToday(frequency: string): boolean {
  if (frequency === "daily" || frequency === "weekly") return true
  if (frequency === "weekdays") {
    const day = new Date().getDay()
    return day !== 0 && day !== 6 // Not Sunday or Saturday
  }
  return true
}

/**
 * Get the start of the current week (Monday) as a Date object.
 * Uses the `new Date(year, month, day)` constructor to avoid
 * the mutation bug pattern of `new Date(d.setDate(diff))`.
 */
export function getWeekStartDate(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(d.getFullYear(), d.getMonth(), diff)
  start.setHours(0, 0, 0, 0)
  return start
}

/**
 * Get the start of the current week (Monday) as a YYYY-MM-DD string.
 */
export function getWeekStart(): string {
  return getWeekStartDate().toISOString().split("T")[0]
}

/**
 * Get the Monday of the week containing the given date, as a YYYY-MM-DD string.
 * Uses proper date construction to avoid mutation bugs.
 */
function getWeekStartForDate(d: Date): string {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.getFullYear(), d.getMonth(), diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split("T")[0]
}

/**
 * Check if a weekly habit has been completed this week.
 */
export function isWeeklyHabitCompletedThisWeek(
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

/**
 * Calculate streak for a habit, respecting its frequency.
 * - Daily/Weekday: count consecutive days with completions
 * - Weekly: count consecutive weeks with at least one completion
 */
export function calculateHabitStreak(
  habit: { id: string; frequency: string },
  habitLogs: { habitId: string; date: string; completed: boolean }[]
): number {
  const logsForHabit = habitLogs.filter(
    (l) => l.habitId === habit.id && l.completed
  )

  if (habit.frequency === "weekly") {
    // Count consecutive weeks with completions
    const completedWeeks = new Set<string>()
    for (const log of logsForHabit) {
      completedWeeks.add(getWeekStartForDate(new Date(log.date)))
    }

    let streak = 0
    const checkMonday = getWeekStartDate()

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
