"use client"

import { useCallback } from "react"
import {
  Star,
  Circle,
  CheckCircle2,
  Flag,
  Calendar,
  Tag,
  X,
  Pin,
  Clock,
  Pencil,
  Trash2,
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

export function ImportantView() {
  const { todos, notes, setEditingItem, setActiveModal, fetchTodos, fetchNotes } = useAppStore()
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
      } catch {
        // Silently fail
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
      } catch {
        // Silently fail
      }
    },
    [fetchTodos]
  )

  const deleteNote = useCallback(
    async (noteId: string, noteTitle: string) => {
      try {
        const res = await fetch(`/api/notes/${noteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deletedAt: new Date().toISOString() }),
        })
        if (res.ok) {
          audioManager.play("delete")
          await logHistory("delete", "note", noteId, noteTitle)
          await fetchNotes()
        }
      } catch {
        // Silently fail
      }
    },
    [fetchNotes]
  )

  const priorityColors: Record<string, string> = {
    high: "bg-rose-500",
    medium: "bg-amber-500",
    low: "bg-emerald-500",
  }

  const totalItems = filteredTodos.length + filteredNotes.length

  return (
    <div className="space-y-5">
      {/* Summary Header Card */}
      <Card className="bg-gradient-to-br from-amber-50 to-emerald-50 dark:from-amber-950/30 dark:to-emerald-950/30 border border-amber-200/50 dark:border-amber-800/30 rounded-2xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
              <Star className="size-5 text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-foreground">
                {t("important", lang)}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalItems} {lang === "ar" ? "عنصر" : "items"} &middot; {t("importantItems", lang)}
              </p>
            </div>
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
            >
              {totalItems}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Important Tasks */}
      {filteredTodos.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
            <Star className="size-4 text-amber-500" />
            {t("todos", lang)}
            <Badge
              variant="outline"
              className="h-5 border-0 px-1.5 text-[10px]"
            >
              {filteredTodos.length}
            </Badge>
          </h3>
          <div className="space-y-2">
            {filteredTodos.map((todo) => (
              <Card
                key={todo.id}
                className={cn(
                  "group cursor-pointer rounded-2xl bg-card/80 backdrop-blur-sm border border-l-[3px] border-l-amber-500 border-border/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
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
                    <Circle className="size-5 text-amber-400 hover:text-emerald-500 transition-colors" />
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
                          <Calendar className="size-2.5" />
                          {new Date(todo.dueDate).toLocaleDateString(
                            lang === "ar" ? "ar-SA" : "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      )}
                      {todo.tags?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="size-2.5 text-muted-foreground/50" />
                          {todo.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="h-4 border-0 px-1 text-[8px] bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
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
            <Badge
              variant="outline"
              className="h-5 border-0 px-1.5 text-[10px]"
            >
              {filteredNotes.length}
            </Badge>
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                className={cn(
                  "group cursor-pointer rounded-2xl bg-card/80 backdrop-blur-sm border border-l-[3px] border-l-amber-500 border-border/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden"
                )}
                onClick={() => {
                  setEditingItem(note)
                  setActiveModal("editNote")
                }}
              >
                {/* Color bar on top */}
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: note.color || "#f59e0b" }}
                />
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="truncate text-sm font-medium text-foreground">
                          {note.title}
                        </h4>
                        {note.isPinned && (
                          <Pin className="size-3 shrink-0 text-amber-500" />
                        )}
                      </div>
                      {note.content && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {note.content}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-emerald-500"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingItem(note)
                          setActiveModal("editNote")
                        }}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-rose-500"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNote(note.id, note.title)
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
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
        <AnimatedEmptyState
          icon={Star}
          title={lang === "ar" ? "لا توجد عناصر مهمة" : "No important items"}
          description={
            lang === "ar"
              ? "حدد مهام كمهمة لتظهر هنا"
              : "Mark tasks as important to see them here"
          }
        />
      )}
    </div>
  )
}
