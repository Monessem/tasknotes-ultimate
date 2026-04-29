"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { getWeeklyStats } from "@/lib/stats"

export function WeeklyTaskChart() {
  const { todos, settings } = useAppStore()
  const lang = settings.language

  const data = useMemo(() => getWeeklyStats(todos, lang), [todos, lang])

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm">
      <h3 className="mb-4 text-base font-bold text-foreground">
        {t("weeklyActivity", lang)}
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey={lang === "ar" ? "dayAr" : "day"}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
            />
            <Bar
              dataKey="completed"
              name={lang === "ar" ? "مكتملة" : "Completed"}
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="created"
              name={lang === "ar" ? "جديدة" : "Created"}
              fill="#14b8a6"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              opacity={0.6}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
