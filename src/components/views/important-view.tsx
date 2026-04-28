"use client"

import { useCallback } from "react"
import {
  Star,
  Circle,
  CheckCircle2,
  Flag,
  Calendar,
  Tag,
  ChevronRight,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ImportantView() {
  const { todos, notes, setEditingItem, setActiveModal, fetchTodos } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language
  const searchQuery = useAppStore((s) => s.searchQuery)

  const importantTodos = todos.filter(
    (todo) => todo.important && !todo.deletedAt && !todo.completed
  )
  const importantNotes = notes.filter(
    (note) => note.flagged && !note.deletedAt
  )

  // Apply search filter
  const filteredTodos = searchQuery
    ? importantTodos.filter(
        (todo) =>
          todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          todo.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : importantTodos

  const filteredNotes = searchQuery
    ? importantNotes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : importantNotes

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

  const priorityColors: Record<string, string> = {
    high: "bg-rose-500",
    medium: "bg-amber-500",
    low: "bg-emerald-500",
  }

  const totalItems = filteredTodos.length + filteredNotes.length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
        >
          {totalItems} {lang === "ar" ? "عنصر" : "items"}
        </Badge>
      </div>

      {/* Important Tasks */}
      {filteredTodos.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
            <Star className="size-4 text-amber-500" />
            {t("todos", lang)}
          </h3>
          <div className="space-y-1.5">
            {filteredTodos.map((todo) => (
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
                    <Circle className="size-5 text-amber-400 hover:text-emerald-500" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {todo.title}
                      </span>
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
                          {new Date(todo.dueDate).toLocaleDateString(
                            lang === "ar" ? "ar-SA" : "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/30" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Important Notes */}
      {filteredNotes.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
            <Flag className="size-4 text-rose-500" />
            {t("notes", lang)}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                className="group cursor-pointer rounded-xl border border-border/30 bg-card/80 backdrop-blur-sm transition-all hover:shadow-md"
                onClick={() => {
                  setEditingItem(note)
                  setActiveModal("editNote")
                }}
              >
                <CardContent className="p-3">
                  <h4 className="truncate text-sm font-medium text-foreground">
                    {note.title}
                  </h4>
                  {note.content && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {note.content}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalItems === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
            <Star className="size-7 text-amber-500" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            {lang === "ar"
              ? "لا توجد عناصر مهمة"
              : "No important items"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === "ar"
              ? "حدد مهام كمهمة لتظهر هنا"
              : "Mark tasks as important to see them here"}
          </p>
        </div>
      )}
    </div>
  )
}
