"use client"

import { useCallback, useState, useMemo, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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
  GripVertical,
  Copy,
  Sparkles,
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
import { TaskTemplates } from "@/components/task-templates"

type PriorityFilter = "all" | "high" | "medium" | "low"
type SortBy = "dateCreated" | "dueDate" | "priority" | "name"
type ViewMode = "list" | "grid"

// localStorage helper for todo order
const TODO_ORDER_KEY = "todo-order"

function getTodoOrder(): Record<string, number> {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem(TODO_ORDER_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveTodoOrder(order: Record<string, number>) {
  try {
    localStorage.setItem(TODO_ORDER_KEY, JSON.stringify(order))
  } catch {
    // Silently fail
  }
}

// Sortable Todo Item component for list view
function SortableTodoItem({
  todo,
  onToggleComplete,
  onEdit,
  onFlagToggle,
  onDelete,
  lang,
  priorityColors,
  priorityBorderColors,
  formatDate,
  getSubtaskProgress,
}: {
  todo: {
    id: string
    title: string
    description: string
    priority: "high" | "medium" | "low"
    completed: boolean
    flagged: boolean
    important: boolean
    dueDate: string | null
    tags: string[]
    subtasks: { id: string; title: string; completed: boolean }[]
  }
  onToggleComplete: (id: string, completed: boolean) => void
  onEdit: (todo: typeof todo) => void
  onFlagToggle: (id: string, flagged: boolean, title: string) => void
  onDelete: (id: string, title: string) => void
  lang: string
  priorityColors: Record<string, string>
  priorityBorderColors: Record<string, string>
  formatDate: (dateStr: string | null) => string | null
  getSubtaskProgress: (subtasks: { id: string; title: string; completed: boolean }[]) => { completed: number; total: number; percent: number } | null
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const subtaskProgress = getSubtaskProgress(todo.subtasks)

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative cursor-pointer rounded-xl border border-border/30 bg-card/80 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        priorityBorderColors[todo.priority],
        isDragging && "z-50 shadow-xl opacity-80 ring-2 ring-emerald-400/30"
      )}
      onClick={() => onEdit(todo)}
    >
      <CardContent className="flex items-center gap-3 p-3">
        {/* Drag handle */}
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 cursor-grab rounded p-0.5 text-muted-foreground/0 transition-colors hover:text-muted-foreground/60 active:cursor-grabbing group-hover:text-muted-foreground/40"
        >
          <GripVertical className="size-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleComplete(todo.id, todo.completed)
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
              {t(todo.priority, lang as "en" | "ar")}
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
              onFlagToggle(todo.id, todo.flagged, todo.title)
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
              onDelete(todo.id, todo.title)
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

export function TodosView() {
  const { todos, setEditingItem, setActiveModal, fetchTodos } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language
  const searchQuery = useAppStore((s) => s.searchQuery)

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all")
  const [sortBy, setSortBy] = useState<SortBy>("dateCreated")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [todoOrder, setTodoOrder] = useState<Record<string, number>>({})
  const [templatesOpen, setTemplatesOpen] = useState(false)

  // Load order from localStorage on mount
  useEffect(() => {
    setTodoOrder(getTodoOrder())
  }, [])

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

  // Sort - with localStorage sortOrder for incomplete tasks
  const sortedTodos = useMemo(() => {
    return [...priorityFiltered].sort((a, b) => {
      // Incomplete first always
      if (a.completed !== b.completed) return a.completed ? 1 : -1

      // For incomplete tasks, use sortOrder if available
      if (!a.completed && !b.completed) {
        const orderA = todoOrder[a.id]
        const orderB = todoOrder[b.id]
        if (orderA !== undefined && orderB !== undefined) {
          return orderA - orderB
        }
        if (orderA !== undefined) return -1
        if (orderB !== undefined) return 1
      }

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
  }, [priorityFiltered, sortBy, lang, todoOrder])

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
          const data = await res.json()
          if (!completed) {
            audioManager.play("complete")
            logHistory("complete", "task", todoId, todos.find((t) => t.id === todoId)?.title || "")
            // Check for recurring task next occurrence
            if (data.nextOccurrence) {
              toast.success(t("taskCompleted", lang), {
                description: t("nextOccurrenceCreated", lang),
              })
            }
          } else {
            audioManager.play("click")
          }
          await fetchTodos()
        }
      } catch {
        // Silently fail
      }
    },
    [fetchTodos, todos, lang]
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

  const handleDuplicate = useCallback(
    async (todo: typeof todos[0]) => {
      try {
        const res = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${todo.title} (copy)`,
            description: todo.description,
            priority: todo.priority,
            folderId: todo.folderId,
            tags: todo.tags,
            subtasks: todo.subtasks.map((s: { id: string; title: string; completed: boolean }) => ({
              id: crypto.randomUUID(),
              title: s.title,
              completed: false,
            })),
            important: todo.important,
            recurring: todo.recurring,
          }),
        })
        if (res.ok) {
          audioManager.play("click")
          const newTodo = await res.json()
          logHistory("create", "task", newTodo.id, `${todo.title} (copy)`)
          toast.success(t("taskCreated", lang))
          await fetchTodos()
        }
      } catch {
        // Silently fail
      }
    },
    [fetchTodos, lang]
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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end for reordering
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const activeId = String(active.id)
      const overId = String(over.id)

      const oldIndex = incompleteTodos.findIndex((t) => t.id === activeId)
      const newIndex = incompleteTodos.findIndex((t) => t.id === overId)

      if (oldIndex === -1 || newIndex === -1) return

      // Create the new order
      const reordered = arrayMove(incompleteTodos, oldIndex, newIndex)
      const newOrder: Record<string, number> = {}
      reordered.forEach((todo, index) => {
        newOrder[todo.id] = index
      })

      saveTodoOrder(newOrder)
      setTodoOrder(newOrder)
    },
    [incompleteTodos]
  )

  // Render a single list item (non-sortable, for completed tasks)
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
                handleDuplicate(todo)
              }}
              className="rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground"
              title={t("duplicate", lang)}
            >
              <Copy className="size-3.5" />
            </button>
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
                      handleDuplicate(todo)
                    }}
                    className="rounded-md p-0.5 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground"
                    title={t("duplicate", lang)}
                  >
                    <Copy className="size-3" />
                  </button>
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

        {/* Templates button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setTemplatesOpen(true)}
          className="h-8 gap-1.5 rounded-lg border-emerald-200 bg-emerald-50/50 text-xs text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
        >
          <Sparkles className="size-3.5" />
          {t("useTemplate", lang)}
        </Button>

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={incompleteTodos.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {incompleteTodos.map((todo) => (
                  <SortableTodoItem
                    key={todo.id}
                    todo={todo}
                    onToggleComplete={toggleComplete}
                    onEdit={(t) => {
                      setEditingItem(t as typeof todo)
                      setActiveModal("editTodo")
                    }}
                    onFlagToggle={handleFlagToggle}
                    onDelete={handleDelete}
                    lang={lang}
                    priorityColors={priorityColors}
                    priorityBorderColors={priorityBorderColors}
                    formatDate={formatDate}
                    getSubtaskProgress={getSubtaskProgress}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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

      {/* Task Templates Dialog */}
      <TaskTemplates open={templatesOpen} onOpenChange={setTemplatesOpen} />

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
