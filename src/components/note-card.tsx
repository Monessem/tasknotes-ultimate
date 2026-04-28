"use client"

import { useState } from "react"
import { Pin, Flag, FolderOpen, CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { useAppStore, type Note } from "@/store/app-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface NoteCardProps {
  note: Note
}

export function NoteCard({ note }: NoteCardProps) {
  const { folders, settings, setActiveModal, setEditingItem } = useAppStore()
  const lang = settings.language
  const [hovered, setHovered] = useState(false)

  const folder = folders.find((f) => f.id === note.folderId)
  const checklist = note.checklist || []
  const completedItems = checklist.filter((item) => item.completed).length

  const handleEdit = () => {
    setEditingItem(note)
    setActiveModal("editNote")
  }

  const handleToggleFlag = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagged: !note.flagged }),
      })
      if (res.ok) {
        const { fetchNotes } = useAppStore.getState()
        await fetchNotes()
      }
    } catch (err) {
      console.error("Failed to toggle flag:", err)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
        month: "short",
        day: "numeric",
      })
    } catch {
      return ""
    }
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer",
        note.isPinned && "ring-1 ring-amber-500/30"
      )}
      onClick={handleEdit}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Color bar */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: note.color || "#6366f1" }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="mb-2 flex items-start gap-2">
          <h3 className="flex-1 truncate text-sm font-bold text-foreground">
            {note.title}
          </h3>
          {note.isPinned && (
            <Pin className="size-3.5 shrink-0 rotate-45 text-amber-500" />
          )}
        </div>

        {/* Content preview */}
        {note.content && (
          <p className="mb-3 line-clamp-4 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {note.content}
          </p>
        )}

        {/* Checklist progress */}
        {checklist.length > 0 && (
          <div className="mb-3">
            <div className="mb-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${Math.round((completedItems / checklist.length) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">
                {completedItems}/{checklist.length}
              </span>
            </div>
            <div className="space-y-1">
              {checklist.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-1.5 text-[11px]"
                >
                  {item.completed ? (
                    <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="size-3 shrink-0 text-muted-foreground/50" />
                  )}
                  <span
                    className={cn(
                      "truncate",
                      item.completed
                        ? "text-muted-foreground line-through"
                        : "text-foreground/70"
                    )}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
              {checklist.length > 4 && (
                <span className="text-[10px] text-muted-foreground">
                  +{checklist.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/70">
            {formatDate(note.createdAt)}
          </span>

          {folder && (
            <Badge
              variant="secondary"
              className="gap-1 px-1.5 py-0 text-[10px] font-normal"
              style={{
                backgroundColor: `${folder.color}15`,
                color: folder.color,
                borderColor: `${folder.color}30`,
              }}
            >
              <FolderOpen className="size-2.5" />
              {folder.name}
            </Badge>
          )}

          <div className="flex-1" />

          {/* Action buttons - shown on hover */}
          <div
            className={cn(
              "flex items-center gap-0.5 transition-opacity duration-150",
              hovered ? "opacity-100" : "opacity-0"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="size-6 rounded-md"
              onClick={handleToggleFlag}
              aria-label={note.flagged ? t("unflag", lang) : t("flag", lang)}
            >
              <Flag
                className={cn(
                  "size-3",
                  note.flagged
                    ? "fill-rose-500 text-rose-500"
                    : "text-muted-foreground"
                )}
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
