"use client"

import { useMemo } from "react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"

export function HabitCompletionChart() {
  const { habits, habitLogs, settings } = useAppStore()
  const lang = settings.language

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], [])
  const activeHabits = useMemo(() => habits.filter((h) => !h.deletedAt), [habits])
  const completedToday = useMemo(
    () =>
      activeHabits.filter((habit) =>
        habitLogs.some((l) => l.habitId === habit.id && l.date === todayStr && l.completed)
      ).length,
    [activeHabits, habitLogs, todayStr]
  )
  const remaining = activeHabits.length - completedToday

  const data = useMemo(
    () =>
      [
        { name: lang === "ar" ? "مكتمل" : "Done", value: completedToday, color: "#10b981" },
        { name: lang === "ar" ? "متبقي" : "Remaining", value: Math.max(remaining, 0), color: "var(--muted)" },
      ].filter((d) => d.value > 0),
    [completedToday, remaining, lang]
  )

  const percentage = activeHabits.length > 0
    ? Math.round((completedToday / activeHabits.length) * 100)
    : 0

  if (activeHabits.length === 0) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm">
      <h3 className="mb-3 text-base font-bold text-foreground">
        {t("todayHabitsChart", lang)}
      </h3>
      <div className="flex items-center gap-4">
        <div className="relative size-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={50}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold text-foreground">{percentage}%</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-muted-foreground">
              {completedToday} {lang === "ar" ? "مكتملة" : "completed"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-muted" />
            <span className="text-sm text-muted-foreground">
              {remaining} {lang === "ar" ? "متبقية" : "remaining"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {completedToday}/{activeHabits.length} {lang === "ar" ? "عادات" : "habits"}
          </p>
        </div>
      </div>
    </div>
  )
}
