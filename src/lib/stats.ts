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
