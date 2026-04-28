"use client"

import {
  ArrowLeft,
  CheckSquare,
  StickyNote,
  FolderOpen,
  Star,
  Flag,
  ChevronRight,
} from "lucide-react"
import { useAppStore, type ViewType } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface FolderDetailViewProps {
  folderId: string
  onBack: () => void
}

export function FolderDetailView({ folderId, onBack }: FolderDetailViewProps) {
  const { todos, notes, folders } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language

  const folder = folders.find((f) => f.id === folderId)

  const folderTodos = todos.filter(
    (todo) => todo.folderId === folderId && !todo.deletedAt
  )
  const folderNotes = notes.filter(
    (note) => note.folderId === folderId && !note.deletedAt
  )

  if (!folder) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted/50">
          <FolderOpen className="size-7 text-muted-foreground" />
        </div>
        <p className="text-lg font-semibold text-foreground">
          {lang === "ar" ? "المجلد غير موجود" : "Folder not found"}
        </p>
        <Button
          variant="outline"
          onClick={onBack}
          className="mt-4 gap-2 rounded-xl"
        >
          <ArrowLeft className="size-4" />
          {lang === "ar" ? "العودة" : "Go back"}
        </Button>
      </div>
    )
  }

  const totalItems = folderTodos.length + folderNotes.length

  return (
    <div className="space-y-5">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="size-9 rounded-xl"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div
          className="flex size-10 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${folder.color}20`,
          }}
        >
          <FolderOpen
            className="size-5"
            style={{ color: folder.color }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-foreground">
            {folder.name}
          </h2>
          <p className="text-xs text-muted-foreground">
            {totalItems} {lang === "ar" ? "عنصر" : "items"}
          </p>
        </div>
      </div>

      {/* Tasks section */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <CheckSquare className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-sm font-bold text-foreground">
            {t("todos", lang)}
          </h3>
          <Badge
            variant="secondary"
            className="h-5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
          >
            {folderTodos.length}
          </Badge>
        </div>

        {folderTodos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 py-8 text-center">
            <CheckSquare className="mx-auto mb-2 size-5 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              {t("noTasks", lang)}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {folderTodos.map((todo) => (
              <Card
                key={todo.id}
                className="rounded-xl border border-border/30 bg-card/80 backdrop-blur-sm transition-all hover:shadow-sm"
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <div
                    className={cn(
                      "size-2.5 rounded-full",
                      todo.priority === "high" && "bg-rose-500",
                      todo.priority === "medium" && "bg-amber-500",
                      todo.priority === "low" && "bg-emerald-500"
                    )}
                  />
                  <span
                    className={cn(
                      "flex-1 truncate text-sm font-medium",
                      todo.completed
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    )}
                  >
                    {todo.title}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    {todo.important && (
                      <Star className="size-3.5 text-amber-500" />
                    )}
                    {todo.flagged && (
                      <Flag className="size-3.5 text-rose-500" />
                    )}
                    <ChevronRight className="size-3.5 text-muted-foreground/50" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Notes section */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <StickyNote className="size-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-sm font-bold text-foreground">
            {t("notes", lang)}
          </h3>
          <Badge
            variant="secondary"
            className="h-5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
          >
            {folderNotes.length}
          </Badge>
        </div>

        {folderNotes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 py-8 text-center">
            <StickyNote className="mx-auto mb-2 size-5 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              {t("noNotes", lang)}
            </p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {folderNotes.map((note) => (
              <Card
                key={note.id}
                className="rounded-xl border border-border/30 bg-card/80 backdrop-blur-sm transition-all hover:shadow-sm"
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-foreground">
                      {note.title}
                    </h4>
                    {note.isPinned && (
                      <Star className="size-3 shrink-0 text-amber-500" />
                    )}
                  </div>
                  {note.content && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {note.content}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Empty folder state */}
      {totalItems === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div
            className="mb-3 flex size-14 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: `${folder.color}15`,
            }}
          >
            <FolderOpen
              className="size-6"
              style={{ color: folder.color }}
            />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {lang === "ar"
              ? "هذا المجلد فارغ"
              : "This folder is empty"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground/70">
            {lang === "ar"
              ? "أضف مهام أو ملاحظات إلى هذا المجلد"
              : "Add tasks or notes to this folder"}
          </p>
        </div>
      )}
    </div>
  )
}
