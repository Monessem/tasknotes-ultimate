"use client"

import { useState, useCallback } from "react"
import {
  Trash2,
  RotateCcw,
  CheckSquare,
  StickyNote,
  Target,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { useAppStore, type Todo, type Note } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { audioManager } from "@/lib/audio"
import { logHistory } from "@/lib/history-log"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

type DeletedItem = {
  id: string
  title: string
  type: "task" | "note"
  deletedAt: string
  original: Todo | Note
}

export function RecycleView() {
  const { todos, notes, fetchTodos, fetchNotes } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language
  const [restoring, setRestoring] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Build deleted items list
  const deletedTodos = todos
    .filter((todo) => todo.deletedAt !== null)
    .map(
      (todo): DeletedItem => ({
        id: todo.id,
        title: todo.title,
        type: "task",
        deletedAt: todo.deletedAt!,
        original: todo,
      })
    )

  const deletedNotes = notes
    .filter((note) => note.deletedAt !== null)
    .map(
      (note): DeletedItem => ({
        id: note.id,
        title: note.title,
        type: "note",
        deletedAt: note.deletedAt!,
        original: note,
      })
    )

  const deletedItems = [...deletedTodos, ...deletedNotes].sort(
    (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
  )

  const handleRestore = useCallback(
    async (item: DeletedItem) => {
      setRestoring(item.id)
      try {
        const endpoint =
          item.type === "task" ? `/api/todos/${item.id}` : `/api/notes/${item.id}`
        const res = await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deletedAt: null }),
        })
        if (res.ok) {
          audioManager.play("click")
          logHistory("restore", item.type, item.id, item.title)
          toast.success(t("itemRestored", lang))
          await Promise.all([fetchTodos(), fetchNotes()])
        }
      } catch (err) {
        console.error("Failed to restore item:", err)
      } finally {
        setRestoring(null)
      }
    },
    [fetchTodos, fetchNotes, lang]
  )

  const handlePermanentDelete = useCallback(
    async (item: DeletedItem) => {
      setDeleting(item.id)
      try {
        const endpoint =
          item.type === "task" ? `/api/todos/${item.id}?permanent=true` : `/api/notes/${item.id}?permanent=true`
        const res = await fetch(endpoint, {
          method: "DELETE",
        })
        if (res.ok) {
          audioManager.play("delete")
          toast.success(t("itemPermanentlyDeleted", lang))
          await Promise.all([fetchTodos(), fetchNotes()])
        }
      } catch (err) {
        console.error("Failed to permanently delete item:", err)
      } finally {
        setDeleting(null)
      }
    },
    [fetchTodos, fetchNotes, lang]
  )

  const handleEmptyBin = useCallback(async () => {
    try {
      const promises = deletedItems.map(async (item) => {
        const endpoint =
          item.type === "task" ? `/api/todos/${item.id}?permanent=true` : `/api/notes/${item.id}?permanent=true`
        return fetch(endpoint, { method: "DELETE" })
      })

      await Promise.all(promises)
      audioManager.play("delete")
      toast.success(t("binEmptied", lang))
      await Promise.all([fetchTodos(), fetchNotes()])
    } catch (err) {
      console.error("Failed to empty recycle bin:", err)
    }
  }, [deletedItems, fetchTodos, fetchNotes, lang])

  const getTypeIcon = (type: DeletedItem["type"]) => {
    switch (type) {
      case "task":
        return CheckSquare
      case "note":
        return StickyNote
    }
  }

  const getTypeLabel = (type: DeletedItem["type"]) => {
    switch (type) {
      case "task":
        return t("todos", lang)
      case "note":
        return t("notes", lang)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return lang === "ar" ? "اليوم" : "Today"
    if (diffDays === 1) return lang === "ar" ? "أمس" : "Yesterday"
    if (diffDays < 7) return lang === "ar" ? `منذ ${diffDays} أيام` : `${diffDays} days ago`
    return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
    })
  }

  if (deletedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
          <Trash2 className="size-7 text-emerald-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">
          {t("noDeletedItems", lang)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("deletedItemsAppear", lang)}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with empty bin */}
      <div className="flex items-center justify-between">
        <Badge
          variant="secondary"
          className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
        >
          {deletedItems.length} {lang === "ar" ? "عنصر" : "items"}
        </Badge>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:hover:bg-rose-950"
            >
              <Trash2 className="size-3.5" />
              {t("emptyBin", lang)}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-rose-500" />
                {t("emptyBin", lang)}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("cannotUndo", lang)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel", lang)}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleEmptyBin}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {t("emptyBin", lang)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Deleted items list */}
      <div className="space-y-2">
        {deletedItems.map((item) => {
          const TypeIcon = getTypeIcon(item.type)
          const isRestoring = restoring === item.id
          const isDeleting = deleting === item.id

          return (
            <Card
              key={`${item.type}-${item.id}`}
              className="group rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:shadow-md"
            >
              <CardContent className="flex items-center gap-3 p-4">
                {/* Type icon */}
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    item.type === "task" &&
                      "bg-emerald-100 dark:bg-emerald-900/30",
                    item.type === "note" &&
                      "bg-amber-100 dark:bg-amber-900/30"
                  )}
                >
                  <TypeIcon
                    className={cn(
                      "size-4",
                      item.type === "task" &&
                        "text-emerald-600 dark:text-emerald-400",
                      item.type === "note" &&
                        "text-amber-600 dark:text-amber-400"
                    )}
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="h-5 border-0 px-1.5 text-[10px] font-medium"
                    >
                      {getTypeLabel(item.type)}
                    </Badge>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="size-2.5" />
                      {formatDate(item.deletedAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRestore(item)}
                    disabled={isRestoring}
                    className="size-8 rounded-lg text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                    title={t("restore", lang)}
                  >
                    <RotateCcw className="size-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isDeleting}
                        className="size-8 rounded-lg text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/30"
                        title={t("permanentDelete", lang)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="size-5 text-rose-500" />
                          {t("permanentDelete", lang)}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("cannotUndo", lang)}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel", lang)}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handlePermanentDelete(item)}
                          className="bg-rose-600 hover:bg-rose-700"
                        >
                          {t("delete", lang)}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
