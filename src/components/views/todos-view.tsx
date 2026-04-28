"use client"

import { useCallback } from "react"
import {
  CheckSquare,
  Plus,
  Star,
  Flag,
  Calendar,
  Circle,
  CheckCircle2,
  ChevronRight,
  Tag,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function TodosView() {
  const { todos, setEditingItem, setActiveModal, fetchTodos } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language
  const searchQuery = useAppStore((s) => s.searchQuery)

  const activeTodos = todos.filter((todo) => !todo.deletedAt)

  // Filter by search
  const filteredTodos = searchQuery
    ? activeTodos.filter(
        (todo) =>
          todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          todo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          todo.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : activeTodos

  // Sort: incomplete first, then by priority, then by date
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    if (a.priority !== b.priority)
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const toggleComplete = useCallback(
    async (todoId: string, completed: boolean) => {
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
          await fetchTodos()
        }
      } catch {
        // Silently fail
      }
    },
    [fetchTodos]
  )

  const priorityColors: Record<string, string> = {
    high: "bg-rose-500",
    medium: "bg-amber-500",
    low: "bg-emerald-500",
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const today = new Date().toISOString().split("T")[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]
    const dateOnly = dateStr.split("T")[0]

    if (dateOnly === today) return lang === "ar" ? "اليوم" : "Today"
    if (dateOnly === tomorrow) return lang === "ar" ? "غداً" : "Tomorrow"
    return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const incompleteTodos = sortedTodos.filter((t) => !t.completed)
  const completedTodos = sortedTodos.filter((t) => t.completed)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge
          variant="secondary"
          className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
        >
          {incompleteTodos.length} {t("remaining", lang)}
        </Badge>
        <Button
          size="sm"
          onClick={() => setActiveModal("addTodo")}
          className="gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
        >
          <Plus className="size-3.5" />
          {t("newTask", lang)}
        </Button>
      </div>

      {/* Incomplete tasks */}
      {incompleteTodos.length > 0 && (
        <div className="space-y-1.5">
          {incompleteTodos.map((todo) => (
            <Card
              key={todo.id}
              className="group cursor-pointer rounded-xl border border-border/30 bg-card/80 backdrop-blur-sm transition-all hover:shadow-md"
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
                    {todo.important && (
                      <Star className="size-3.5 shrink-0 text-amber-500" />
                    )}
                    {todo.flagged && (
                      <Flag className="size-3.5 shrink-0 text-rose-500" />
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
                    {todo.dueDate && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Calendar className="size-2.5" />
                        {formatDate(todo.dueDate)}
                      </span>
                    )}
                    {todo.tags.length > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Tag className="size-2.5" />
                        {todo.tags.slice(0, 2).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/30" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed tasks */}
      {completedTodos.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span className="text-xs font-semibold text-muted-foreground">
              {t("completed", lang)} ({completedTodos.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {completedTodos.map((todo) => (
              <Card
                key={todo.id}
                className="group cursor-pointer rounded-xl border border-border/20 bg-muted/30 transition-all hover:bg-muted/50"
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
                    <CheckCircle2 className="size-5 text-emerald-500" />
                  </button>
                  <span className="flex-1 truncate text-sm text-muted-foreground line-through">
                    {todo.title}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredTodos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <CheckSquare className="size-7 text-emerald-500" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            {t("noTasks", lang)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("noTasksDesc", lang)}
          </p>
        </div>
      )}
    </div>
  )
}
