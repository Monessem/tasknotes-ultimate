"use client"

import { useCallback } from "react"
import {
  CalendarDays,
  Circle,
  CheckCircle2,
  Star,
  Flag,
  Tag,
  ChevronRight,
  Clock,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function TodayView() {
  const { todos, habits, habitLogs, setEditingItem, setActiveModal, fetchTodos, fetchHabitLogs } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language
  const searchQuery = useAppStore((s) => s.searchQuery)

  const todayStr = new Date().toISOString().split("T")[0]

  // Today's tasks: due today or overdue
  const todayTodos = todos.filter((todo) => {
    if (todo.deletedAt || todo.completed) return false
    if (!todo.dueDate) return false
    return todo.dueDate.split("T")[0] <= todayStr
  })

  // Apply search
  const filteredTodos = searchQuery
    ? todayTodos.filter(
        (todo) =>
          todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          todo.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : todayTodos

  // Today's habits
  const activeHabits = habits.filter((h) => !h.deletedAt)
  const todayCompletedHabits = activeHabits.filter((habit) =>
    habitLogs.some(
      (log) => log.habitId === habit.id && log.date === todayStr && log.completed
    )
  )

  const toggleComplete = useCallback(
    async (todoId: string, completed: boolean) => {
      try {
        await fetch(`/api/todos/${todoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            completed: !completed,
            completedAt: !completed ? new Date().toISOString() : null,
          }),
        })
        await fetchTodos()
      } catch {
        // Silently fail
      }
    },
    [fetchTodos]
  )

  const toggleHabitLog = useCallback(
    async (habitId: string) => {
      try {
        await fetch("/api/habit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habitId, date: todayStr }),
        })
        await fetchHabitLogs()
      } catch {
        // Silently fail
      }
    },
    [fetchHabitLogs, todayStr]
  )

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return dueDate.split("T")[0] < todayStr
  }

  const priorityColors: Record<string, string> = {
    high: "bg-rose-500",
    medium: "bg-amber-500",
    low: "bg-emerald-500",
  }

  const totalToday = filteredTodos.length + activeHabits.length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
          >
            {totalToday} {lang === "ar" ? "عنصر" : "items"}
          </Badge>
        </div>
      </div>

      {/* Today's Tasks */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
          <CalendarDays className="size-4 text-emerald-500" />
          {t("todos", lang)}
          <Badge
            variant="outline"
            className="h-5 border-0 px-1.5 text-[10px]"
          >
            {filteredTodos.length}
          </Badge>
        </h3>

        {filteredTodos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 py-6 text-center">
            <CheckCircle2 className="mx-auto mb-1.5 size-5 text-emerald-500" />
            <p className="text-xs text-muted-foreground">
              {lang === "ar"
                ? "لا توجد مهام لليوم"
                : "No tasks due today"}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredTodos.map((todo) => (
              <Card
                key={todo.id}
                className={cn(
                  "group cursor-pointer rounded-xl border bg-card/80 backdrop-blur-sm transition-all hover:shadow-md",
                  isOverdue(todo.dueDate)
                    ? "border-rose-200/50 dark:border-rose-800/30"
                    : "border-border/30"
                )}
                onClick={() => {
                  setEditingItem(todo)
                  setActiveModal("editTodo")
                }}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleComplete(todo.id, todo.completed)
                    }}
                    className="shrink-0"
                  >
                    <Circle
                      className={cn(
                        "size-5 transition-colors hover:text-emerald-500",
                        todo.priority === "high" && "text-rose-400",
                        todo.priority === "medium" && "text-amber-400",
                        todo.priority === "low" && "text-emerald-400"
                      )}
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {todo.title}
                      </span>
                      {isOverdue(todo.dueDate) && (
                        <Badge
                          variant="outline"
                          className="h-4 border-rose-300 px-1 text-[9px] text-rose-600 dark:border-rose-700 dark:text-rose-400"
                        >
                          {lang === "ar" ? "متأخر" : "Overdue"}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <div
                        className={cn(
                          "size-1.5 rounded-full",
                          priorityColors[todo.priority]
                        )}
                      />
                      <span className="text-[10px] capitalize text-muted-foreground">
                        {t(todo.priority, lang)}
                      </span>
                      {todo.important && (
                        <Star className="size-3 text-amber-500" />
                      )}
                      {todo.flagged && (
                        <Flag className="size-3 text-rose-500" />
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/30" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Today's Habits */}
      {activeHabits.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
            <Clock className="size-4 text-rose-500" />
            {t("habits", lang)}
            <Badge
              variant="outline"
              className="h-5 border-0 px-1.5 text-[10px]"
            >
              {todayCompletedHabits.length}/{activeHabits.length}
            </Badge>
          </h3>
          <div className="space-y-1.5">
            {activeHabits.map((habit) => {
              const completed = habitLogs.some(
                (l) => l.habitId === habit.id && l.date === todayStr && l.completed
              )
              return (
                <Card
                  key={habit.id}
                  className="group cursor-pointer rounded-xl border border-border/30 bg-card/80 backdrop-blur-sm transition-all hover:shadow-md"
                  onClick={() => {
                    setEditingItem(habit)
                    setActiveModal("editHabit")
                  }}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleHabitLog(habit.id)
                      }}
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg transition-all",
                        completed
                          ? "bg-emerald-500 text-white"
                          : "border-2 border-dashed border-muted-foreground/30 text-muted-foreground/50 hover:border-emerald-500/50"
                      )}
                    >
                      <CheckCircle2 className="size-4" />
                    </button>
                    <span
                      className={cn(
                        "flex-1 truncate text-sm font-medium",
                        completed
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      )}
                    >
                      {habit.name}
                    </span>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalToday === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <CalendarDays className="size-7 text-emerald-500" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            {lang === "ar" ? "لا شيء لليوم" : "Nothing for today"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === "ar"
              ? "استمتع بيومك!"
              : "Enjoy your day!"}
          </p>
        </div>
      )}
    </div>
  )
}
