"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { CalendarDays } from "lucide-react"
import { AnimatedEmptyState } from "@/components/animated-empty-state"

interface DayCell {
  date: string // YYYY-MM-DD
  count: number
  dayOfWeek: number // 0=Sun ... 6=Sat
  weekIndex: number
}

interface TooltipInfo {
  date: string
  count: number
  x: number
  y: number
}

function ActivityHeatmapInner() {
  const { habits, habitLogs, todos, pomodoroSessions, settings } = useAppStore()
  const lang = settings.language
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)

  const activeHabits = useMemo(
    () => habits.filter((h) => !h.deletedAt),
    [habits]
  )

  // Build heatmap data for last 365 days (52 weeks)
  const { cells, monthLabels } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Go back 364 days to get 365 total days (including today)
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 364)

    // Adjust to start on Sunday
    const startDay = startDate.getDay()
    if (startDay !== 0) {
      startDate.setDate(startDate.getDate() - startDay)
    }

    // Count completions per date from 3 data sources:
    // 1. Habit logs (completed habits)
    const countMap: Record<string, number> = {}
    for (const log of habitLogs) {
      if (log.completed) {
        countMap[log.date] = (countMap[log.date] || 0) + 1
      }
    }

    // 2. Completed todos (by completedAt date)
    for (const todo of todos) {
      if (todo.completed && !todo.deletedAt && todo.completedAt) {
        const dateStr = todo.completedAt.split("T")[0]
        if (dateStr) {
          countMap[dateStr] = (countMap[dateStr] || 0) + 1
        }
      }
    }

    // 3. Pomodoro sessions (by date)
    for (const session of pomodoroSessions) {
      countMap[session.date] = (countMap[session.date] || 0) + 1
    }

    const result: DayCell[] = []
    const monthLabelMap: Record<number, string> = {}

    const current = new Date(startDate)
    let weekIndex = 0

    while (current <= today || current.getDay() !== 0) {
      const dateStr = current.toISOString().split("T")[0]
      const dayOfWeek = current.getDay()

      // Track month labels — first day of a month or first column of a new month
      if (dayOfWeek === 0) {
        const monthName = current.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
          month: "short",
        })
        monthLabelMap[weekIndex] = monthName
      }

      // Only include if within the 365-day window or up to today
      if (current <= today) {
        result.push({
          date: dateStr,
          count: countMap[dateStr] || 0,
          dayOfWeek,
          weekIndex,
        })
      } else {
        // Future days — add with -1 count for grid alignment
        result.push({
          date: dateStr,
          count: -1,
          dayOfWeek,
          weekIndex,
        })
      }

      // Move to next day
      current.setDate(current.getDate() + 1)
      if (current.getDay() === 0) weekIndex++
    }

    // Deduplicate month labels: only show when month changes
    const monthKeys = Object.keys(monthLabelMap).map(Number).sort((a, b) => a - b)
    const filteredMonthLabels: Record<number, string> = {}
    let lastMonth = ""
    for (const key of monthKeys) {
      if (monthLabelMap[key] !== lastMonth) {
        filteredMonthLabels[key] = monthLabelMap[key]
        lastMonth = monthLabelMap[key]
      }
    }

    return { cells: result, monthLabels: filteredMonthLabels }
  }, [habitLogs, todos, pomodoroSessions, lang])

  // Total weeks
  const totalWeeks = useMemo(() => {
    if (cells.length === 0) return 0
    return cells[cells.length - 1].weekIndex + 1
  }, [cells])

  // Organize cells into a grid: 7 rows x N columns
  const grid = useMemo(() => {
    const g: (DayCell | null)[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: totalWeeks }, () => null)
    )
    for (const cell of cells) {
      if (cell.weekIndex < totalWeeks) {
        g[cell.dayOfWeek][cell.weekIndex] = cell
      }
    }
    return g
  }, [cells, totalWeeks])

  const getCellColorClass = (count: number): string => {
    if (count === -1) return ""
    if (count === 0) return "bg-muted/30"
    if (count === 1) return "bg-emerald-200 dark:bg-emerald-900"
    if (count === 2) return "bg-emerald-300 dark:bg-emerald-700"
    if (count <= 4) return "bg-emerald-400 dark:bg-emerald-600"
    return "bg-emerald-500 dark:bg-emerald-500"
  }

  const dayLabels = [t("sun", lang), t("mon", lang), t("tue", lang), t("wed", lang), t("thu", lang), t("fri", lang), t("sat", lang)]
  // Show only Mon, Wed, Fri for labels to avoid clutter
  const showDayLabel = (day: number) => day === 1 || day === 3 || day === 5

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  // Empty state
  if (activeHabits.length === 0 && todos.length === 0 && pomodoroSessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm"
      >
        <h3 className="mb-4 text-base font-bold text-foreground">
          {t("activityThisYear", lang)}
        </h3>
        <AnimatedEmptyState
          icon={CalendarDays}
          title={t("noDataYet", lang)}
          description={t("noHabitsDesc", lang)}
        />
      </motion.div>
    )
  }

  const cellSize = 12
  const cellGap = 2

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm"
    >
      <h3 className="mb-4 text-base font-bold text-foreground">
        {t("activityThisYear", lang)}
      </h3>

      <div className="overflow-x-auto">
        {/* Month labels */}
        <div className="mb-1 flex" style={{ paddingLeft: `${showDayLabel(0) ? 32 : 0}px` }}>
          {Array.from({ length: totalWeeks }, (_, weekIdx) => (
            <div
              key={weekIdx}
              style={{
                width: cellSize + cellGap,
                fontSize: 9,
                textAlign: "left",
                color: "var(--muted-foreground)",
                whiteSpace: "nowrap",
              }}
            >
              {monthLabels[weekIdx] || ""}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex">
          {/* Day labels column */}
          <div className="shrink-0" style={{ width: 32 }}>
            {Array.from({ length: 7 }, (_, dayIdx) => (
              <div
                key={dayIdx}
                style={{
                  height: cellSize + cellGap,
                  fontSize: 9,
                  lineHeight: `${cellSize + cellGap}px`,
                  color: "var(--muted-foreground)",
                  textAlign: "right",
                  paddingRight: 4,
                  whiteSpace: "nowrap",
                }}
              >
                {showDayLabel(dayIdx) ? dayLabels[dayIdx] : ""}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="relative">
            {grid.map((row, dayIdx) => (
              <div key={dayIdx} className="flex">
                {row.map((cell, weekIdx) => {
                  if (!cell || cell.count === -1) {
                    return (
                      <div
                        key={weekIdx}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          marginRight: cellGap,
                          marginBottom: cellGap,
                          borderRadius: 2,
                        }}
                      />
                    )
                  }

                  return (
                    <div
                      key={weekIdx}
                      className={`rounded-[2px] transition-colors duration-200 ${getCellColorClass(cell.count)}`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        marginRight: cellGap,
                        marginBottom: cellGap,
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const parentRect = e.currentTarget.closest(".relative")?.getBoundingClientRect()
                        setTooltip({
                          date: cell.date,
                          count: cell.count,
                          x: rect.left - (parentRect?.left || 0),
                          y: rect.top - (parentRect?.top || 0),
                        })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  )
                })}
              </div>
            ))}

            {/* Tooltip */}
            {tooltip && (
              <div
                className="pointer-events-none absolute z-10 rounded-lg border border-border/50 bg-card px-3 py-1.5 text-xs shadow-lg"
                style={{
                  left: tooltip.x - 50,
                  top: tooltip.y - 48,
                  transform: "translateX(50%)",
                }}
              >
                <p className="font-semibold text-foreground">
                  {formatDate(tooltip.date)}
                </p>
                <p className="text-muted-foreground">
                  {tooltip.count} {t("completed", lang).toLowerCase()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-end gap-2">
          <span className="text-[10px] text-muted-foreground">Less</span>
          <div className="flex items-center gap-1">
            <div className="size-3 rounded-[2px] bg-muted/30" />
            <div className="size-3 rounded-[2px] bg-emerald-200 dark:bg-emerald-900" />
            <div className="size-3 rounded-[2px] bg-emerald-300 dark:bg-emerald-700" />
            <div className="size-3 rounded-[2px] bg-emerald-400 dark:bg-emerald-600" />
            <div className="size-3 rounded-[2px] bg-emerald-500 dark:bg-emerald-500" />
          </div>
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </div>
    </motion.div>
  )
}

// Wrap with dynamic import to avoid SSR issues
export const ActivityHeatmap = dynamic(
  () => Promise.resolve(ActivityHeatmapInner),
  { ssr: false }
)
