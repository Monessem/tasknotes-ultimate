"use client"

import {
  FolderOpen,
  Plus,
  CheckSquare,
  StickyNote,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface FoldersViewProps {
  onSelectFolder: (folderId: string) => void
}

export function FoldersView({ onSelectFolder }: FoldersViewProps) {
  const { folders, todos, notes, setEditingItem, setActiveModal } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language

  const getFolderItemCount = (folderId: string) => {
    const taskCount = todos.filter(
      (t) => t.folderId === folderId && !t.deletedAt
    ).length
    const noteCount = notes.filter(
      (n) => n.folderId === folderId && !n.deletedAt
    ).length
    return { taskCount, noteCount, total: taskCount + noteCount }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge
          variant="secondary"
          className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400"
        >
          {folders.length} {t("folders", lang).toLowerCase()}
        </Badge>
        <Button
          size="sm"
          onClick={() => setActiveModal("addFolder")}
          className="gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-600"
        >
          <Plus className="size-3.5" />
          {t("newFolder", lang)}
        </Button>
      </div>

      {/* Folders grid */}
      {folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-900/30">
            <FolderOpen className="size-7 text-teal-500" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            {t("noFolders", lang)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("noFoldersDesc", lang)}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => {
            const counts = getFolderItemCount(folder.id)

            return (
              <Card
                key={folder.id}
                className="group cursor-pointer rounded-xl border border-border/30 bg-card/80 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                onClick={() => onSelectFolder(folder.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl"
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
                      <h4 className="truncate text-sm font-semibold text-foreground">
                        {folder.name}
                      </h4>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <CheckSquare className="size-2.5" />
                          {counts.taskCount}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <StickyNote className="size-2.5" />
                          {counts.noteCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
