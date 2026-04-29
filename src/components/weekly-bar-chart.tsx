"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"

interface DayData {
  label: string
  count: number
  isToday: boolean
  dateStr: string
}

function WeeklyBarChartInner() {
  const { todos, settings } = useAppStore()
  const lang = settings.language

  // Get the current week data (Mon-Sun)
  const weekData = useMemo((): DayData[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split("T")[0]

    // Get Monday of current week
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)

    const dayLabels = ["M", "T", "W", "T", "F", "S", "S"]
    const data: DayData[] = []

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateStr = d.toISOString().split("T")[0]

      // Count completed tasks for this date
      const completedCount = todos.filter(
        (todo) => todo.completed && !todo.deletedAt && todo.completedAt && todo.completedAt.startsWith(dateStr)
      ).length

      data.push({
        label: dayLabels[i],
        count: completedCount,
        isToday: dateStr === todayStr,
        dateStr,
      })
    }

    return data
  }, [todos])

  const maxCount = useMemo(() => {
    const max = Math.max(...weekData.map((d) => d.count), 1)
    return max
  }, [weekData])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm"
    >
      <h3 className="mb-4 text-base font-bold text-foreground">
        {t("thisWeeksProgress", lang)}
      </h3>

      <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
        {weekData.map((day, index) => {
          const barHeight = maxCount > 0 ? Math.max((day.count / maxCount) * 120, 4) : 4
          return (
            <div key={index} className="flex flex-1 flex-col items-center gap-1">
              {/* Count above bar */}
              <span className={`text-xs font-bold ${day.isToday ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                {day.count}
              </span>
              {/* Bar */}
              <div className="relative w-full flex justify-center" style={{ height: 130 }}>
                <div
                  className={`w-full max-w-[36px] rounded-t-lg transition-all duration-500 ease-out ${
                    day.isToday
                      ? "bg-gradient-to-t from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30"
                      : "bg-gradient-to-t from-emerald-400/60 to-teal-500/60"
                  }`}
                  style={{
                    height: barHeight,
                    marginTop: "auto",
                  }}
                />
              </div>
              {/* Day label */}
              <span className={`text-[11px] font-semibold ${
                day.isToday ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              }`}>
                {day.label}
              </span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

export const WeeklyBarChart = dynamic(
  () => Promise.resolve(WeeklyBarChartInner),
  { ssr: false }
)
