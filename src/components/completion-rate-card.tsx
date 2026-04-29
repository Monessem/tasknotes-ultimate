"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"

function CompletionRateCardInner() {
  const { todos, settings } = useAppStore()
  const lang = settings.language

  // Calculate this week's completion rate
  const { completedCount, totalCount, percentage } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get Monday of current week
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)
    const mondayStr = monday.toISOString().split("T")[0]

    // Count tasks due or created this week
    const thisWeekTodos = todos.filter((todo) => {
      if (todo.deletedAt) return false
      // Include tasks due this week or completed this week
      if (todo.dueDate && todo.dueDate >= mondayStr) return true
      if (todo.completedAt && todo.completedAt >= mondayStr) return true
      if (todo.createdAt >= mondayStr) return true
      return false
    })

    const completed = thisWeekTodos.filter((todo) => todo.completed).length
    const total = thisWeekTodos.length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0

    return { completedCount: completed, totalCount: total, percentage: pct }
  }, [todos])

  // SVG circular progress ring parameters
  const radius = 58
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - percentage / 100)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm"
    >
      <h3 className="mb-3 text-base font-bold text-foreground">
        {t("completionRateWeek", lang)}
      </h3>

      <div className="flex flex-col items-center">
        {/* Circular progress ring */}
        <div className="relative mb-3">
          <svg width="140" height="140" viewBox="0 0 140 140" className="drop-shadow-sm">
            {/* Background ring */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-muted/30"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="completionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            {/* Progress ring */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="url(#completionGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 70 70)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              {percentage}%
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("completed", lang).toLowerCase()}
            </span>
          </div>
        </div>

        {/* Summary text */}
        <p className="text-center text-xs text-muted-foreground">
          <span className="font-bold text-foreground">{completedCount}</span>
          {" "}{t("of", lang)}{" "}
          <span className="font-bold text-foreground">{totalCount}</span>{" "}
          {t("tasksCompletedWeekShort", lang)}
        </p>
      </div>
    </motion.div>
  )
}

export const CompletionRateCard = dynamic(
  () => Promise.resolve(CompletionRateCardInner),
  { ssr: false }
)
