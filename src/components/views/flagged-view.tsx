"use client"

import { useCallback } from "react"
import {
  Flag,
  Circle,
  CheckCircle2,
  Star,
  Calendar,
  ChevronRight,
  StickyNote,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function FlaggedView() {
  const { todos, notes, setEditingItem, setActiveModal, fetchTodos } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language
  const searchQuery = useAppStore((s) => s.searchQuery)

  const flaggedTodos = todos.filter(
    (todo) => todo.flagged && !todo.deletedAt && !todo.completed
  )
  const flaggedNotes = notes.filter(
    (note) => note.flagged && !note.deletedAt
  )

  // Apply search
  const filteredTodos = searchQuery
    ? flaggedTodos.filter(
        (todo) =>
          todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          todo.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : flaggedTodos

  const filteredNotes = searchQuery
    ? flaggedNotes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : flaggedNotes

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
          className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
        >
          {totalItems} {lang === "ar" ? "عنصر" : "items"}
        </Badge>
      </div>

      {/* Flagged Tasks */}
      {filteredTodos.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
            <Flag className="size-4 text-rose-500" />
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
                    <Circle className="size-5 text-rose-400 hover:text-emerald-500" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {todo.title}
                      </span>
                      {todo.important && (
                        <Star className="size-3.5 shrink-0 text-amber-500" />
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

      {/* Flagged Notes */}
      {filteredNotes.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
            <StickyNote className="size-4 text-amber-500" />
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
                  <div className="flex items-start gap-2">
                    <Flag className="size-3.5 shrink-0 text-rose-500" />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium text-foreground">
                        {note.title}
                      </h4>
                      {note.content && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {note.content}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalItems === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/30">
            <Flag className="size-7 text-rose-500" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            {lang === "ar"
              ? "لا توجد عناصر مميزة"
              : "No flagged items"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === "ar"
              ? "ميز المهام والملاحظات بعلم لتظهر هنا"
              : "Flag tasks and notes to see them here"}
          </p>
        </div>
      )}
    </div>
  )
}
