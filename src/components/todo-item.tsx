"use client"

import { useState } from "react"
import { useAppStore, type Todo } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Flag,
  Pencil,
  Trash2,
  Calendar,
  Star,
  ListChecks,
} from "lucide-react"

interface TodoItemProps {
  todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
  const { settings, setActiveModal, setEditingItem, fetchTodos } = useAppStore()
  const lang = settings.language
  const [isHovered, setIsHovered] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const dueDate = todo.dueDate ? new Date(todo.dueDate) : null
  const isOverdue = dueDate && dueDate < new Date() && !todo.completed
  const todayStr = new Date().toISOString().split("T")[0]
  const isToday = todo.dueDate?.startsWith(todayStr)

  // Subtask progress
  const hasSubtasks = todo.subtasks && todo.subtasks.length > 0
  const completedSubtasks = todo.subtasks?.filter((s) => s.completed).length ?? 0
  const subtaskProgress = hasSubtasks
    ? Math.round((completedSubtasks / todo.subtasks.length) * 100)
    : 0

  const priorityColors: Record<string, string> = {
    high: "bg-rose-500",
    medium: "bg-amber-500",
    low: "bg-emerald-500",
  }

  const priorityBorderColors: Record<string, string> = {
    high: "border-l-rose-500",
    medium: "border-l-amber-500",
    low: "border-l-emerald-500",
  }

  const priorityBadgeColors: Record<string, string> = {
    high: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  }

  async function handleToggleComplete() {
    setIsToggling(true)
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: !todo.completed,
          completedAt: !todo.completed ? new Date().toISOString() : null,
        }),
      })
      if (res.ok) {
        await fetchTodos()
      }
    } catch (e) {
      console.error("Failed to toggle todo:", e)
    } finally {
      setIsToggling(false)
    }
  }

  async function handleToggleFlag(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagged: !todo.flagged }),
      })
      if (res.ok) {
        await fetchTodos()
      }
    } catch (e) {
      console.error("Failed to toggle flag:", e)
    }
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setEditingItem(todo)
    setActiveModal("editTodo")
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        await fetchTodos()
      }
    } catch (e) {
      console.error("Failed to delete todo:", e)
    }
  }

  function formatDate(date: Date): string {
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return t("today", lang)
    if (diffDays === 1) return t("tomorrow", lang) || "Tomorrow"
    if (diffDays === -1) return t("yesterday", lang) || "Yesterday"
    if (diffDays > 0 && diffDays <= 7) {
      return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
        weekday: "short",
      })
    }
    return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-xl border border-border/30 bg-card/80 px-4 py-3 transition-all hover:bg-muted/30",
        priorityBorderColors[todo.priority] || "border-l-transparent",
        "border-l-3",
        todo.completed && "opacity-60"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox */}
      <div className="pt-0.5">
        <Checkbox
          checked={todo.completed}
          onCheckedChange={handleToggleComplete}
          disabled={isToggling}
          className={cn(
            "size-5 rounded-full border-2 transition-all",
            todo.completed
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-muted-foreground/40 hover:border-emerald-500"
          )}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-2">
          {todo.important && (
            <Star className="size-3.5 shrink-0 fill-amber-500 text-amber-500" />
          )}
          <span
            className={cn(
              "text-sm font-medium text-foreground truncate",
              todo.completed && "line-through text-muted-foreground"
            )}
          >
            {todo.title}
          </span>
        </div>

        {/* Meta row */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {/* Priority dot */}
          <div
            className={cn(
              "size-2 rounded-full shrink-0",
              priorityColors[todo.priority] || priorityColors.medium
            )}
          />

          {/* Priority badge */}
          {todo.priority && (
            <span
              className={cn(
                "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                priorityBadgeColors[todo.priority]
              )}
            >
              {t(todo.priority, lang)}
            </span>
          )}

          {/* Due date */}
          {todo.dueDate && dueDate && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                isOverdue
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                  : isToday
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
              )}
            >
              <Calendar className="size-2.5" />
              {formatDate(dueDate)}
            </span>
          )}

          {/* Recurring */}
          {todo.recurring && (
            <span className="inline-flex items-center gap-1 rounded-md bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              {t(todo.recurring, lang)}
            </span>
          )}

          {/* Tags */}
          {todo.tags?.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="h-5 px-1.5 text-[10px] font-normal"
            >
              #{tag}
            </Badge>
          ))}

          {/* Flag indicator */}
          {todo.flagged && (
            <Flag className="size-3 fill-rose-500 text-rose-500" />
          )}
        </div>

        {/* Subtask progress */}
        {hasSubtasks && (
          <div className="mt-2 flex items-center gap-2">
            <ListChecks className="size-3 text-muted-foreground" />
            <Progress
              value={subtaskProgress}
              className="h-1.5 flex-1 bg-muted"
            />
            <span className="text-[10px] text-muted-foreground">
              {completedSubtasks}/{todo.subtasks.length}
            </span>
          </div>
        )}
      </div>

      {/* Actions - visible on hover */}
      <div
        className={cn(
          "flex items-center gap-0.5 shrink-0 transition-opacity",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={handleEdit}
          title={t("edit", lang)}
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-7", todo.flagged && "text-rose-500")}
          onClick={handleToggleFlag}
          title={todo.flagged ? t("unflag", lang) : t("flag", lang)}
        >
          <Flag
            className={cn("size-3.5", todo.flagged && "fill-rose-500")}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:text-destructive"
          onClick={handleDelete}
          title={t("delete", lang)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
