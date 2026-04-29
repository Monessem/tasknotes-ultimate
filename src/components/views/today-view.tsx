"use client"

import { useCallback, useMemo } from "react"
import {
  CalendarDays,
  Circle,
  CheckCircle2,
  Star,
  Flag,
  Tag,
  Clock,
  Flame,
  X,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { audioManager } from "@/lib/audio"
import { logHistory } from "@/lib/history-log"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AnimatedEmptyState } from "@/components/animated-empty-state"
import { calculateHabitStreak } from "@/lib/stats"

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

  // Day progress
  const dayProgress = useMemo(() => {
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const elapsed = now.getTime() - startOfDay.getTime()
    const totalDay = 24 * 60 * 60 * 1000
    return Math.round((elapsed / totalDay) * 100)
  }, [])

  // Completion summary
  const totalToday = filteredTodos.length + activeHabits.length
  const completedCount = todayCompletedHabits.length
  const completionPct = totalToday > 0 ? Math.round((completedCount / totalToday) * 100) : 0

  const encouragementMessage = useMemo(() => {
    if (completionPct === 100) return t("perfectDay", lang)
    if (completionPct >= 70) return t("almostThere", lang)
    if (completionPct >= 30) return t("greatProgress", lang)
    return t("keepGoing", lang)
  }, [completionPct, lang])

  const toggleComplete = useCallback(
    async (todoId: string, completed: boolean, todoTitle: string) => {
      try {
        const res = await fetch(`/api/todos/${todoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            completed: !completed,
            completedAt: !completed ? new Date().toISOString() : null,
          }),
        })
        if (res.ok) {
          if (!completed) {
            audioManager.play("complete")
            await logHistory("complete", "task", todoId, todoTitle)
          } else {
            audioManager.play("click")
            await logHistory("update", "task", todoId, todoTitle)
          }
          await fetchTodos()
        }
      } catch (err) {
        console.error("Failed to toggle todo completion:", err)
      }
    },
    [fetchTodos]
  )

  const deleteTodo = useCallback(
    async (todoId: string, todoTitle: string) => {
      try {
        const res = await fetch(`/api/todos/${todoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deletedAt: new Date().toISOString() }),
        })
        if (res.ok) {
          audioManager.play("delete")
          await logHistory("delete", "task", todoId, todoTitle)
          await fetchTodos()
        }
      } catch (err) {
        console.error("Failed to delete todo:", err)
      }
    },
    [fetchTodos]
  )

  const toggleHabitLog = useCallback(
    async (habitId: string, habitName: string) => {
      try {
        const res = await fetch("/api/habit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habitId, date: todayStr }),
        })
        if (res.ok) {
          audioManager.play("complete")
          await logHistory("complete", "habit", habitId, habitName)
        }
        await fetchHabitLogs()
      } catch (err) {
        console.error("Failed to toggle habit log:", err)
      }
    },
    [fetchHabitLogs, todayStr]
  )

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return dueDate.split("T")[0] < todayStr
  }

  const priorityBorderColors: Record<string, string> = {
    high: "border-l-rose-500",
    medium: "border-l-amber-500",
    low: "border-l-emerald-500",
  }

  const priorityColors: Record<string, string> = {
    high: "bg-rose-500",
    medium: "bg-amber-500",
    low: "bg-emerald-500",
  }



  return (
    <div className="space-y-5">
      {/* Day Progress Bar */}
      <Card className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t("dayProgress", lang)}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {dayProgress}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000"
              style={{ width: `${dayProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Today's Completion Summary Card */}
      {totalToday > 0 && (
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Circular progress ring */}
              <div className="relative flex size-14 shrink-0 items-center justify-center">
                <svg className="size-14 -rotate-90" viewBox="0 0 56 56">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted/30"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(completionPct / 100) * 150.8} 150.8`}
                    className="transition-all duration-700"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {completionPct}%
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground">
                  {t("todaysSummary", lang)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {completedCount}/{totalToday} {lang === "ar" ? "مكتمل" : "completed"}
                </p>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                  {encouragementMessage}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <div className="space-y-2">
            {filteredTodos.map((todo) => {
              const subtasksCompleted = todo.subtasks?.filter((s) => s.completed).length ?? 0
              const subtasksTotal = todo.subtasks?.length ?? 0
              const subtaskPct = subtasksTotal > 0 ? Math.round((subtasksCompleted / subtasksTotal) * 100) : 0

              return (
                <Card
                  key={todo.id}
                  className={cn(
                    "group cursor-pointer rounded-2xl bg-card/80 backdrop-blur-sm border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                    `border-l-[3px] ${priorityBorderColors[todo.priority] || "border-l-emerald-500"}`,
                    isOverdue(todo.dueDate)
                      ? "border-t-rose-200/50 border-r-rose-200/50 border-b-rose-200/50 dark:border-t-rose-800/30 dark:border-r-rose-800/30 dark:border-b-rose-800/30"
                      : "border-border/50"
                  )}
                  onClick={() => {
                    setEditingItem(todo)
                    setActiveModal("editTodo")
                  }}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleComplete(todo.id, todo.completed, todo.title)
                      }}
                      className="mt-0.5 shrink-0"
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
                            className="h-4 shrink-0 border-rose-300 px-1 text-[9px] text-rose-600 dark:border-rose-700 dark:text-rose-400"
                          >
                            {lang === "ar" ? "متأخر" : "Overdue"}
                          </Badge>
                        )}
                        {todo.important && (
                          <Star className="size-3 shrink-0 text-amber-500" />
                        )}
                        {todo.flagged && (
                          <Flag className="size-3 shrink-0 text-rose-500" />
                        )}
                      </div>
                      {todo.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {todo.description.slice(0, 80)}{todo.description.length > 80 ? "..." : ""}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div
                            className={cn(
                              "size-1.5 rounded-full",
                              priorityColors[todo.priority]
                            )}
                          />
                          <span className="text-[10px] capitalize text-muted-foreground">
                            {t(todo.priority, lang)}
                          </span>
                        </div>
                        {todo.dueDate && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Clock className="size-2.5" />
                            {new Date(todo.dueDate).toLocaleDateString(
                              lang === "ar" ? "ar-SA" : "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </span>
                        )}
                        {subtasksTotal > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">
                              {subtasksCompleted}/{subtasksTotal}
                            </span>
                            <div className="h-1 w-10 rounded-full bg-muted/50 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${subtaskPct}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {todo.tags?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="size-2.5 text-muted-foreground/50" />
                            {todo.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="h-4 border-0 px-1 text-[8px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {todo.tags.length > 2 && (
                              <span className="text-[8px] text-muted-foreground">
                                +{todo.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTodo(todo.id, todo.title)
                      }}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
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
          <div className="space-y-2">
            {activeHabits.map((habit) => {
              const completed = habitLogs.some(
                (l) => l.habitId === habit.id && l.date === todayStr && l.completed
              )
              const streak = calculateHabitStreak(habit, habitLogs)

              return (
                <Card
                  key={habit.id}
                  className={cn(
                    "group cursor-pointer rounded-2xl bg-card/80 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden",
                    completed
                      ? "border border-emerald-200/60 shadow-[0_0_12px_rgba(16,185,129,0.15)] dark:border-emerald-800/40 dark:shadow-[0_0_12px_rgba(16,185,129,0.08)]"
                      : "border-2 border-dashed border-muted-foreground/20 hover:border-emerald-300/50"
                  )}
                  onClick={() => {
                    setEditingItem(habit)
                    setActiveModal("editHabit")
                  }}
                >
                  {/* Color accent bar */}
                  <div
                    className="h-1 w-full"
                    style={{ backgroundColor: habit.color || "#10b981" }}
                  />
                  <CardContent className="flex items-center gap-3 p-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleHabitLog(habit.id, habit.name)
                      }}
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl transition-all text-base",
                        completed
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "border-2 border-dashed border-muted-foreground/30 text-muted-foreground/50 hover:border-emerald-500/50"
                      )}
                    >
                      {habit.icon ? (
                        <span className="text-sm leading-none">{habit.icon}</span>
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm font-medium",
                          completed
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        )}
                      >
                        {habit.name}
                      </span>
                      {streak > 0 && (
                        <div className="mt-0.5 flex items-center gap-1">
                          <Flame className="size-3 text-amber-500" />
                          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                            {streak} {t("daysStreak", lang)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalToday === 0 && (
        <AnimatedEmptyState
          icon={CalendarDays}
          title={lang === "ar" ? "لا شيء لليوم" : "Nothing for today"}
          description={lang === "ar" ? "استمتع بيومك!" : "Enjoy your day!"}
        />
      )}
    </div>
  )
}
