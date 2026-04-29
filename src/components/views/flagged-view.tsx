"use client"

import { useCallback } from "react"
import {
  Flag,
  Circle,
  CheckCircle2,
  Star,
  Calendar,
  X,
  Tag,
  Pencil,
  Trash2,
  AlertTriangle,
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

export function FlaggedView() {
  const { todos, notes, setEditingItem, setActiveModal, fetchTodos, fetchNotes } = useAppStore()
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
      } catch (err) {
        console.error("Failed to delete note:", err)
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
      <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20 border border-rose-200/50 dark:border-rose-800/30 rounded-2xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/40">
              <Flag className="size-5 text-rose-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-foreground">
                {t("flagged", lang)}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalItems} {lang === "ar" ? "عنصر" : "items"} &middot; {t("flaggedItems", lang)}
              </p>
            </div>
            <Badge
              variant="secondary"
              className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
            >
              {totalItems}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Flagged Tasks */}
      {filteredTodos.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
            <Flag className="size-4 text-rose-500" />
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
                  "group cursor-pointer rounded-2xl bg-card/80 backdrop-blur-sm border border-l-[3px] border-l-rose-500 border-border/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
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
                    <Circle className="size-5 text-rose-400 hover:text-emerald-500 transition-colors" />
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
                              className="h-4 border-0 px-1 text-[8px] bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
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

      {/* Flagged Notes */}
      {filteredNotes.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
            <AlertTriangle className="size-4 text-rose-500" />
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
                  "group cursor-pointer rounded-2xl bg-card/80 backdrop-blur-sm border border-l-[3px] border-l-rose-500 border-border/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden"
                )}
                onClick={() => {
                  setEditingItem(note)
                  setActiveModal("editNote")
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Flag className="size-4 shrink-0 mt-0.5 text-rose-500" />
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
          icon={Flag}
          title={lang === "ar" ? "لا توجد عناصر مميزة" : "No flagged items"}
          description={
            lang === "ar"
              ? "ميز المهام والملاحظات بعلم لتظهر هنا"
              : "Flag tasks and notes to see them here"
          }
        />
      )}
    </div>
  )
}
