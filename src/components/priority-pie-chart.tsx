"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { PieChart as PieChartIcon } from "lucide-react"
import { AnimatedEmptyState } from "@/components/animated-empty-state"

const PRIORITY_COLORS: Record<string, string> = {
  high: "#f43f5e",   // rose-500
  medium: "#f59e0b", // amber-500
  low: "#10b981",    // emerald-500
}

function PriorityPieChartInner() {
  const { todos, settings } = useAppStore()
  const lang = settings.language

  const activeTodos = useMemo(
    () => todos.filter((todo) => !todo.deletedAt),
    [todos]
  )

  const data = useMemo(() => {
    const counts: Record<string, number> = { high: 0, medium: 0, low: 0 }
    for (const todo of activeTodos) {
      counts[todo.priority] = (counts[todo.priority] || 0) + 1
    }
    return [
      { name: t("high", lang), value: counts.high, key: "high" },
      { name: t("medium", lang), value: counts.medium, key: "medium" },
      { name: t("low", lang), value: counts.low, key: "low" },
    ].filter((d) => d.value > 0)
  }, [activeTodos, lang])

  const total = activeTodos.length

  // Empty state
  if (activeTodos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm"
      >
        <h3 className="mb-4 text-base font-bold text-foreground">
          {t("priorityDistribution", lang)}
        </h3>
        <AnimatedEmptyState
          icon={PieChartIcon}
          title={t("noDataYet", lang)}
          description={t("noTasksDesc", lang)}
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm"
    >
      <h3 className="mb-4 text-base font-bold text-foreground">
        {t("priorityDistribution", lang)}
      </h3>

      <div className="relative flex items-center justify-center">
        <div className="relative size-48 sm:size-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={PRIORITY_COLORS[entry.key] || PRIORITY_COLORS.medium}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                formatter={(value: number, name: string) => [value, name]}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center total count */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-foreground">{total}</span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {t("totalTasks", lang)}
            </span>
          </div>
        </div>
      </div>

      {/* Custom legend with color dots */}
      <div className="mt-4 flex items-center justify-center gap-5">
        {data.map((entry) => (
          <div key={entry.key} className="flex items-center gap-1.5">
            <div
              className="size-2.5 rounded-full"
              style={{ backgroundColor: PRIORITY_COLORS[entry.key] }}
            />
            <span className="text-xs text-muted-foreground">
              {entry.name} ({entry.value})
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// Wrap with dynamic import to avoid SSR issues with recharts
export const PriorityPieChart = dynamic(
  () => Promise.resolve(PriorityPieChartInner),
  { ssr: false }
)
