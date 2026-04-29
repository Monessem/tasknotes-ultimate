"use client"

import { useCallback, useState, useMemo } from "react"
import {
  CheckSquare,
  Plus,
  Star,
  Flag,
  Calendar,
  Circle,
  CheckCircle2,
  Tag,
  X,
  LayoutList,
  LayoutGrid,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { audioManager } from "@/lib/audio"
import { logHistory } from "@/lib/history-log"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

type PriorityFilter = "all" | "high" | "medium" | "low"
type SortBy = "dateCreated" | "dueDate" | "priority" | "name"
type ViewMode = "list" | "grid"

export function TodosView() {
  const { todos, setEditingItem, setActiveModal, fetchTodos } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language
  const searchQuery = useAppStore((s) => s.searchQuery)

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all")
  const [sortBy, setSortBy] = useState<SortBy>("dateCreated")
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  const priorityColors: Record<string, string> = {
    high: "bg-rose-500",
    medium: "bg-amber-500",
    low: "bg-emerald-500",
  }

  const priorityBorderColors: Record<string, string> = {
    high: "hover:border-l-rose-500 hover:border-l-[3px]",
    medium: "hover:border-l-amber-500 hover:border-l-[3px]",
    low: "hover:border-l-emerald-500 hover:border-l-[3px]",
  }

  const priorityAccentColors: Record<string, string> = {
    high: "bg-rose-500",
    medium: "bg-amber-500",
    low: "bg-emerald-500",
  }

  const activeTodos = todos.filter((todo) => !todo.deletedAt)

  // Filter by search
  const searchFiltered = searchQuery
    ? activeTodos.filter(
        (todo) =>
          todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          todo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          todo.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : activeTodos

  // Filter by priority
  const priorityFiltered =
    priorityFilter === "all"
      ? searchFiltered
      : searchFiltered.filter((todo) => todo.priority === priorityFilter)

  // Sort
  const sortedTodos = useMemo(() => {
    return [...priorityFiltered].sort((a, b) => {
      // Incomplete first always
      if (a.completed !== b.completed) return a.completed ? 1 : -1

      switch (sortBy) {
        case "priority": {
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          if (a.priority !== b.priority)
            return priorityOrder[a.priority] - priorityOrder[b.priority]
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        case "dueDate": {
          // No due date goes last
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        case "name":
          return a.title.localeCompare(b.title, lang === "ar" ? "ar" : "en")
        case "dateCreated":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
  }, [priorityFiltered, sortBy, lang])

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
          if (!completed) {
            audioManager.play("complete")
            logHistory("complete", "task", todoId, todos.find((t) => t.id === todoId)?.title || "")
          } else {
            audioManager.play("click")
          }
          await fetchTodos()
        }
      } catch {
        // Silently fail
      }
    },
    [fetchTodos, todos]
  )

  const handleDelete = useCallback(
    async (todoId: string, todoTitle: string) => {
      try {
        const res = await fetch(`/api/todos/${todoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deletedAt: new Date().toISOString() }),
        })
        if (res.ok) {
          audioManager.play("delete")
          logHistory("delete", "task", todoId, todoTitle)
          toast.success(t("taskDeleted", lang))
          await fetchTodos()
        }
      } catch {
        // Silently fail
      }
    },
    [fetchTodos, lang]
  )

  const handleFlagToggle = useCallback(
    async (todoId: string, currentFlagged: boolean, todoTitle: string) => {
      try {
        const res = await fetch(`/api/todos/${todoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flagged: !currentFlagged }),
        })
        if (res.ok) {
          audioManager.play("flag")
          logHistory(currentFlagged ? "update" : "flag", "task", todoId, todoTitle)
          await fetchTodos()
        }
      } catch {
        // Silently fail
      }
    },
    [fetchTodos]
  )

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

  const getSubtaskProgress = (subtasks: { id: string; title: string; completed: boolean }[]) => {
    if (!subtasks || subtasks.length === 0) return null
    const completed = subtasks.filter((s) => s.completed).length
    return { completed, total: subtasks.length, percent: Math.round((completed / subtasks.length) * 100) }
  }

  const incompleteTodos = sortedTodos.filter((todo) => !todo.completed)
  const completedTodos = sortedTodos.filter((todo) => todo.completed)

  // Render a single list item
  const renderListItem = (todo: typeof todos[0]) => {
    const subtaskProgress = getSubtaskProgress(todo.subtasks)

    return (
      <Card
        key={todo.id}
        className={cn(
          "group relative cursor-pointer rounded-xl border border-border/30 bg-card/80 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
          priorityBorderColors[todo.priority]
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
              {todo.important && (
                <Star className="size-3.5 shrink-0 text-amber-500" />
              )}
              {todo.flagged && (
                <Flag className="size-3.5 shrink-0 text-rose-500" />
              )}
            </div>
            {/* Description preview */}
            {todo.description && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground/70">
                {todo.description.length > 100
                  ? todo.description.slice(0, 100) + "..."
                  : todo.description}
              </p>
            )}
            {/* Subtask progress bar */}
            {subtaskProgress && (
              <div className="mt-1.5 flex items-center gap-2">
                <Progress
                  value={subtaskProgress.percent}
                  className="h-1.5 flex-1 bg-emerald-100 dark:bg-emerald-900/30 [&>[data-slot=progress-indicator]]:bg-emerald-500"
                />
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                  {subtaskProgress.completed}/{subtaskProgress.total}
                </span>
              </div>
            )}
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
          {/* Hover actions */}
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleFlagToggle(todo.id, todo.flagged, todo.title)
              }}
              className={cn(
                "rounded-md p-1 transition-colors hover:bg-muted",
                todo.flagged ? "text-rose-500" : "text-muted-foreground/40 hover:text-rose-500"
              )}
            >
              <Flag className="size-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(todo.id, todo.title)
              }}
              className="rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render a single grid card
  const renderGridCard = (todo: typeof todos[0]) => {
    const subtaskProgress = getSubtaskProgress(todo.subtasks)

    return (
      <Card
        key={todo.id}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-xl border border-border/30 bg-card/80 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        )}
        onClick={() => {
          setEditingItem(todo)
          setActiveModal("editTodo")
        }}
      >
        {/* Priority color accent bar on top */}
        <div className={cn("h-1 w-full", priorityAccentColors[todo.priority])} />
        <CardContent className="p-4">
          {/* Checkbox overlay */}
          <div className="flex items-start gap-2.5">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleComplete(todo.id, todo.completed)
              }}
              className="mt-0.5 shrink-0"
            >
              <Circle
                className={cn(
                  "size-4.5 transition-colors hover:text-emerald-500",
                  todo.priority === "high" && "text-rose-400",
                  todo.priority === "medium" && "text-amber-400",
                  todo.priority === "low" && "text-emerald-400"
                )}
              />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-1">
                <span className="truncate text-sm font-medium text-foreground">
                  {todo.title}
                </span>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFlagToggle(todo.id, todo.flagged, todo.title)
                    }}
                    className={cn(
                      "rounded-md p-0.5 transition-colors hover:bg-muted",
                      todo.flagged ? "text-rose-500" : "text-muted-foreground/40 hover:text-rose-500"
                    )}
                  >
                    <Flag className="size-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(todo.id, todo.title)
                    }}
                    className="rounded-md p-0.5 text-muted-foreground/40 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
              {todo.important && (
                <Star className="mt-0.5 size-3 text-amber-500" />
              )}
            </div>
          </div>

          {/* Description preview */}
          {todo.description && (
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground/70">
              {todo.description.length > 100
                ? todo.description.slice(0, 100) + "..."
                : todo.description}
            </p>
          )}

          {/* Subtask progress */}
          {subtaskProgress && (
            <div className="mt-2.5 flex items-center gap-2">
              <Progress
                value={subtaskProgress.percent}
                className="h-1.5 flex-1 bg-emerald-100 dark:bg-emerald-900/30 [&>[data-slot=progress-indicator]]:bg-emerald-500"
              />
              <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                {subtaskProgress.completed}/{subtaskProgress.total}
              </span>
            </div>
          )}

          {/* Tags and due date */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
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
            {todo.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="h-4 px-1.5 text-[9px] font-normal bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

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

      {/* Filter / Sort Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Priority Filter */}
        <Select
          value={priorityFilter}
          onValueChange={(val) => setPriorityFilter(val as PriorityFilter)}
        >
          <SelectTrigger size="sm" className="h-8 w-auto gap-1.5 rounded-lg border-emerald-200 bg-emerald-50/50 text-xs dark:border-emerald-800 dark:bg-emerald-950/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-muted-foreground/40" />
                {t("all", lang)}
              </span>
            </SelectItem>
            <SelectItem value="high">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-500" />
                {t("high", lang)}
              </span>
            </SelectItem>
            <SelectItem value="medium">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-500" />
                {t("medium", lang)}
              </span>
            </SelectItem>
            <SelectItem value="low">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                {t("low", lang)}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select
          value={sortBy}
          onValueChange={(val) => setSortBy(val as SortBy)}
        >
          <SelectTrigger size="sm" className="h-8 w-auto gap-1.5 rounded-lg border-emerald-200 bg-emerald-50/50 text-xs dark:border-emerald-800 dark:bg-emerald-950/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dateCreated">{t("dateCreated", lang)}</SelectItem>
            <SelectItem value="dueDate">{t("dueDate", lang)}</SelectItem>
            <SelectItem value="priority">{t("priority", lang)}</SelectItem>
            <SelectItem value="name">{t("name", lang)}</SelectItem>
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="ml-auto flex items-center rounded-lg border border-emerald-200 bg-emerald-50/50 p-0.5 dark:border-emerald-800 dark:bg-emerald-950/30">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
              viewMode === "list"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutList className="size-3.5" />
            {t("listView", lang)}
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
              viewMode === "grid"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="size-3.5" />
            {t("gridView", lang)}
          </button>
        </div>
      </div>

      {/* Incomplete tasks */}
      {incompleteTodos.length > 0 && (
        viewMode === "list" ? (
          <div className="space-y-1.5">
            {incompleteTodos.map((todo) => renderListItem(todo))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {incompleteTodos.map((todo) => renderGridCard(todo))}
          </div>
        )
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
                className="group relative cursor-pointer rounded-xl border border-border/20 bg-muted/30 transition-all hover:bg-muted/50"
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
                  {/* Hover actions for completed */}
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFlagToggle(todo.id, todo.flagged, todo.title)
                      }}
                      className={cn(
                        "rounded-md p-1 transition-colors hover:bg-muted",
                        todo.flagged ? "text-rose-500" : "text-muted-foreground/40 hover:text-rose-500"
                      )}
                    >
                      <Flag className="size-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(todo.id, todo.title)
                      }}
                      className="rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {sortedTodos.length === 0 && (
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
